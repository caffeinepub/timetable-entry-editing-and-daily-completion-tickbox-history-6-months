import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Note {
    id: bigint;
    title: string;
    content: string;
    subject: string;
    imageUrls: Array<ExternalBlob>;
    modifiedAt: Time;
    createdAt: Time;
    voiceNoteUrls: Array<ExternalBlob>;
}
export interface UserProfile {
    bio: string;
    profileImage?: ExternalBlob;
    name: string;
    coins: bigint;
    finishedSetup: boolean;
    nameChangeCount: bigint;
}
export type Time = bigint;
export interface TimerSessionV2 {
    endTime: bigint;
    createdAt: Time;
    completed: boolean;
    durationMinutes: bigint;
    sessionId: bigint;
    isBackground: boolean;
}
export interface PersistentStopwatch {
    startTime: Time;
    accumulatedTime: bigint;
    isRunning: boolean;
}
export interface Task {
    id: bigint;
    title: string;
    subject: string;
    createdAt: Time;
    completed: boolean;
    description: string;
    priority: bigint;
}
export interface TimetableEntry {
    id: bigint;
    startTime: bigint;
    title: string;
    activityType: string;
    colorCode: string;
    endTime: bigint;
    createdAt: Time;
}
export interface TimetableTick {
    entryId: bigint;
    timestamp: bigint;
}
export interface Reminder {
    id: bigint;
    title: string;
    createdAt: Time;
    reminderTime: bigint;
}
export interface PersistentFocusTimer {
    isActive: boolean;
    remainingMinutes: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addNote(title: string, content: string, subject: string): Promise<bigint>;
    addNoteImage(noteId: bigint, imageUrl: ExternalBlob): Promise<void>;
    addReminder(title: string, reminderTime: bigint): Promise<bigint>;
    addTask(title: string, description: string, subject: string, priority: bigint): Promise<bigint>;
    addTimetableEntry(title: string, activityType: string, startTime: bigint, endTime: bigint, colorCode: string): Promise<bigint>;
    addVoiceNote(noteId: bigint, voiceNoteUrl: ExternalBlob): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeDisplayName(newName: string): Promise<void>;
    clearFocusTimer(): Promise<void>;
    completeStopwatchSession(elapsedMinutes: bigint): Promise<boolean>;
    completeTask(taskId: bigint): Promise<void>;
    deleteNote(noteId: bigint): Promise<void>;
    deleteReminder(reminderId: bigint): Promise<void>;
    deleteTask(taskId: bigint): Promise<void>;
    deleteTimetableEntry(entryId: bigint): Promise<void>;
    getAllNotes(): Promise<Array<Note>>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoinBalance(): Promise<bigint>;
    getFocusTimerState(): Promise<PersistentFocusTimer | null>;
    getFullPersistentStopwatchState(): Promise<[boolean, bigint]>;
    getNewUserNeedsOnboarding(): Promise<boolean>;
    getPersistentStopwatchElapsedTime(): Promise<bigint>;
    getPersistentStopwatchState(): Promise<PersistentStopwatch | null>;
    getStudyStreak(): Promise<bigint>;
    getTimerSessions(): Promise<Array<TimerSessionV2>>;
    getTimetableEntries(): Promise<Array<TimetableEntry>>;
    getTimetableTickHistoryForEntry(entryId: bigint): Promise<Array<TimetableTick>>;
    getTimetableTickStatsForEntry(entryId: bigint): Promise<[bigint, Array<bigint>]>;
    getTodayStopwatchRewardCount(): Promise<bigint>;
    getUpcomingReminders(currentTime: bigint): Promise<Array<Reminder>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeProfile(name: string, bio: string): Promise<void>;
    isBackgroundOwned(backgroundId: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    markProfileSetupFinished(): Promise<void>;
    pausePersistentStopwatch(): Promise<void>;
    purchaseCustomBackground(backgroundId: string): Promise<boolean>;
    recordTimerSession(durationMinutes: bigint, completed: boolean): Promise<bigint>;
    removeNoteImage(noteId: bigint, imageUrl: ExternalBlob): Promise<void>;
    removeVoiceNote(noteId: bigint, voiceNoteUrl: ExternalBlob): Promise<void>;
    resetPersistentStopwatch(): Promise<void>;
    resumePersistentStopwatch(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchNotes(searchTerm: string): Promise<Array<Note>>;
    spendCoinsForBackground(rarity: string): Promise<boolean>;
    startBackgroundFocusTimer(durationMinutes: bigint): Promise<void>;
    startPersistentStopwatch(): Promise<void>;
    toggleTimetableEntryForToday(entryId: bigint): Promise<boolean>;
    updateCallerProfile(profileImage: ExternalBlob | null, bio: string): Promise<void>;
    updateFocusTimerState(remainingMinutes: bigint, isActive: boolean): Promise<void>;
    updateNote(noteId: bigint, title: string, content: string, imageUrls: Array<ExternalBlob>, voiceNoteUrls: Array<ExternalBlob>): Promise<void>;
    updateTimetableEntry(id: bigint, newTitle: string, newActivityType: string, newColorCode: string): Promise<void>;
}
