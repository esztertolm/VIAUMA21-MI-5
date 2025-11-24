import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function TranscriptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTranscript();
  }, [id]);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.db_id;

      if (!userId) {
        setError('No user ID found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/transcription/get_user_transcript?user_id=${userId}&transcript_id=${id}`
      );

      if (!response.ok) {
        throw new Error('Failed to load transcript');
      }

      const data = await response.json();
      setTranscript(data);
      setNotes(data.notes || '');
    } catch (err) {
      console.error('Error loading transcript:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/transcription/update_user_transcript`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript_id: id,
            notes: notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      setTranscript(prev => ({ ...prev, notes }));
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Hiba a jegyzetek mentése során');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDownload = (format) => {
    if (!transcript) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'TXT') {
      if (transcript.utterances && transcript.utterances.length > 0) {
        content = transcript.utterances.map(u => 
          `[${formatTime(u.start)}] Speaker ${u.speaker}: ${u.text}`
        ).join('\n\n');
      } else {
        content = transcript.text || '';
      }
      filename = `${transcript.title}-transcript.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (confirm(`Biztosan törölni szeretné a(z) "${transcript.title}" átiratot?`)) {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/transcription/delete_user_transcript/${id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete transcript');
        }

        navigate('/dashboard/transcripts');
      } catch (err) {
        console.error('Error deleting transcript:', err);
        alert('Hiba az átirat törlése során');
      }
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto">
        <p>Betöltés...</p>
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="max-w-[900px] mx-auto">
        <p>Átirat nem található...</p>
        <Link to="/dashboard/transcripts">
          <Button className="mt-4">Vissza az átiratokhoz</Button>
        </Link>
      </div>
    );
  }

  // Use Tailwind's chart colors for speaker differentiation
  const speakerColorClasses = [
    'bg-chart-1 text-white',
    'bg-chart-2 text-white', 
    'bg-chart-3 text-white',
    'bg-chart-4 text-white'
  ];

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-10">
        <Link to="/dashboard/transcripts" className="inline-block text-primary no-underline mb-5 font-medium hover:text-primary/80 transition-colors">
          ← Vissza az átiratokhoz
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>{transcript.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-5 mb-5 flex-wrap">
              <span className="text-muted-foreground text-sm">
                Dátum: {transcript.created_at ? new Date(transcript.created_at).toLocaleString('hu-HU') : 'N/A'}
              </span>
              <span className="text-muted-foreground text-sm">Időtartam: {transcript.duration}</span>
              <span className="text-muted-foreground text-sm">Beszélők: {transcript.speakers}</span>
              {transcript.confidence && (
                <span className="text-muted-foreground text-sm">
                  Megbízhatóság: {(transcript.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>

            <div className="flex gap-2.5 flex-wrap mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="sm" onClick={() => handleDownload('TXT')}>
                      TXT Letöltés
                    </Button>
                  </TooltipTrigger>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      Törlés
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="transcript-content">
        <CardContent className="pt-6">
          <Tabs defaultValue="conversation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversation">Beszélgetés</TabsTrigger>
              <TabsTrigger value="raw">Nyers szöveg</TabsTrigger>
              <TabsTrigger value="notes">Jegyzetek</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="mt-6">
              {transcript.utterances && transcript.utterances.length > 0 ? (
                <>
                  <div className="mb-7 pb-5 border-b-2 border-border">
                    <h3 className="font-semibold mb-3">Beszélők:</h3>
                    <div className="flex gap-4 flex-wrap">
                      {Array.from({ length: transcript.speakers }, (_, i) => (
                        <Badge key={i} className={`gap-2 ${speakerColorClasses[i]}`}>
                          <span>Résztvevő {i + 1}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="flex flex-col gap-5">
                    {transcript.utterances.map((entry, index) => {
                      const speakerNum = typeof entry.speaker === 'string' 
                        ? parseInt(entry.speaker.replace(/\D/g, '')) - 1 
                        : entry.speaker - 1;
                      
                      return (
                        <div key={index} className="p-5 bg-muted/50 rounded-lg transition-colors hover:bg-muted/70">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={speakerColorClasses[speakerNum % speakerColorClasses.length]}>
                              {entry.speaker}
                            </Badge>
                            <span className="text-muted-foreground text-xs font-mono">
                              {formatTime(entry.start)}
                            </span>
                            {entry.confidence && (
                              <span className="text-muted-foreground text-xs">
                                ({(entry.confidence * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          <p className="m-0 text-foreground leading-relaxed">{entry.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Nem állnak rendelkezésre beszélők szerinti részletek.</p>
                  <p className="mt-2">Nézze meg a "Nyers szöveg" fület a teljes átiratért.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {transcript.utterances && transcript.utterances.length > 0 ? (
                      <p className="text-sm text-muted-foreground mb-4 font-mono whitespace-pre-line">
                        {transcript.utterances.map((entry, index) => 
                          `[${formatTime(entry.start)}] ${entry.speaker}: ${entry.text}`
                        ).join('\n\n')}
                      </p>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {transcript.text || 'Nincs elérhető átirat.'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Jegyzetek az átirathoz</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Írjon jegyzeteket, összegzéseket vagy fontos pontokat
                      </p>
                    </div>
                    <Textarea
                      id="notes"
                      placeholder="Írja ide a jegyzeteit..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={10}
                      className="font-mono"
                    />
                    <Button 
                      onClick={handleSaveNotes} 
                      disabled={isSavingNotes}
                    >
                      {isSavingNotes ? 'Mentés...' : 'Jegyzetek mentése'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default TranscriptDetail;
