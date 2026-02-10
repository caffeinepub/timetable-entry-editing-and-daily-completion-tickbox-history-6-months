# Specification

## Summary
**Goal:** Update Scholar Gold branding to use a new gold circular logo design (matching the provided reference) and replace all app icon/favicon assets and references with cache-safe new filenames.

**Planned changes:**
- Create new PNG logo/icon assets that match the reference look (navy radial-gradient background, ornate gold circular border with glow, central book icon, metallic “Scholar Gold” text, and subtitle “MADE BY PD”) in sizes 512x512, 192x192, and 32x32.
- Replace frontend references to the existing v2 icon files with the new cache-safe filenames in:
  - `frontend/index.html` (favicon/app icon links)
  - `frontend/src/components/Header.tsx` (authenticated header brand logo)
  - `frontend/src/components/LoginScreen.tsx` (login screen header brand logo)

**User-visible outcome:** After a normal reload, the browser favicon and in-app brand logo display the new gold circular Scholar Gold design, and the app uses the updated icon set.
