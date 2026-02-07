import { TimetableTick } from '../backend';
import { timestampToDateKey } from './timetableDates';

export interface DayCompletion {
  date: string;
  completed: boolean;
}

export function getLast6MonthsRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  return { startDate, endDate };
}

export function generateDayList(startDate: Date, endDate: Date): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

export function mapTickHistoryToDays(ticks: TimetableTick[]): Map<string, boolean> {
  const completionMap = new Map<string, boolean>();
  
  for (const tick of ticks) {
    const dateKey = timestampToDateKey(tick.timestamp);
    completionMap.set(dateKey, true);
  }
  
  return completionMap;
}

export function getLast6MonthsCompletion(ticks: TimetableTick[]): DayCompletion[] {
  const { startDate, endDate } = getLast6MonthsRange();
  const allDays = generateDayList(startDate, endDate);
  const completionMap = mapTickHistoryToDays(ticks);
  
  return allDays.map(date => ({
    date,
    completed: completionMap.get(date) || false,
  }));
}
