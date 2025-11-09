import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setSuccess(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.includes('audio') || file.type.includes('video'))) {
      setSelectedFile(file);
      setSuccess(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setUploading(true);
    
    // Mock upload process
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      setTimeout(() => {
        setSelectedFile(null);
        setSuccess(false);
      }, 2000);
    }, 1500);
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
              <Button 
                onClick={handleRemoveFile} 
                variant="ghost" 
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full mt-4"
              size="lg"
            >
              {uploading ? 'Feltöltés folyamatban...' : 'Feltöltés és feldolgozás'}
            </Button>
          </CardContent>
        </Card>
      )}

      {success && (
        <Alert className="mt-6">
          <AlertDescription>
            Fájl sikeresen feltöltve! Feldolgozás folyamatban...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default Upload;
