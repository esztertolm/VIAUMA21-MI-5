import os
import asyncio
from typing import Optional
import json

import httpx
import websockets
import assemblyai as aai
from fastapi import (
    File,
    UploadFile,
    HTTPException,
    Form,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Request


# Import unified API router
# from api import router as api_router


router = APIRouter(prefix="/transcription", tags=["Transcribe"])



def _get_assemblyai_api_key() -> str:
    """Get AssemblyAI API key from environment variable."""
    api_key = os.environ.get("ASSEMBLYAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="ASSEMBLYAI_API_KEY not set in environment"
        )
    return api_key


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/assemblyai/test-token")
async def test_assemblyai_token():
    """Test endpoint to verify AssemblyAI token generation."""
    try:
        api_key = _get_assemblyai_api_key()

        async with httpx.AsyncClient() as client:
            token_response = await client.get(
                "https://streaming.assemblyai.com/v3/token",
                headers={"Authorization": api_key},
                params={"expires_in_seconds": 600},
            )

            if token_response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Token request failed: {token_response.status_code}",
                    "details": token_response.text,
                }

            token_data = token_response.json()
            return {
                "success": True,
                "token_length": len(token_data.get("token", "")),
                "expires_at": token_data.get("expires_at"),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/assemblyai/transcribe")
async def assemblyai_transcribe(
    audio: UploadFile = File(...),
    speaker_labels: bool = Form(True),
    speakers_expected: Optional[int] = Form(None),
    min_speakers: Optional[int] = Form(None),
    max_speakers: Optional[int] = Form(None),
    language_code: Optional[str] = Form(None),
):
    try:
        print(
            speaker_labels, speakers_expected, min_speakers, max_speakers, language_code
        )
        # Get API key and configure AssemblyAI
        api_key = _get_assemblyai_api_key()
        aai.settings.api_key = api_key

        # Save uploaded file temporarily
        import tempfile

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(audio.filename)[1]
        ) as tmp_file:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            # Configure transcription
            config_params = {}

            # Language configuration
            if language_code:
                # Check if multiple languages (comma-separated)
                if "," in language_code:
                    # Multiple languages for automatic detection
                    languages = [lang.strip() for lang in language_code.split(",")]
                    config_params["language_code"] = languages[0]  # Primary language
                    config_params["language_detection"] = True
                else:
                    # Single language code
                    config_params["language_code"] = language_code
            else:
                # Enable automatic language detection when no language specified
                config_params["language_detection"] = True

            # config_params["language_code"] = "hu"
            if speaker_labels:
                config_params["speaker_labels"] = True

                # Set speaker count if specified
                if speakers_expected is not None:
                    config_params["speakers_expected"] = speakers_expected
                elif min_speakers is not None or max_speakers is not None:
                    # Use speaker_options for min/max range
                    speaker_options = {}
                    if min_speakers is not None:
                        speaker_options["min_speakers_expected"] = min_speakers
                    if max_speakers is not None:
                        speaker_options["max_speakers_expected"] = max_speakers
                    config_params["speaker_options"] = speaker_options

            config = aai.TranscriptionConfig(**config_params)
            print(config)
            # Transcribe
            transcriber = aai.Transcriber()
            transcript = transcriber.transcribe(tmp_file_path, config)

            # Check for errors
            if transcript.status == aai.TranscriptStatus.error:
                raise HTTPException(
                    status_code=500, detail=f"Transcription failed: {transcript.error}"
                )

            # Build response with all requested information
            response_data = {
                "id": transcript.id,
                "status": transcript.status.value,
                "text": transcript.text,
                "language_code": (
                    transcript.language_code
                    if hasattr(transcript, "language_code")
                    else None
                ),
            }

            # Add utterances with speaker labels if enabled
            if speaker_labels and transcript.utterances:
                utterances = []
                for utterance in transcript.utterances:
                    utt_data = {
                        "speaker": utterance.speaker,
                        "text": utterance.text,
                        "start": utterance.start,
                        "end": utterance.end,
                        "confidence": utterance.confidence,
                    }

                    # Add word-level details
                    if utterance.words:
                        utt_data["words"] = [
                            {
                                "text": word.text,
                                "start": word.start,
                                "end": word.end,
                                "confidence": word.confidence,
                                "speaker": word.speaker,
                            }
                            for word in utterance.words
                        ]

                    utterances.append(utt_data)

                response_data["utterances"] = utterances

            # Add word-level timestamps for the entire transcript
            if transcript.words:
                response_data["words"] = [
                    {
                        "text": word.text,
                        "start": word.start,
                        "end": word.end,
                        "confidence": word.confidence,
                    }
                    for word in transcript.words
                ]

            # Add confidence score
            if hasattr(transcript, "confidence"):
                response_data["confidence"] = transcript.confidence

            # Add audio duration
            if hasattr(transcript, "audio_duration"):
                response_data["audio_duration"] = transcript.audio_duration

            print(response_data)
            return JSONResponse(content=response_data)

        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_file_path)
            except:
                pass

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AssemblyAI transcription error: {str(e)}"
        )


@router.websocket("/assemblyai/transcribe/live")
async def assemblyai_transcribe_live(websocket: WebSocket):
    await websocket.accept()
    assemblyai_ws = None
    is_shutting_down = False  # Flag to coordinate shutdown

    try:
        # Get API key
        api_key = _get_assemblyai_api_key()

        async with httpx.AsyncClient() as client:
            token_response = await client.get(
                "https://streaming.assemblyai.com/v3/token",
                headers={"Authorization": api_key},
                params={"expires_in_seconds": 600},  # 10 minutes
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=token_response.status_code,
                    detail=f"Failed to create token: {token_response.text}",
                )

            token_data = token_response.json()
            token = token_data["token"]

        ws_url = f"wss://streaming.assemblyai.com/v3/ws?token={token}&sample_rate=16000&encoding=pcm_s16le&format_turns=true"
        print(f"[Backend] Connecting to AssemblyAI WebSocket...")
        print(
            f"[Backend] URL: wss://streaming.assemblyai.com/v3/ws?token=***&sample_rate=16000&encoding=pcm_s16le"
        )
        try:
            assemblyai_ws = await websockets.connect(ws_url)
            print(f"[Backend] Connected to AssemblyAI successfully")
        except Exception as e:
            print(f"[Backend] Failed to connect to AssemblyAI: {e}")
            await websocket.send_json(
                {
                    "type": "error",
                    "message": f"Failed to connect to AssemblyAI: {str(e)}",
                }
            )
            return

        # Task to forward messages from AssemblyAI to client
        async def forward_from_assemblyai():
            nonlocal is_shutting_down
            try:
                async for message in assemblyai_ws:
                    # Check if we're shutting down before processing
                    if is_shutting_down:
                        print(f"[Backend] Shutdown in progress, skipping message")
                        break
                        
                    data = json.loads(message)
                    msg_type = data.get("type")
                    print(f"[AssemblyAI] Received: {msg_type}")  # Debug log

                    # Session begins
                    if msg_type == "Begin":
                        await websocket.send_json(
                            {
                                "type": "session_begins",
                                "session_id": data.get("id"),
                                "expires_at": data.get("expires_at"),
                            }
                        )

                    # Turn (transcript)
                    elif msg_type == "Turn":
                        print(
                            f"[AssemblyAI] Turn data: {json.dumps(data, indent=2)}"
                        )  # Debug: see full Turn structure

                        try:
                            turn_data = {
                                "type": (
                                    "final_transcript"
                                    if data.get("end_of_turn")
                                    else "partial_transcript"
                                ),
                                "text": data.get("transcript", ""),
                                "end_of_turn": data.get("end_of_turn", False),
                                "turn_is_formatted": data.get(
                                    "turn_is_formatted", False
                                ),
                                "turn_order": data.get("turn_order"),
                            }

                            # Add words with timestamps and confidence
                            if "words" in data:
                                turn_data["words"] = [
                                    {
                                        "text": word.get("text"),
                                        "start": word.get("start"),
                                        "end": word.get("end"),
                                        "confidence": word.get("confidence"),
                                        "word_is_final": word.get(
                                            "word_is_final", False
                                        ),
                                    }
                                    for word in data["words"]
                                ]

                            # Add end of turn confidence
                            if "end_of_turn_confidence" in data:
                                turn_data["confidence"] = data["end_of_turn_confidence"]

                            print(
                                f"[Backend] Forwarding transcript to client: '{turn_data['text']}'"
                            )
                            await websocket.send_json(turn_data)
                            print(f"[Backend] Transcript sent successfully")
                        except (WebSocketDisconnect, RuntimeError) as e:
                            if "close message has been sent" in str(e) or isinstance(e, WebSocketDisconnect):
                                print(f"[Backend] Client disconnected, stopping forward")
                                break
                            else:
                                raise
                        except Exception as e:
                            print(f"[Backend] Error forwarding transcript: {e}")
                            import traceback

                            traceback.print_exc()

                    # Session termination
                    elif msg_type == "Termination":
                        print(f"[AssemblyAI] Session terminated")
                        await websocket.send_json(
                            {
                                "type": "session_terminated",
                                "audio_duration": data.get("audio_duration_seconds"),
                                "session_duration": data.get(
                                    "session_duration_seconds"
                                ),
                            }
                        )
                        break

                    # Error
                    elif msg_type == "Error":
                        print(f"[AssemblyAI] Error received: {data.get('error')}")
                        await websocket.send_json(
                            {
                                "type": "error",
                                "message": data.get("error", "Unknown error"),
                            }
                        )
                        break

                print(f"[AssemblyAI] Message loop ended normally")
            except websockets.exceptions.ConnectionClosed as e:
                print(f"[AssemblyAI] Connection closed: {e}")
            except Exception as e:
                print(f"[AssemblyAI] Receive error: {e}")
                import traceback

                traceback.print_exc()
                try:
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": f"AssemblyAI connection error: {str(e)}",
                        }
                    )
                except:
                    pass

        # Task to forward audio and control messages from client to AssemblyAI
        async def forward_to_assemblyai():
            nonlocal is_shutting_down
            try:
                chunk_count = 0
                while True:
                    data = await websocket.receive()

                    if "bytes" in data:
                        # Forward raw audio bytes to AssemblyAI
                        # AssemblyAI v3 expects binary audio data (not base64)
                        chunk_count += 1
                        if chunk_count % 20 == 0:  # Log every 20 chunks
                            print(f"[Backend] Sent {chunk_count} chunks to AssemblyAI")

                        # Send raw PCM audio bytes directly
                        await assemblyai_ws.send(data["bytes"])

                    elif "text" in data:
                        # Handle control messages
                        msg = json.loads(data["text"])
                        msg_type = msg.get("type")

                        if msg_type == "terminate":
                            # Set shutdown flag first
                            is_shutting_down = True
                            print(f"[Backend] Termination requested, shutting down")
                            # Send termination message
                            await assemblyai_ws.send(json.dumps({"type": "Terminate"}))
                            break

                        elif msg_type == "force_endpoint":
                            # Force end of turn
                            await assemblyai_ws.send(
                                json.dumps({"type": "ForceEndpoint"})
                            )

                        elif msg_type == "configure":
                            # Update configuration
                            config_msg = {"type": "UpdateConfiguration"}
                            if "end_of_turn_confidence_threshold" in msg:
                                config_msg["end_of_turn_confidence_threshold"] = msg[
                                    "end_of_turn_confidence_threshold"
                                ]
                            await assemblyai_ws.send(json.dumps(config_msg))

            except WebSocketDisconnect:
                # Client disconnected, terminate session
                is_shutting_down = True
                print(f"[Backend] Client disconnected")
                try:
                    await assemblyai_ws.send(json.dumps({"type": "Terminate"}))
                except:
                    pass
            except Exception as e:
                is_shutting_down = True
                print(f"[Backend] Forward to AssemblyAI error: {e}")
                import traceback

                traceback.print_exc()

        # Run both tasks concurrently
        await asyncio.gather(
            forward_from_assemblyai(), forward_to_assemblyai(), return_exceptions=True
        )

    except Exception as e:
        error_msg = f"AssemblyAI live transcription error: {str(e)}"
        print(f"[Backend] Error: {error_msg}")
        import traceback

        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "message": error_msg})
        except:
            pass
    finally:
        # Cleanup
        if assemblyai_ws:
            try:
                await assemblyai_ws.close()
            except:
                pass

        try:
            await websocket.close()
        except:
            pass
