import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useGetTimetableTickHistoryForEntry, useToggleTimetableEntryForToday } from '../../hooks/useQueries';
import { isToday } from '../../utils/timetableDates';
import { toast } from 'sonner';

interface DoneTodayCheckboxProps {
  entryId: bigint;
}

export function DoneTodayCheckbox({ entryId }: DoneTodayCheckboxProps) {
  const { data: tickHistory = [], isLoading } = useGetTimetableTickHistoryForEntry(entryId);
  const toggleMutation = useToggleTimetableEntryForToday();

  const isDoneToday = tickHistory.some(tick => isToday(tick.timestamp));

  const handleToggle = async () => {
    try {
      await toggleMutation.mutateAsync(entryId);
    } catch (error) {
      toast.error('Failed to update completion status');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`done-${entryId}`}
        checked={isDoneToday}
        onCheckedChange={handleToggle}
        disabled={toggleMutation.isPending || isLoading}
      />
      <Label
        htmlFor={`done-${entryId}`}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        Done today
      </Label>
    </div>
  );
}
