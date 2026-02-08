# Specification

## Summary
**Goal:** Fix the Level progression/upgrade flow to remove glitches and ensure user avatars reliably upload, persist, and display.

**Planned changes:**
- Rebuild Level system logic end-to-end so current stage, next stage, upgrade eligibility, coin costs (50 per paid upgrade), and max-level handling (Level 50 - Sigma Student 🗿) consistently follow the intended rules.
- Ensure upgrades are restricted to purchasing only the immediate next stage, with correct “Next Level” display and disabled/enabled upgrade state based on coin balance.
- Make post-upgrade UI refresh automatically (coin balance and level status) without requiring a page reload.
- Add/fix profile avatar upload so saved images persist to the backend, return in the profile API, and render reliably (including after reload/log out + log in), with a non-broken fallback when no avatar is set.
- Improve error handling for avatar upload/save and max-level upgrade attempts so users see clear English messages (no raw backend trap text).

**User-visible outcome:** Level progression and upgrading behave consistently (including max-level behavior), and users can upload a profile photo that persists and displays correctly across sessions, with clear error messages when something fails.
