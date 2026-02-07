import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Task, TimetableEntry, Note, Reminder, ExternalBlob, TimerSessionV2, UserProfile, TimetableTick } from '../backend';

// Profile Management
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useInitializeProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, bio }: { name: string; bio: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.initializeProfile(name, bio);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      queryClient.invalidateQueries({ queryKey: ['studyStreak'] });
    },
  });
}

export function useUpdateCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileImage, bio }: { profileImage: ExternalBlob | null; bio: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateCallerProfile(profileImage, bio);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useChangeDisplayName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.changeDisplayName(newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
    },
  });
}

export function useGetCoinBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['coinBalance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCoinBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSpendCoinsForBackground() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rarity: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.spendCoinsForBackground(rarity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function usePurchaseCustomBackground() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backgroundId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.purchaseCustomBackground(backgroundId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['backgroundOwnership'] });
    },
  });
}

export function useIsBackgroundOwned(backgroundId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['backgroundOwnership', backgroundId],
    queryFn: async () => {
      if (!actor || !backgroundId) return false;
      return actor.isBackgroundOwned(backgroundId);
    },
    enabled: !!actor && !isFetching && !!backgroundId,
  });
}

// Tasks
export function useGetAllTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      subject,
      priority,
    }: {
      title: string;
      description: string;
      subject: string;
      priority: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addTask(title, description, subject, priority);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Timetable
export function useGetTimetableEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<TimetableEntry[]>({
    queryKey: ['timetable'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTimetableEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTimetableEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      activityType,
      startTime,
      endTime,
      colorCode,
    }: {
      title: string;
      activityType: string;
      startTime: bigint;
      endTime: bigint;
      colorCode: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addTimetableEntry(title, activityType, startTime, endTime, colorCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

export function useUpdateTimetableEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newTitle,
      newActivityType,
      newColorCode,
    }: {
      id: bigint;
      newTitle: string;
      newActivityType: string;
      newColorCode: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTimetableEntry(id, newTitle, newActivityType, newColorCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['timetableTickHistory'] });
    },
  });
}

export function useDeleteTimetableEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteTimetableEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['timetableTickHistory'] });
    },
  });
}

export function useToggleTimetableEntryForToday() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.toggleTimetableEntryForToday(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableTickHistory'] });
    },
  });
}

export function useGetTimetableTickHistoryForEntry(entryId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TimetableTick[]>({
    queryKey: ['timetableTickHistory', entryId?.toString()],
    queryFn: async () => {
      if (!actor || !entryId) return [];
      return actor.getTimetableTickHistoryForEntry(entryId);
    },
    enabled: !!actor && !isFetching && entryId !== null,
  });
}

// Notes
export function useGetAllNotes() {
  const { actor, isFetching } = useActor();

  return useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      subject,
    }: {
      title: string;
      content: string;
      subject: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addNote(title, content, subject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      title,
      content,
      imageUrls,
      voiceNoteUrls,
    }: {
      noteId: bigint;
      title: string;
      content: string;
      imageUrls: ExternalBlob[];
      voiceNoteUrls: ExternalBlob[];
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateNote(noteId, title, content, imageUrls, voiceNoteUrls);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// Reminders
export function useGetUpcomingReminders(currentTime: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Reminder[]>({
    queryKey: ['reminders', currentTime.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingReminders(currentTime);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, reminderTime }: { title: string; reminderTime: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addReminder(title, reminderTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

// Timer Sessions
export function useRecordTimerSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ durationMinutes, completed }: { durationMinutes: bigint; completed: boolean }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.recordTimerSession(durationMinutes, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studyStreak'] });
    },
  });
}

export function useGetTimerSessions() {
  const { actor, isFetching } = useActor();

  return useQuery<TimerSessionV2[]>({
    queryKey: ['timerSessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTimerSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

// Study Streak
export function useGetStudyStreak() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['studyStreak'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getStudyStreak();
    },
    enabled: !!actor && !isFetching,
  });
}

// Stopwatch
export function useCompleteStopwatchSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (elapsedMinutes: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.completeStopwatchSession(elapsedMinutes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studyStreak'] });
    },
  });
}
