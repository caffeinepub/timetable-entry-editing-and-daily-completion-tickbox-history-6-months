import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Clock, Coins, Flame, Snowflake, Coffee } from 'lucide-react';
import { useRecordTimerSession, useGetCoinBalance, useGetStudyStreak, useGetAvailableStreakFreezes, usePurchaseStreakFreeze } from '../hooks/useQueries';
import { NotificationManager } from '../lib/NotificationManager';
import { StopwatchSection } from './StopwatchSection';
import { toast } from 'sonner';
import { getBackendErrorMessage } from '../utils/backendErrorMessage';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

type TimerMode = 'pomodoro' | 'custom';
type PomodoroPhase = 'focus' | 'break';

export function TimerSection() {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [pomodoroMinutes, setPomodoroMinutes] = useLocalStorageState<number>('pomodoroMinutes', 25, { min: 1, max: 600 });
  const [breakMinutes, setBreakMinutes] = useLocalStorageState<number>('breakMinutes', 5, { min: 1, max: 600 });
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(pomodoroMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const recordSession = useRecordTimerSession();
  const { data: coinBalance } = useGetCoinBalance();
  const { data: studyStreak } = useGetStudyStreak();
  const { data: availableFreezes } = useGetAvailableStreakFreezes();
  const purchaseFreeze = usePurchaseStreakFreeze();

  const currentCoins = coinBalance ? Number(coinBalance) : 0;
  const currentStreak = studyStreak ? Number(studyStreak) : 0;
  const freezeCount = availableFreezes ? Number(availableFreezes) : 0;

  useEffect(() => {
    if (mode === 'pomodoro') {
      setPomodoroPhase('focus');
      setTimeLeft(pomodoroMinutes * 60);
    } else {
      setTimeLeft(customMinutes * 60);
    }
    setIsRunning(false);
    setSessionStartTime(null);
  }, [mode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (mode === 'pomodoro') {
      if (pomodoroPhase === 'focus') {
        // Focus phase completed, record session and start break
        if (sessionStartTime) {
          try {
            await recordSession.mutateAsync({
              durationMinutes: BigInt(pomodoroMinutes),
              completed: true,
            });

            const earnedCoins = Math.floor((pomodoroMinutes * 50) / 60);
            
            NotificationManager.showBrowserNotification(
              'Focus Complete! 🎉',
              `Great work! You earned ${earnedCoins} coins. Time for a break!`
            );
            
            toast.success(`Focus Complete! You earned ${earnedCoins} coins 🎉`);
          } catch (error) {
            console.error('Failed to record session:', error);
            toast.error('Failed to record session');
          }
        }

        // Transition to break phase
        setPomodoroPhase('break');
        setTimeLeft(breakMinutes * 60);
        setSessionStartTime(null);
        
        NotificationManager.showBrowserNotification(
          'Break Time! ☕',
          `Take a ${breakMinutes} minute break. You've earned it!`
        );
        toast.info(`Break time! ${breakMinutes} minutes to relax ☕`);
      } else {
        // Break phase completed
        NotificationManager.showBrowserNotification(
          'Break Complete! 💪',
          'Ready to focus again?'
        );
        toast.success('Break complete! Ready for another focus session? 💪');
        
        // Reset to focus phase
        setPomodoroPhase('focus');
        setTimeLeft(pomodoroMinutes * 60);
        setSessionStartTime(null);
      }
    } else {
      // Custom timer completed
      if (sessionStartTime) {
        const durationMinutes = customMinutes;
        
        try {
          await recordSession.mutateAsync({
            durationMinutes: BigInt(durationMinutes),
            completed: true,
          });

          const earnedCoins = Math.floor((durationMinutes * 50) / 60);
          
          NotificationManager.showBrowserNotification(
            'Timer Complete! 🎉',
            `Great work! You earned ${earnedCoins} coins.`
          );
          
          toast.success(`Timer Complete! You earned ${earnedCoins} coins 🎉`);
        } catch (error) {
          console.error('Failed to record session:', error);
          toast.error('Failed to record session');
        }
      }

      setSessionStartTime(null);
    }
  };

  const handleStart = () => {
    if (!isRunning && timeLeft > 0) {
      setIsRunning(true);
      if (!sessionStartTime && (mode === 'custom' || pomodoroPhase === 'focus')) {
        setSessionStartTime(Date.now());
      }
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionStartTime(null);
    if (mode === 'pomodoro') {
      setPomodoroPhase('focus');
      setTimeLeft(pomodoroMinutes * 60);
    } else {
      setTimeLeft(customMinutes * 60);
    }
  };

  const handlePomodoroMinutesChange = (value: string) => {
    const minutes = parseInt(value) || 1;
    const clampedMinutes = Math.max(1, Math.min(600, minutes));
    setPomodoroMinutes(clampedMinutes);
    if (!isRunning && pomodoroPhase === 'focus') {
      setTimeLeft(clampedMinutes * 60);
    }
  };

  const handleBreakMinutesChange = (value: string) => {
    const minutes = parseInt(value) || 1;
    const clampedMinutes = Math.max(1, Math.min(600, minutes));
    setBreakMinutes(clampedMinutes);
    if (!isRunning && pomodoroPhase === 'break') {
      setTimeLeft(clampedMinutes * 60);
    }
  };

  const handleCustomMinutesChange = (value: string) => {
    const minutes = parseInt(value) || 1;
    const clampedMinutes = Math.max(1, Math.min(600, minutes));
    setCustomMinutes(clampedMinutes);
    if (!isRunning) {
      setTimeLeft(clampedMinutes * 60);
    }
  };

  const handleBuyFreeze = async () => {
    if (currentCoins < 50) {
      toast.error('You need 50 coins to purchase a Streak Freeze.');
      return;
    }

    try {
      await purchaseFreeze.mutateAsync();
      toast.success('Streak Freeze purchased! 🧊');
    } catch (error) {
      const errorMessage = getBackendErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'pomodoro'
    ? pomodoroPhase === 'focus'
      ? ((pomodoroMinutes * 60 - timeLeft) / (pomodoroMinutes * 60)) * 100
      : ((breakMinutes * 60 - timeLeft) / (breakMinutes * 60)) * 100
    : ((customMinutes * 60 - timeLeft) / (customMinutes * 60)) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Focus Timer</CardTitle>
            </div>
            <Badge variant="secondary" className="text-base">
              <Coins className="mr-1 h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              {currentCoins} coins
            </Badge>
          </div>
          <CardDescription>Stay focused and earn coins for your study sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as TimerMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pomodoro">Pomodoro ({pomodoroMinutes} min)</TabsTrigger>
              <TabsTrigger value="custom">Custom Timer</TabsTrigger>
            </TabsList>

            <TabsContent value="pomodoro" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pomodoro-minutes">Pomodoro Duration (minutes)</Label>
                  <Input
                    id="pomodoro-minutes"
                    type="number"
                    min="1"
                    max="600"
                    value={pomodoroMinutes}
                    onChange={(e) => handlePomodoroMinutesChange(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="break-minutes">Break Duration (minutes)</Label>
                  <Input
                    id="break-minutes"
                    type="number"
                    min="1"
                    max="600"
                    value={breakMinutes}
                    onChange={(e) => handleBreakMinutesChange(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              </div>
              <div className="text-center py-8">
                {pomodoroPhase === 'break' && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      <Coffee className="mr-2 h-5 w-5" />
                      Break Time
                    </Badge>
                  </div>
                )}
                <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      pomodoroPhase === 'break' ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  {!isRunning ? (
                    <Button onClick={handleStart} size="lg" disabled={timeLeft === 0}>
                      <Play className="mr-2 h-5 w-5" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={handlePause} size="lg" variant="secondary">
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={handleReset} size="lg" variant="outline">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Reset
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-minutes">Duration (minutes)</Label>
                <Input
                  id="custom-minutes"
                  type="number"
                  min="1"
                  max="600"
                  value={customMinutes}
                  onChange={(e) => handleCustomMinutesChange(e.target.value)}
                  disabled={isRunning}
                />
              </div>
              <div className="text-center py-8">
                <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
                <div className="w-full bg-muted rounded-full h-2 mb-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  {!isRunning ? (
                    <Button onClick={handleStart} size="lg" disabled={timeLeft === 0}>
                      <Play className="mr-2 h-5 w-5" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={handlePause} size="lg" variant="secondary">
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={handleReset} size="lg" variant="outline">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Reset
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Study Streak</p>
                      <p className="text-2xl font-bold">{currentStreak} days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Streak Freezes</p>
                      <p className="text-2xl font-bold">{freezeCount}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBuyFreeze}
                    disabled={purchaseFreeze.isPending || currentCoins < 50}
                  >
                    <Snowflake className="mr-1 h-4 w-4" />
                    Buy Freeze
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cost: 50 coins • Protects your streak if you miss a day
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <StopwatchSection />
    </div>
  );
}
