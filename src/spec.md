# Specification

## Summary
**Goal:** Standardize Level rank labels across the app and update Level upgrade costs to scale by Level number (Level * 50), while keeping existing users’ saved Level data working.

**Planned changes:**
- Update all rank label displays to use exactly this 5-rank list everywhere: "Noob", "Beginner 📈", "Advanced Student 💪🏻", "Pro Student 🔥", "Sigma Student 🗿" (remove the 🫠 emoji from "Noob" and ensure consistent casing/spelling across UI and backend-derived display text).
- Revise Level upgrade coin-cost rules end-to-end so paid upgrades within a Level cost `level * 50` (Level 1 = 50, Level 2 = 100, …, Level 50 = 2500), while keeping Level 1 - Noob free (0 coins) and enforcing immediate-next-stage-only upgrades.
- Add backward-compatible handling for legacy persisted rank values (e.g., "Noob 🫠") so Level status fetching and upgrade/purchase flow continue to work for existing users without errors or inconsistent labels.

**User-visible outcome:** Ranks display consistently as the specified 5 labels (with "Noob" shown without 🫠), and upgrade costs correctly increase by Level (50, 100, 150, …) with existing users’ Level progress continuing to function normally.
