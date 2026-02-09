# Specification

## Summary
**Goal:** Improve reliability of profile avatar uploads, add a weekly study-time graph, and enable full reminder/task management with accurate in-app reminder notifications.

**Planned changes:**
- Fix profile photo upload/persistence so the saved avatar reliably renders immediately, after reload, and after logout/login, with clear error handling on failure.
- Add a weekly (last 7 days) study-time graph showing minutes per day with both a combined total and a per-mode breakdown (Pomodoro vs Custom timer vs Stopwatch), backed by persisted data (including explicit 0-minute days).
- Add Edit/Delete actions for reminders (update at least title and date/time), persist changes, and keep Upcoming Reminders in sync via existing React Query invalidation with user-ownership enforcement.
- Implement in-app browser notifications that fire at the reminder time while the app is open, avoid duplicate notifications per reminder, and show guidance when notification permissions are not granted.
- Add Edit/Delete actions for tasks (update at minimum title, plus description/subject/priority if present), persist changes, keep tasks list in sync via existing React Query invalidation, and enforce user ownership.
- Allow tasks’ completion to be toggled both directions (completed ↔ not completed) with persistence and proper movement between Completed/Pending states.

**User-visible outcome:** Users can reliably set and keep their profile avatar, view a 7-day study-time chart with totals and per-mode breakdown, edit/delete reminders and tasks, receive accurate in-app reminder notifications while the app is open (without duplicates), and toggle tasks between completed and not completed.
