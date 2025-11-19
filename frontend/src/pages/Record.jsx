import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

function Record() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [savedTranscriptId, setSavedTranscriptId] = useState(null);
  
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeWebSocket = () => {
    try {
      setSessionStatus('connecting');
      const ws = new WebSocket(`${WS_BASE_URL}/transcription/assemblyai/transcribe/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Frontend] WebSocket connected');
        setSessionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Frontend] Received:', data.type);

          if (data.type === 'session_begins') {
            console.log('[Frontend] Session started:', data.session_id);
          } else if (data.type === 'partial_transcript') {
            setPartialTranscript(data.text);
          } else if (data.type === 'final_transcript') {
            setTranscript((prev) => prev + (prev ? ' ' : '') + data.text);
            setPartialTranscript('');
          } else if (data.type === 'session_terminated') {
            console.log('[Frontend] Session terminated');
          } else if (data.type === 'error') {
            console.error('[Frontend] Error:', data.message);
            setError(data.message);
          }
        } catch (err) {
          console.error('[Frontend] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[Frontend] WebSocket error:', error);
        setError('WebSocket connection error');
        setSessionStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('[Frontend] WebSocket closed');
        setSessionStatus('disconnected');
      };
    } catch (err) {
      console.error('[Frontend] Failed to initialize WebSocket:', err);
      setError('Failed to connect to transcription service');
      setSessionStatus('disconnected');
    }
  };

  const initializeAudioCapture = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      
      // Create ScriptProcessor for audio processing
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isPaused && wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (PCM_S16LE)
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Send raw PCM bytes to WebSocket
          wsRef.current.send(pcmData.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      return true;
    } catch (err) {
      console.error('[Frontend] Failed to initialize audio:', err);
      setError('Failed to access microphone. Please grant permission.');
      return false;
    }
  };

  const stopAudioCapture = () => {
    // Stop processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const closeWebSocket = () => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'terminate' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    setTranscript('');
    setPartialTranscript('');
    setSavedTranscriptId(null);
    
    try {
      // Initialize audio capture first
      const audioInitialized = await initializeAudioCapture();
      
      if (!audioInitialized) {
        setError('Failed to access microphone');
        return;
      }

      // Then initialize WebSocket connection
      initializeWebSocket();
      
      // Wait for WebSocket to connect by checking wsRef directly
      const maxWaitTime = 5000; // 5 seconds
      const startTime = Date.now();
      
      while ((!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) && Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setIsRecording(true);
        setRecordingTime(0);
        setIsPaused(false);
      } else {
        closeWebSocket();
        stopAudioCapture();
        setError('Failed to connect to transcription service');
      }
    } catch (err) {
      console.error('[Frontend] Start recording error:', err);
      closeWebSocket();
      stopAudioCapture();
      setError('Failed to start recording: ' + err.message);
    }
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
    
    if (!isPaused && audioContextRef.current) {
      audioContextRef.current.suspend();
    } else if (isPaused && audioContextRef.current) {
      audioContextRef.current.resume();
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    // Close WebSocket
    closeWebSocket();
    
    // Stop audio capture
    stopAudioCapture();
    
    // Save to localStorage if there's a transcript
    if (transcript) {
      console.log('Final transcript:', transcript);
      
      // Get existing transcripts from localStorage
      const transcripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
      
      // Create new transcript entry
      const newTranscript = {
        id: Date.now(),
        title: `Live Recording ${new Date().toLocaleString('hu-HU')}`,
        date: new Date().toLocaleString('hu-HU'),
        duration: formatTime(recordingTime),
        speakers: 0, // Live transcription doesn't have speaker labels
        status: 'completed',
        text: transcript,
        utterances: [],
        language_code: null,
        confidence: null,
        type: 'live'
      };
      
      // Add to transcripts array
      transcripts.push(newTranscript);
      
      // Save back to localStorage
      localStorage.setItem('transcripts', JSON.stringify(transcripts));
      
      console.log('Transcript saved to localStorage');
      setSavedTranscriptId(newTranscript.id);
    }
  };

  const handleViewTranscript = () => {
    if (savedTranscriptId) {
      navigate(`/dashboard/transcripts/${savedTranscriptId}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeWebSocket();
      stopAudioCapture();
    };
  }, []);

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-foreground mb-2.5">Élő átírás</h1>
      <p className="text-muted-foreground mb-10">Indítson élő felvételt azonnali átírással</p>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-card p-10 md:p-15 rounded-lg text-center shadow-md">
        <div className={`flex items-center justify-center gap-2 h-[100px] mb-7 ${isRecording && !isPaused ? '[&>div]:animate-[wave_0.8s_ease-in-out_infinite]' : ''}`}>
          <div className={`w-1.5 h-5 bg-muted rounded ${isRecording && !isPaused ? 'bg-primary [animation-delay:0s]' : ''}`}></div>
          <div className={`w-1.5 h-5 bg-muted rounded ${isRecording && !isPaused ? 'bg-primary [animation-delay:0.1s]' : ''}`}></div>
          <div className={`w-1.5 h-5 bg-muted rounded ${isRecording && !isPaused ? 'bg-primary [animation-delay:0.2s]' : ''}`}></div>
          <div className={`w-1.5 h-5 bg-muted rounded ${isRecording && !isPaused ? 'bg-primary [animation-delay:0.3s]' : ''}`}></div>
          <div className={`w-1.5 h-5 bg-muted rounded ${isRecording && !isPaused ? 'bg-primary [animation-delay:0.4s]' : ''}`}></div>
        </div>

        <div className="mb-5">
          {!isRecording ? (
            <p className="text-lg text-muted-foreground m-0">Készen áll a felvételre</p>
          ) : isPaused ? (
            <p className="text-lg text-chart-4 font-medium m-0">Megállítva</p>
          ) : (
            <p className="text-lg text-destructive font-medium m-0">
              Felvétel folyamatban... {sessionStatus === 'connected' ? '(Kapcsolódva)' : '(Csatlakozás...)'}
            </p>
          )}
        </div>

        <div className="text-5xl font-bold text-foreground mb-10 font-mono">
          {formatTime(recordingTime)}
        </div>

        <div className="mb-7">
          {!isRecording ? (
            <Button 
              onClick={handleStartRecording} 
              size="lg" 
              variant="destructive" 
              className="rounded-full w-20 h-20 p-0"
              disabled={sessionStatus === 'connecting'}
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center"></div>
            </Button>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handlePauseRecording} 
                variant={isPaused ? "default" : "secondary"}
                size="lg"
                className={`rounded-full w-16 h-16 p-0 flex items-center justify-center ${isPaused ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
              >
                {isPaused ? (
                  <div className="w-0 h-0 border-t-10 border-t-transparent border-l-16 border-l-current border-b-10 border-b-transparent ml-1"></div>
                ) : (
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-6 bg-current"></div>
                    <div className="w-1.5 h-6 bg-current"></div>
                  </div>
                )}
              </Button>
              <Button 
                onClick={handleStopRecording} 
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 p-0 flex items-center justify-center"
              >
                <div className="w-5 h-5 bg-white rounded-sm"></div>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Live Transcript Display */}
      {(isRecording || transcript) && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Élő átírás</h3>
            <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              <p className="text-foreground whitespace-pre-wrap">
                {transcript}
                {partialTranscript && (
                  <span className="text-muted-foreground italic">
                    {transcript ? ' ' : ''}{partialTranscript}
                  </span>
                )}
              </p>
              {!transcript && !partialTranscript && (
                <p className="text-muted-foreground italic">
                  Várakozás a beszédre...
                </p>
              )}
            </div>
            
            {savedTranscriptId && (
              <div className="mt-4 flex gap-2">
                <Alert className="flex-1">
                  <AlertDescription>
                    Átirat mentve!
                  </AlertDescription>
                </Alert>
                <Button onClick={handleViewTranscript} variant="default">
                  Megtekintés
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Record;
