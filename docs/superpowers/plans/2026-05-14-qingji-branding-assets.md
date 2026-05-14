# Qingji Branding Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and apply the approved `轻记` icon and splash assets for the Expo mobile app.

**Architecture:** Use a local PowerShell drawing script to deterministically render PNG assets from one shared visual spec. Keep Expo config pointing at stable asset filenames so the app can consume the new branding without code changes elsewhere.

**Tech Stack:** PowerShell, .NET `System.Drawing`, Expo app config

---

### Task 1: Document the approved branding

**Files:**
- Create: `account-app-mobile/docs/superpowers/specs/2026-05-14-qingji-branding-design.md`
- Create: `account-app-mobile/docs/superpowers/plans/2026-05-14-qingji-branding-assets.md`

- [ ] Step 1: Write the approved naming, icon concept, color palette, and asset scope into the spec file.
- [ ] Step 2: Save a short implementation plan covering asset generation and Expo config updates.

### Task 2: Add a deterministic asset generator

**Files:**
- Create: `account-app-mobile/scripts/generate-brand-assets.ps1`

- [ ] Step 1: Add shared drawing helpers for rounded rectangles, folded page, accent fold, and handwritten line.
- [ ] Step 2: Render the full app icon, adaptive icon foreground/background, monochrome icon, splash symbol, and favicon PNG outputs.
- [ ] Step 3: Keep filenames aligned with existing `app.json` references.

### Task 3: Apply the branding in Expo config

**Files:**
- Modify: `account-app-mobile/app.json`

- [ ] Step 1: Rename the Expo app to `轻记`.
- [ ] Step 2: Set `slug` and `scheme` to `qingji`.
- [ ] Step 3: Update splash background colors to match the approved mint palette.

### Task 4: Generate and verify outputs

**Files:**
- Modify: `account-app-mobile/assets/images/*`

- [ ] Step 1: Run `powershell -ExecutionPolicy Bypass -File .\\scripts\\generate-brand-assets.ps1`.
- [ ] Step 2: Verify that each target PNG exists and has the expected dimensions.
- [ ] Step 3: Run `npm run lint` only if any code/config changes require syntax validation.
