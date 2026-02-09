import type { StudySession } from '../backend';

export interface DayStudyData {
  day: string;
  pomodoro: number;
  custom: number;
  stopwatch: number;
}

export function aggregateWeeklyStudyData(sessions: StudySession[]): DayStudyData[] {
  const now = new Date();
  const last7Days: DayStudyData[] = [];

  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    last7Days.push({
      day: dayLabel,
      pomodoro: 0,
      custom: 0,
      stopwatch: 0,
    });
  }

  // Aggregate sessions by day
  sessions.forEach((session) => {
    if (!session.completed) return;

    const sessionDate = new Date(Number(session.createdAt / BigInt(1000000)));
    const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff < 7) {
      const dayIndex = 6 - daysDiff;
      const minutes = Number(session.durationMinutes);
      
      // Normalize session type
      const sessionType = session.sessionType.toLowerCase().trim();
      
      if (sessionType === 'pomodoro') {
        last7Days[dayIndex].pomodoro += minutes;
      } else if (sessionType === 'custom') {
        last7Days[dayIndex].custom += minutes;
      } else if (sessionType === 'stopwatch') {
        last7Days[dayIndex].stopwatch += minutes;
      }
    }
  });

  return last7Days;
}
