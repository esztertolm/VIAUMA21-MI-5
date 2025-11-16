import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

function Record() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setIsPaused(false);
    // Mock save
    alert('Felvétel mentve! A feldolgozás hamarosan elkezdődik.');
  };

  return (
    <div className="max-w-[800px] mx-auto">

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
            <p className="text-lg text-destructive font-medium m-0">Felvétel folyamatban...</p>
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
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-current border-b-[10px] border-b-transparent ml-1"></div>
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
    </div>
  );
}

export default Record;
