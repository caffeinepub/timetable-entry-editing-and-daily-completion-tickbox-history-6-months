import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetTimetableTickHistoryForEntry } from '../../hooks/useQueries';
import { TimetableEntry } from '../../backend';
import { getLast6MonthsCompletion } from '../../utils/timetableHistory';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimetableCompletionHistoryDialogProps {
  entry: TimetableEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimetableCompletionHistoryDialog({
  entry,
  open,
  onOpenChange,
}: TimetableCompletionHistoryDialogProps) {
  const { data: tickHistory = [], isLoading } = useGetTimetableTickHistoryForEntry(
    entry?.id || null
  );

  if (!entry) return null;

  const completionData = getLast6MonthsCompletion(tickHistory);
  const reversedData = [...completionData].reverse();

  const completedCount = completionData.filter(d => d.completed).length;
  const totalDays = completionData.length;
  const completionRate = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{entry.title} - Completion History</DialogTitle>
          <DialogDescription>
            Last 6 months of daily completion status
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading history...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-sm text-muted-foreground">Days Completed</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold">{totalDays}</div>
                <div className="text-sm text-muted-foreground">Total Days</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold">{completionRate}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>Not completed</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {reversedData.map((day) => {
                  const date = new Date(day.date);
                  const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm">{formattedDate}</span>
                      {day.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
