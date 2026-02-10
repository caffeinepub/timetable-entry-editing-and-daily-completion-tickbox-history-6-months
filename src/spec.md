# Specification

## Summary
**Goal:** Fix the Scholar Gold logo mismatch by regenerating the app icon and favicon assets to match the latest uploaded reference, and update all frontend references to use the new cache-safe filenames.

**Planned changes:**
- Regenerate Scholar Gold PNG icon assets from `Screenshot_2026_0210_153957-1.jpg`, matching the ornate gold circular border, deep navy radial background, central gold book icon, “SCHOLAR GOLD” text, and “made by PD” subtitle.
- Export at least 512x512, 192x192, and 32x32 PNGs using fresh cache-safe filenames and store them under `frontend/public/assets/generated`.
- Update `frontend/index.html` to reference the new favicon/app icon filenames (32x32, 192x192, 512x512) instead of any `*-v3.*` assets.
- Update `frontend/src/components/Header.tsx` and `frontend/src/components/LoginScreen.tsx` to reference the new 512x512 brand logo icon filename instead of the existing `*-v3.*` asset.

**User-visible outcome:** After a normal reload, the browser tab favicon and the brand logo shown on the login screen and header match the latest Scholar Gold reference image without requiring manual cache clearing.
