import { Link } from 'react-router-dom';
import { useState } from 'react';
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
  const handleDeleteClick = (transcript) => {
    setTranscriptToDelete(transcript);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = () => {
    alert(`"${transcriptToDelete.title}" törölve!`);
    setDeleteDialogOpen(false);
    setTranscriptToDelete(null);
  };
  const handleDownload = (transcript, format) => {
    alert(`"${transcript.title}" letöltése ${format} formátumban...`);
  };

  const mockTranscripts = [
    { id: 1, title: 'Projekt megbeszélés', date: '2025-11-08 14:30', duration: '15:23', speakers: 3, status: 'completed' },
    { id: 2, title: 'Ügyfél találkozó', date: '2025-11-07 10:15', duration: '28:45', speakers: 2, status: 'completed' },
    { id: 3, title: 'Csapat standup', date: '2025-11-06 09:00', duration: '12:10', speakers: 4, status: 'completed' },
    { id: 4, title: 'Interjú - Új jelölt', date: '2025-11-05 16:45', duration: '45:30', speakers: 2, status: 'processing' },
  ];
  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-10">
        <h1 className="text-foreground mb-2.5">Mentett átiratok</h1>
      </div>
      {mockTranscripts.length === 0 ? (
        <div className="bg-card p-20 rounded-lg text-center shadow-md">
          <div className="text-8xl mb-5"></div>
          <h3 className="text-foreground mb-2.5">Még nincsenek mentett átiratok</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          {mockTranscripts.map((transcript) => (
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
