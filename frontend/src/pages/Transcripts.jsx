import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Transcripts() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transcriptToDelete, setTranscriptToDelete] = useState(null);
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    loadTranscripts();
  }, []);

  const loadTranscripts = async () => {
    try{
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.db_id;

      if (!userId) {
        console.error("No user ID found in localStorage");
        return;
      }

      const res = await fetch(`http://127.0.0.1:8000/auth/get_user_transcripts?user_id=${userId}`);
    
      if (!res.ok){
        throw new Error("Failed to load transcripts");
      }

      const data = await res.json();
      setTranscripts(data);
    
    } catch (err) {
      console.error("Error loading transcripts:", err);
    }
  };

  const handleDeleteClick = (transcript) => {
    setTranscriptToDelete(transcript);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    const updated = transcripts.filter(t => t.id !== transcriptToDelete.id);
    localStorage.setItem('transcripts', JSON.stringify(updated));
    setTranscripts(updated);
    setDeleteDialogOpen(false);
    setTranscriptToDelete(null);
  };

  const handleDownload = (transcript, format) => {
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

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-10">
        <h1 className="text-foreground mb-2.5">Mentett átiratok</h1>
      </div>
      {transcripts.length === 0 ? (
        <div className="bg-card p-20 rounded-lg text-center shadow-md">
          <div className="text-8xl mb-5">🎙️</div>
          <h3 className="text-foreground mb-2.5">Még nincsenek mentett átiratok</h3>
          <p className="text-muted-foreground mb-5">Töltsön fel egy hangfájlt az átirat készítéséhez</p>
          <Link to="/dashboard/upload">
            <Button>Feltöltés</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          {transcripts.map((transcript) => (
            <Card key={transcript.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{transcript.title}</CardTitle>
                  {transcript.status === 'processing' ? (
                    <Badge variant="secondary">Feldolgozás alatt</Badge>
                  ) : (
                    <Badge>Kész</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-5 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="font-medium">Dátum:</span><span>{transcript.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="font-medium">Időtartam:</span><span>{transcript.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="font-medium">Beszélők:</span><span>{transcript.speakers}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                {transcript.status === 'completed' ? (
                  <>
                    <Link to={`/dashboard/transcripts/${transcript.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">Megtekintés</Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">...</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(transcript, 'TXT')}>Letöltés TXT</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(transcript, 'PDF')}>Letöltés PDF</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(transcript)} className="text-red-600">Törlés</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Button variant="outline" size="sm" disabled className="w-full">Feldolgozás...</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Átirat törlése</DialogTitle>
            <DialogDescription>
              Biztosan törölni szeretné a(z) <strong>"{transcriptToDelete?.title}"</strong> átiratot? 
              Ez a művelet nem vonható vissza.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Mégse</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Törlés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default Transcripts;
