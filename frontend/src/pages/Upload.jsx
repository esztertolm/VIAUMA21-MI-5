import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [transcriptResult, setTranscriptResult] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setTranscriptResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes('audio') || file.type.includes('video'))) {
      setSelectedFile(file);
      setError(null);
      setTranscriptResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('speaker_labels', 'true');
      // Optional: add language code if needed
      // formData.append('language_code', 'hu');

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(`${API_BASE_URL}/transcription/assemblyai/transcribe`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Transcription failed');
      }

      const result = await response.json();
      setTranscriptResult(result);
      
      // Store transcript in localStorage (temporary solution until backend has storage)
      const transcripts = JSON.parse(localStorage.getItem('transcripts') || '[]');
      const newTranscript = {
        id: result.id || Date.now(),
        title: selectedFile.name,
        date: new Date().toLocaleString('hu-HU'),
        duration: result.audio_duration ? formatDuration(result.audio_duration) : 'N/A',
        speakers: result.utterances ? new Set(result.utterances.map(u => u.speaker)).size : 0,
        status: 'completed',
        text: result.text,
        utterances: result.utterances || [],
        language_code: result.language_code,
        confidence: result.confidence,
      };
      transcripts.push(newTranscript);
      localStorage.setItem('transcripts', JSON.stringify(transcripts));

      // Redirect to transcript detail after 2 seconds
      setTimeout(() => {
        navigate(`/dashboard/transcripts/${newTranscript.id}`);
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload and transcribe file');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSuccess(false);
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-foreground mb-2.5">Hanganyag feltöltése</h1>
      <p className="text-muted-foreground mb-10">Töltsön fel egy előre felvett beszélgetést átirathoz</p>

      <Card 
        className="upload-area border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Húzza ide a fájlt</h3>
              <p className="text-sm text-muted-foreground">
                Támogatott formátumok: MP3, WAV, M4A, MP4. Maximum 10MB
              </p>
            </div>
            
            <input
              type="file"
              id="file-input"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input">
              <Button variant="outline" className="mt-2" asChild>
                <span>Tallózás</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {selectedFile && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-4xl">♪</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!uploading && (
                <Button 
                  onClick={handleRemoveFile} 
                  variant="ghost" 
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              )}
            </div>

            {uploading && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress < 100 ? 'Feltöltés és feldolgozás folyamatban...' : 'Feldolgozás befejezve!'}
                </p>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full mt-4"
              size="lg"
            >
              {uploading ? 'Feldolgozás...' : 'Feltöltés és feldolgozás'}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            Hiba: {error}
          </AlertDescription>
        </Alert>
      )}

      {transcriptResult && (
        <Alert className="mt-6">
          <AlertDescription>
            Átirat sikeresen elkészült! Átirányítás...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default Upload;
