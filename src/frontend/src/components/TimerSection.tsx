import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Coins, Bell, BellOff, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { NotificationManager } from '@/lib/NotificationManager';
import { useRecordTimerSession, useGetCoinBalance, useGetStudyStreak } from '../hooks/useQueries';
import { toast } from 'sonner';
import { StopwatchSection } from './StopwatchSection';
import { Badge } from '@/components/ui/badge';

interface TimerState {
  currentTime: number;
  isRunning: boolean;
  isBreak: boolean;
  timerMode: 'pomodoro' | 'custom';
  initialTime: number;
  sessionsCompleted: number;
  startTimestamp: number | null;
  pomodoroTime: number;
  breakTime: number;
  customTime: number;
  sessionStartTime: number | null;
  endTimestamp: number | null;
}

const STORAGE_KEY = 'exam-prep-timer-state';

export function TimerSection() {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [breakTime, setBreakTime] = useState(5 * 60);
  const [customTime, setCustomTime] = useState(30 * 60);
  const [currentTime, setCurrentTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const hasNotifiedRef = useRef(false);
  const hasRestoredRef = useRef(false);

  const recordSessionMutation = useRecordTimerSession();
  const { data: coinBalance } = useGetCoinBalance();
  const { data: studyStreak } = useGetStudyStreak();

  const currentCoins = coinBalance ? Number(coinBalance) : 0;
  const currentStreak = studyStreak ? Number(studyStreak) : 0;

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          setNotificationsEnabled(permission === 'granted');
        });
      }
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/assets/generated/app-icon-transparent.dim_200x200.png',
          badge: '/assets/generated/app-icon-transparent.dim_200x200.png',
          tag: 'exam-prep-timer',
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    }
  };

  // Restore timer state on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        
        if (state.isRunning && state.endTimestamp) {
          const now = Date.now();
          const timeRemaining = Math.max(0, Math.floor((state.endTimestamp - now) / 1000));
          
          if (timeRemaining === 0) {
            // Timer completed while app was closed
            setCurrentTime(0);
            setIsRunning(false);
            setStartTimestamp(null);
            setEndTimestamp(null);
            
            // Record session if it was a work session
            if (state.sessionStartTime && !state.isBreak) {
              const durationMinutes = Math.floor(state.initialTime / 60);
              recordSessionMutation.mutate({
                durationMinutes: BigInt(durationMinutes),
                completed: true,
              });
            }
            
            // Show completion notification
            if (state.timerMode === 'pomodoro') {
              if (!state.isBreak) {
                setSessionsCompleted(state.sessionsCompleted + 1);
                NotificationManager.showTimerComplete('Work session completed! Time for a break.');
                showBrowserNotification('Work Session Complete', 'Great job! Time for a break.');
                toast.success('Timer completed while you were away!', {
                  description: 'Work session finished. Ready for a break?',
                });
              } else {
                NotificationManager.showTimerComplete('Break completed! Ready for another session?');
                showBrowserNotification('Break Complete', 'Ready for another study session?');
                toast.success('Break completed!', {
                  description: 'Your break is over. Ready to focus again?',
                });
              }
            } else {
              NotificationManager.showTimerComplete('Timer completed!');
              showBrowserNotification('Timer Complete', 'Your study session has finished!');
              toast.success('Timer completed while you were away!');
            }
          } else {
            // Timer still running, restore state
            setCurrentTime(timeRemaining);
            setIsRunning(true);
            setStartTimestamp(now);
            setEndTimestamp(state.endTimestamp);
            toast.info('Timer restored', {
              description: `Continuing from ${formatTime(timeRemaining)}`,
            });
          }
          
          setTimerMode(state.timerMode);
          setIsBreak(state.isBreak);
          setInitialTime(state.initialTime);
          setSessionsCompleted(state.sessionsCompleted);
          setPomodoroTime(state.pomodoroTime);
          setBreakTime(state.breakTime);
          setCustomTime(state.customTime);
          setSessionStartTime(state.sessionStartTime);
        }
      } catch (error) {
        console.error('Failed to restore timer state:', error);
      }
    }
  }, []);

  // Save timer state
  useEffect(() => {
    const state: TimerState = {
      currentTime,
      isRunning,
      isBreak,
      timerMode,
      initialTime,
      sessionsCompleted,
      startTimestamp,
      pomodoroTime,
      breakTime,
      customTime,
      sessionStartTime,
      endTimestamp,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    currentTime,
    isRunning,
    isBreak,
    timerMode,
    initialTime,
    sessionsCompleted,
    startTimestamp,
    pomodoroTime,
    breakTime,
    customTime,
    sessionStartTime,
    endTimestamp,
  ]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setStartTimestamp(null);
          setEndTimestamp(null);
          hasNotifiedRef.current = false;

          if (timerMode === 'pomodoro') {
            if (!isBreak) {
              setSessionsCompleted((s) => s + 1);
              NotificationManager.showTimerComplete('Work session completed! Time for a break.');
              showBrowserNotification('Work Session Complete', 'Great job! Time for a break.');
              
              if (sessionStartTime) {
                const durationMinutes = Math.floor(initialTime / 60);
                recordSessionMutation.mutate({
                  durationMinutes: BigInt(durationMinutes),
                  completed: true,
                });
                setSessionStartTime(null);
              }
            } else {
              NotificationManager.showTimerComplete('Break completed! Ready for another session?');
              showBrowserNotification('Break Complete', 'Ready for another study session?');
            }
          } else {
            NotificationManager.showTimerComplete('Timer completed!');
            showBrowserNotification('Timer Complete', 'Your study session has finished!');
            
            if (sessionStartTime) {
              const durationMinutes = Math.floor(initialTime / 60);
              recordSessionMutation.mutate({
                durationMinutes: BigInt(durationMinutes),
                completed: true,
              });
              setSessionStartTime(null);
            }
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isBreak, timerMode, initialTime, sessionStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    const now = Date.now();
    setIsRunning(true);
    setStartTimestamp(now);
    setEndTimestamp(now + currentTime * 1000);
    hasNotifiedRef.current = false;
    
    if (!isBreak) {
      setSessionStartTime(now);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setStartTimestamp(null);
    setEndTimestamp(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setStartTimestamp(null);
    setEndTimestamp(null);
    setSessionStartTime(null);
    hasNotifiedRef.current = false;
    
    if (timerMode === 'pomodoro') {
      setCurrentTime(isBreak ? breakTime : pomodoroTime);
      setInitialTime(isBreak ? breakTime : pomodoroTime);
    } else {
      setCurrentTime(customTime);
      setInitialTime(customTime);
    }
  };

  const switchMode = () => {
    if (timerMode === 'pomodoro') {
      const newIsBreak = !isBreak;
      setIsBreak(newIsBreak);
      const newTime = newIsBreak ? breakTime : pomodoroTime;
      setCurrentTime(newTime);
      setInitialTime(newTime);
      setIsRunning(false);
      setStartTimestamp(null);
      setEndTimestamp(null);
      setSessionStartTime(null);
    }
  };

  const handleModeChange = (mode: 'pomodoro' | 'custom') => {
    setTimerMode(mode);
    setIsRunning(false);
    setStartTimestamp(null);
    setEndTimestamp(null);
    setSessionStartTime(null);
    hasNotifiedRef.current = false;
    
    if (mode === 'pomodoro') {
      setIsBreak(false);
      setCurrentTime(pomodoroTime);
      setInitialTime(pomodoroTime);
    } else {
      setCurrentTime(customTime);
      setInitialTime(customTime);
    }
  };

  const progress = initialTime > 0 ? ((initialTime - currentTime) / initialTime) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Focus Timer</CardTitle>
            <CardDescription>Stay focused with Pomodoro or custom timers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={timerMode} onValueChange={(v) => handleModeChange(v as 'pomodoro' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="pomodoro" className="space-y-4">
                <div className="space-y-2">
                  <Label>Work Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={Math.floor(pomodoroTime / 60)}
                    onChange={(e) => {
                      const mins = parseInt(e.target.value) || 25;
                      setPomodoroTime(mins * 60);
                      if (!isBreak && !isRunning) {
                        setCurrentTime(mins * 60);
                        setInitialTime(mins * 60);
                      }
                    }}
                    disabled={isRunning}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={Math.floor(breakTime / 60)}
                    onChange={(e) => {
                      const mins = parseInt(e.target.value) || 5;
                      setBreakTime(mins * 60);
                      if (isBreak && !isRunning) {
                        setCurrentTime(mins * 60);
                        setInitialTime(mins * 60);
                      }
                    }}
                    disabled={isRunning}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={switchMode}
                  disabled={isRunning}
                  className="w-full"
                >
                  Switch to {isBreak ? 'Work' : 'Break'}
                </Button>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={Math.floor(customTime / 60)}
                    onChange={(e) => {
                      const mins = parseInt(e.target.value) || 30;
                      setCustomTime(mins * 60);
                      if (!isRunning) {
                        setCurrentTime(mins * 60);
                        setInitialTime(mins * 60);
                      }
                    }}
                    disabled={isRunning}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Timer Display</CardTitle>
                <CardDescription>
                  {timerMode === 'pomodoro' 
                    ? (isBreak ? 'Break Time' : 'Focus Time')
                    : 'Custom Timer'
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-600/10 px-3 py-1.5">
                  <Flame className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  <span className="text-sm font-bold">{currentStreak}</span>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-3 py-1.5">
                  <Coins className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <span className="text-sm font-bold">{currentCoins}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-6xl font-bold tabular-nums">
                {formatTime(currentTime)}
              </div>
              <Progress value={progress} className="w-full" />
              {timerMode === 'pomodoro' && (
                <div className="text-sm text-muted-foreground">
                  Sessions completed: {sessionsCompleted}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={startTimer} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="secondary" className="flex-1">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button onClick={resetTimer} variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {notificationsEnabled ? (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Notifications enabled</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm">
                <BellOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Enable notifications for alerts</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StopwatchSection />
    </div>
  );
}
