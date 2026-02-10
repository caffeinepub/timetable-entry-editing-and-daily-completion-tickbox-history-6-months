# Specification

## Summary
**Goal:** Add study analytics (monthly summary, heatmap), a configurable daily study goal, task tagging, embedded notes for tasks/reminders, and an expanded coin reward shop with permanent ownership.

**Planned changes:**
- Backend: add a monthly study summary endpoint (total minutes + best 7-day week within the month) computed from existing study sessions across Pomodoro, Custom timer, and Stopwatch.
- Frontend: add an authenticated Monthly Study Summary view with month selector, plus loading/empty states and React Query fetching/refresh.
- Backend: add a per-day aggregated study minutes endpoint for a recent window (at minimum last 90 days), suitable for a continuous heatmap.
- Frontend: add a GitHub-style study heatmap view with intensity legend and day tooltip/popover, loaded via React Query with loading state.
- Backend: persist a per-user daily study goal (minutes) in the user profile and expose get/update methods with basic validation and sensible defaults.
- Frontend: add a daily goal progress UI (today’s minutes vs goal) and a control to set/update the daily goal, with React Query invalidation after updates/sessions.
- Backend: extend tasks to support 0..N text tags; support setting/updating tags and returning tags in task reads, preserving existing task data via conditional migration if needed.
- Frontend: add task tag add/remove in task create/edit and a simple To-Do filter by selected tag (including an “All” view), persisting via backend + React Query refresh.
- Backend + Frontend: support linking/unlinking existing notes to tasks and reminders, and creating a new note from within task/reminder edit flows; persist associations and handle missing/deleted notes gracefully.
- Backend + Frontend: expand the coin reward shop with at least one new purchasable item category beyond backgrounds, including coin cost, owned/unowned state, purchase confirmation, purchase blocking on insufficient coins, and per-user permanent ownership to prevent double-charging.

**User-visible outcome:** Users can view a monthly study summary and a recent study heatmap, set a daily study goal and track progress, tag tasks and filter by tag, attach notes to tasks and reminders (including creating notes inline), and buy additional shop items with coins with ownership saved so items aren’t recharged when reused.
