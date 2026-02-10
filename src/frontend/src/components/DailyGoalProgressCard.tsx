import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Target, Edit2, Check, X } from 'lucide-react';
import { useGetDailyStudyGoal, useUpdateDailyStudyGoal, useGetWeeklyStudySessions } from '../hooks/useQueries';
import { toast } from 'sonner';

export function DailyGoalProgressCard() {
  const { data: dailyGoal } = useGetDailyStudyGoal();
  const { data: sessions = [] } = useGetWeeklyStudySessions();
  const updateGoalMutation = useUpdateDailyStudyGoal();
  
  const [isEditing, setIsEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const goal = dailyGoal ? Number(dailyGoal) : 0;
  const hasGoal = goal > 0;

  // Calculate today's studied minutes
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = BigInt(today.getTime()) * BigInt(1000000);

  const todayMinutes = sessions
    .filter(s => s.completed && s.createdAt >= todayTimestamp)
    .reduce((sum, s) => sum + Number(s.durationMinutes), 0);

  const progress = hasGoal ? Math.min((todayMinutes / goal) * 100, 100) : 0;

  const handleStartEdit = () => {
    setGoalInput(goal.toString());
    setIsEditing(true);
  };

  const handleSaveGoal = async () => {
    const newGoal = parseInt(goalInput);
    
    if (isNaN(newGoal) || newGoal < 0) {
      toast.error('Please enter a valid goal (0 or more minutes)');
      return;
    }

    if (newGoal > 1440) {
      toast.error('Daily goal cannot exceed 1440 minutes (24 hours)');
      return;
    }

    try {
      await updateGoalMutation.mutateAsync(BigInt(newGoal));
      setIsEditing(false);
      toast.success(newGoal === 0 ? 'Daily goal removed' : 'Daily goal updated successfully');
    } catch (error) {
      toast.error('Failed to update daily goal');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setGoalInput('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Daily Study Goal</CardTitle>
          </div>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={handleStartEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>Track your daily study progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-input">Daily Goal (minutes)</Label>
              <Input
                id="goal-input"
                type="number"
                min="0"
                max="1440"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="e.g., 60"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to remove your daily goal
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveGoal}
                disabled={updateGoalMutation.isPending}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                {updateGoalMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : hasGoal ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today's Progress</span>
                <span className="font-medium">
                  {todayMinutes} / {goal} minutes
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% complete</span>
                {todayMinutes >= goal && (
                  <span className="text-green-600 dark:text-green-500 font-medium">
                    🎉 Goal achieved!
                  </span>
                )}
              </div>
            </div>
            {todayMinutes < goal && (
              <div className="rounded-lg bg-muted/50 p-3 text-center text-sm">
                <p className="text-muted-foreground">
                  {goal - todayMinutes} minutes remaining to reach your goal
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No daily goal set. Set a goal to track your progress!
            </p>
            <Button size="sm" onClick={handleStartEdit}>
              Set Daily Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
