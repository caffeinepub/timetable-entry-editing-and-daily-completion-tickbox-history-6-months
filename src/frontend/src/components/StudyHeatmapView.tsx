import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from 'lucide-react';
import { useGetWeeklyStudySessions } from '../hooks/useQueries';

export function StudyHeatmapView() {
  const { data: sessions = [], isLoading } = useGetWeeklyStudySessions();

  // Generate last 90 days
  const generateDays = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  };

  const days = generateDays();

  // Calculate minutes per day
  const getDayMinutes = (date: Date): number => {
    const dayStart = BigInt(date.getTime()) * BigInt(1000000);
    const dayEnd = BigInt(date.getTime() + 24 * 60 * 60 * 1000) * BigInt(1000000);

    return sessions
      .filter(s => s.completed && s.createdAt >= dayStart && s.createdAt < dayEnd)
      .reduce((sum, s) => sum + Number(s.durationMinutes), 0);
  };

  // Get intensity level (0-4)
  const getIntensity = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
  };

  const getIntensityColor = (intensity: number): string => {
    const colors = [
      'bg-muted',
      'bg-green-200 dark:bg-green-900/40',
      'bg-green-400 dark:bg-green-700/60',
      'bg-green-600 dark:bg-green-600/80',
      'bg-green-800 dark:bg-green-500',
    ];
    return colors[intensity];
  };

  // Group days by week
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Study Activity Heatmap</CardTitle>
        </div>
        <CardDescription>Your study activity over the last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading heatmap data...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <div className="inline-flex flex-col gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex gap-1">
                    {week.map((day, dayIndex) => {
                      const minutes = getDayMinutes(day);
                      const intensity = getIntensity(minutes);
                      
                      return (
                        <TooltipProvider key={dayIndex}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-3 w-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary ${getIntensityColor(intensity)}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">{formatDate(day)}</p>
                                <p className="text-muted-foreground">
                                  {minutes} minutes studied
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((intensity) => (
                  <div
                    key={intensity}
                    className={`h-3 w-3 rounded-sm ${getIntensityColor(intensity)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
