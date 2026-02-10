import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { useGetWeeklyStudySessions } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';

export function MonthlyStudySummaryView() {
  const { data: sessions = [], isLoading } = useGetWeeklyStudySessions();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const monthStartNano = BigInt(monthStart.getTime()) * BigInt(1000000);
  const monthEndNano = BigInt(monthEnd.getTime()) * BigInt(1000000);

  // Filter sessions for the selected month
  const monthSessions = sessions.filter(
    s => s.completed && s.createdAt >= monthStartNano && s.createdAt <= monthEndNano
  );

  // Calculate total minutes
  const totalMinutes = monthSessions.reduce((sum, s) => sum + Number(s.durationMinutes), 0);

  // Calculate best week
  const calculateBestWeek = (): number => {
    const dayMinutes = new Map<string, number>();
    
    monthSessions.forEach(session => {
      const date = new Date(Number(session.createdAt / BigInt(1000000)));
      const dayKey = date.toISOString().split('T')[0];
      dayMinutes.set(dayKey, (dayMinutes.get(dayKey) || 0) + Number(session.durationMinutes));
    });

    let bestWeekMinutes = 0;
    
    // Check all possible 7-day windows within the month
    for (let day = 1; day <= monthEnd.getDate() - 6; day++) {
      let weekMinutes = 0;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(year, month, day + i);
        const dayKey = checkDate.toISOString().split('T')[0];
        weekMinutes += dayMinutes.get(dayKey) || 0;
      }
      bestWeekMinutes = Math.max(bestWeekMinutes, weekMinutes);
    }

    return bestWeekMinutes;
  };

  const bestWeekMinutes = calculateBestWeek();

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setSelectedDate(new Date(year, month + 1, 1));
    }
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  };

  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Monthly Study Summary</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-4">
              {monthName}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isCurrentMonth()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>Your study statistics for the selected month</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading monthly summary...
          </div>
        ) : monthSessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No study sessions recorded for {monthName}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Study Time</p>
                  <p className="text-2xl font-bold">{totalMinutes} min</p>
                  <p className="text-xs text-muted-foreground">
                    {(totalMinutes / 60).toFixed(1)} hours
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Week</p>
                  <p className="text-2xl font-bold">{bestWeekMinutes} min</p>
                  <p className="text-xs text-muted-foreground">
                    {(bestWeekMinutes / 60).toFixed(1)} hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
