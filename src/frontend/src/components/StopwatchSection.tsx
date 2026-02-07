import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import { toast } from 'sonner';

export function StopwatchSection() {
  const { actor } = useActor();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [localStartTime, setLocalStartTime] = useState<number | null>(null);
  const hasRestoredRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore stopwatch state on mount
  useEffect(() => {
    if (hasRestoredRef.current || !actor) return;
    hasRestoredRef.current = true;

    const restoreState = async () => {
      try {
        const [running, elapsed] = await actor.getFullPersistentStopwatchState();
        
        if (running || elapsed > 0) {
          const elapsedSeconds = Math.floor(Number(elapsed) / 1_000_000_000);
          setElapsedTime(elapsedSeconds);
          setIsRunning(running);
          
          if (running) {
            setLocalStartTime(Date.now());
            toast.info('Stopwatch restored', {
              description: `Continuing from ${formatTime(elapsedSeconds)}`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to restore stopwatch state:', error);
      }
    };

    restoreState();
  }, [actor]);

  // Stopwatch counting logic
  useEffect(() => {
    if (isRunning && localStartTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const additionalSeconds = Math.floor((now - localStartTime) / 1000);
        setElapsedTime((prev) => {
          const baseTime = prev - Math.floor((Date.now() - localStartTime) / 1000);
          return baseTime + additionalSeconds + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, localStartTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = async () => {
    if (!actor) {
      toast.error('Backend not ready');
      return;
    }

    try {
      if (!isRunning) {
        // Start or resume
        if (elapsedTime === 0) {
          await actor.startPersistentStopwatch();
        } else {
          await actor.resumePersistentStopwatch();
        }
        setLocalStartTime(Date.now());
        setIsRunning(true);
      } else {
        // Pause
        await actor.pausePersistentStopwatch();
        setIsRunning(false);
        setLocalStartTime(null);
      }
    } catch (error) {
      console.error('Failed to toggle stopwatch:', error);
      toast.error('Failed to update stopwatch');
    }
  };

  const handleReset = async () => {
    if (!actor) {
      toast.error('Backend not ready');
      return;
    }

    try {
      await actor.resetPersistentStopwatch();
      setElapsedTime(0);
      setIsRunning(false);
      setLocalStartTime(null);
      toast.success('Stopwatch reset');
    } catch (error) {
      console.error('Failed to reset stopwatch:', error);
      toast.error('Failed to reset stopwatch');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stopwatch</CardTitle>
        <CardDescription>Track your study time with precision</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <img
              src="/assets/generated/stopwatch-icon.dim_64x64.png"
              alt="Stopwatch"
              className="h-16 w-16 opacity-80"
            />
          </div>
          <div className="text-5xl font-bold tabular-nums">{formatTime(elapsedTime)}</div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleStartPause} className="flex-1" size="lg">
            {isRunning ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                {elapsedTime > 0 ? 'Resume' : 'Start'}
              </>
            )}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" disabled={elapsedTime === 0}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {isRunning && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-center">
            <p className="text-xs text-green-900 dark:text-green-100">
              ⏱️ Stopwatch continues running even when app is closed or minimized
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            💡 Perfect for tracking study sessions without time limits
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
