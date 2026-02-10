import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGetAllTasks } from '../hooks/useQueries';
import { Activity } from 'lucide-react';

interface DayData {
  date: Date;
  dateKey: string;
  count: number;
}

export function TaskCompletionHeatmap() {
  const { data: tasks = [] } = useGetAllTasks();

  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 89); // 90 days including today

    // Create a map of date keys to completion counts
    const completionMap = new Map<string, number>();

    tasks.forEach((task) => {
      if (task.completedAt) {
        const completedDate = new Date(Number(task.completedAt) / 1_000_000);
        const dateKey = completedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
      }
    });

    // Generate 90 days of data
    const days: DayData[] = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toLocaleDateString('en-CA');
      days.push({
        date,
        dateKey,
        count: completionMap.get(dateKey) || 0,
      });
    }

    return days;
  }, [tasks]);

  const getIntensityClass = (count: number): string => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-green-200 dark:bg-green-900';
    if (count === 2) return 'bg-green-400 dark:bg-green-700';
    if (count >= 3) return 'bg-green-600 dark:bg-green-500';
    return 'bg-muted';
  };

  // Group days by week
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  
  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === heatmapData.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      const monthName = firstDay.date.toLocaleDateString('en-US', { month: 'short' });
      
      if (monthName !== lastMonth) {
        labels.push({ month: monthName, weekIndex });
        lastMonth = monthName;
      }
    });

    return labels;
  }, [weeks]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>Visual Heatmap 🔥</CardTitle>
        </div>
        <CardDescription>Your task completion activity over the last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Month labels */}
          <div className="flex gap-[2px] text-xs text-muted-foreground mb-1">
            {monthLabels.map((label, index) => (
              <div
                key={index}
                style={{
                  marginLeft: index === 0 ? 0 : `${(label.weekIndex - (monthLabels[index - 1]?.weekIndex || 0)) * 14}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <TooltipProvider>
            <div className="flex gap-[2px] overflow-x-auto pb-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day) => (
                    <Tooltip key={day.dateKey}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3 h-3 rounded-sm cursor-pointer transition-colors hover:ring-2 hover:ring-primary ${getIntensityClass(
                            day.count
                          )}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">
                          {day.date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {day.count === 0
                            ? 'No tasks completed'
                            : `${day.count} task${day.count === 1 ? '' : 's'} completed`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
              <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
