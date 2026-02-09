import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetWeeklyStudySessions } from '../hooks/useQueries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { aggregateWeeklyStudyData } from '../utils/weeklyStudyGraph';
import { BarChart3 } from 'lucide-react';

export function WeeklyStudyTimeGraph() {
  const { data: sessions = [], isLoading } = useGetWeeklyStudySessions();

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Weekly Study Time</CardTitle>
          </div>
          <CardDescription>Loading study data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const weeklyData = aggregateWeeklyStudyData(sessions);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>Weekly Study Time</CardTitle>
        </div>
        <CardDescription>Last 7 days of study sessions (Pomodoro, Custom, Stopwatch)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar dataKey="pomodoro" stackId="a" fill="hsl(var(--chart-1))" name="Pomodoro" />
              <Bar dataKey="custom" stackId="a" fill="hsl(var(--chart-2))" name="Custom" />
              <Bar dataKey="stopwatch" stackId="a" fill="hsl(var(--chart-3))" name="Stopwatch" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Minutes</p>
            <p className="text-2xl font-bold">
              {weeklyData.reduce((sum, day) => sum + day.pomodoro + day.custom + day.stopwatch, 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">Pomodoro</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
              {weeklyData.reduce((sum, day) => sum + day.pomodoro, 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">Custom</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
              {weeklyData.reduce((sum, day) => sum + day.custom, 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-sm text-muted-foreground">Stopwatch</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--chart-3))' }}>
              {weeklyData.reduce((sum, day) => sum + day.stopwatch, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
