# Specification

## Summary
**Goal:** Add profile cosmetics (frame overlay, badge display, and theme-based app backgrounds) and update the streak freeze cost to 50 coins.

**Planned changes:**
- Change Streak Freeze price to 50 coins everywhere it is enforced and displayed (backend validation and all frontend UI text).
- Update Profile avatar rendering so an unlocked/selected frame overlays on top of the circular avatar edge (including fallback initials), with no overlay when no frame is selected/owned.
- Add a Profile badges area that displays earned streak milestone badges and coin-purchased badges, persisted across reloads/logins.
- Apply the user’s selected purchased theme as the global app background (not only within background settings) and persist the selection across reloads/logins, with a default fallback when none is selected.

**User-visible outcome:** Users see the Streak Freeze cost as 50 coins and can only buy it with at least 50 coins; profile frames visibly overlay the avatar; earned/purchased badges appear on the profile; and selected themes change the app’s overall background and persist between sessions.
