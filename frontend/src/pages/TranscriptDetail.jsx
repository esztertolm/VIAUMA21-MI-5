import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
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
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    // Mock save
    setTimeout(() => {
      alert('Jegyzetek mentve!');
      setIsSavingNotes(false);
    }, 1000);
  };

  // Mock transcript data with speaker differentiation
  const mockTranscript = {
    id: id,
    title: 'Projekt megbeszélés',
    date: '2025-11-08 14:30',
    duration: '15:23',
    speakers: 3,
    conversation: [
      {
        speaker: 1,
        timestamp: '00:00',
        text: 'Sziasztok! Kezdjük el a mai projekt megbeszélést. Az első téma a frontend fejlesztés státusza.'
      },
      {
        speaker: 2,
        timestamp: '00:15',
        text: 'Helló! A frontend oldalon jól haladunk. A React komponensek nagy része már kész van, most a routing-on dolgozunk.'
      },
      {
        speaker: 3,
        timestamp: '00:28',
        text: 'Remek! És a backend API integrációval hogy állunk?'
      },
      {
        speaker: 2,
        timestamp: '00:35',
        text: 'Még nem kezdtük el, mert várnunk kell, hogy a backend csapat befejezze az endpoint-okat. Talán jövő héten tudunk rá ráállni.'
      },
      {
        speaker: 1,
        timestamp: '00:50',
        text: 'Értem. A backend csapat leadja ma délutánra az API dokumentációt, úgyhogy akkor tudtok majd dolgozni vele. Van még valami, amit meg kellene beszélnünk?'
      },
      {
        speaker: 3,
        timestamp: '01:05',
        text: 'Igen, a design rendszerrel kapcsolatban van egy kérdésem. A color palette-t megváltoztattuk az utolsó meetingen?'
      },
      {
        speaker: 1,
        timestamp: '01:15',
        text: 'Igen, a UI/UX csapat frissítette. Az új színeket már beküldték a Figma-ban. Érdemes megnézni.'
      },
      {
        speaker: 2,
        timestamp: '01:28',
        text: 'Oké, akkor megnézem és frissítem a CSS változókat a projektben. Még valami?'
      },
      {
        speaker: 1,
        timestamp: '01:38',
        text: 'Szerintem ennyi volt. Köszönöm mindenkinek! Jó munkát a héten!'
      },
    ]
  };

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
            <CardTitle>{mockTranscript.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-5 mb-5 flex-wrap">
              <span className="text-muted-foreground text-sm">Dátum: {mockTranscript.date}</span>
              <span className="text-muted-foreground text-sm">Időtartam: {mockTranscript.duration}</span>
              <span className="text-muted-foreground text-sm">Beszélők: {mockTranscript.speakers}</span>
            </div>

            <div className="flex gap-2.5 flex-wrap mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="sm">TXT</Button>
                  </TooltipTrigger>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm">Törlés</Button>
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
              <div className="mb-7 pb-5 border-b-2 border-border">
                <h3 className="font-semibold mb-3">Beszélők:</h3>
                <div className="flex gap-4 flex-wrap">
                  {Array.from({ length: mockTranscript.speakers }, (_, i) => (
                    <Badge key={i} className={`gap-2 ${speakerColorClasses[i]}`}>
                      <span>Résztvevő {i + 1}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex flex-col gap-5">
                {mockTranscript.conversation.map((entry, index) => (
                  <div key={index} className="p-5 bg-muted/50 rounded-lg transition-colors hover:bg-muted/70">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={speakerColorClasses[entry.speaker - 1]}>
                        Résztvevő {entry.speaker}
                      </Badge>
                      <span className="text-muted-foreground text-xs font-mono">{entry.timestamp}</span>
                    </div>
                    <p className="m-0 text-foreground leading-relaxed">{entry.text}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <p className="text-sm text-muted-foreground mb-4 font-mono whitespace-pre-line">
                      {mockTranscript.conversation.map((entry, index) => 
                        `[${entry.timestamp}] Résztvevő ${entry.speaker}: ${entry.text}`
                      ).join('\n\n')}
                    </p>
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
                      disabled={isSavingNotes || !notes.trim()}
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
