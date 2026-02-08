# Specification

## Summary
**Goal:** Let users remove their profile photo (avatar) from the Profile page and have that removal persist across sessions.

**Planned changes:**
- Add a clear “Remove Photo” action on the Profile page when the user currently has a profile image (accessible in edit mode or otherwise clearly available), including a confirmation step.
- On confirmed removal, call the existing profile update flow with `profileImage = null` while leaving the bio unchanged unless the user edits it.
- Ensure local avatar upload state (selected file and any temporary preview URL) is cleared when removal succeeds or when the user cancels editing.
- Update the backend profile update handling so a `null`/`none` `profileImage` clears the stored profile image, and profile reads return `profileImage = null` afterward without altering unrelated fields.
- Ensure the header/avatar UI re-renders promptly to the fallback avatar after removal by invalidating/refetching the existing `currentUserProfile` query.

**User-visible outcome:** Users can remove their profile photo and immediately see the default fallback avatar (initial letter) across the Profile page and header, and the removal remains after reload or re-login.
