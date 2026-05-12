# Repository Guidelines

## Project Structure & Module Organization
This repository is an Expo Router mobile app written in TypeScript. Route files live in `app/`; tab routes are grouped under `app/(tabs)/`, and shared layout entry points are in `app/_layout.tsx` and `app/(tabs)/_layout.tsx`. Reusable UI belongs in `components/`, with lower-level primitives in `components/ui/`. Theme values are centralized in `constants/theme.ts`, shared hooks live in `hooks/`, static images are stored in `assets/images/`, and one-off maintenance scripts live in `scripts/`.

## Build, Test, and Development Commands
Use `npm install` to install dependencies. Start the Metro/Expo dev server with `npm run start`. Platform-specific entry points are `npm run android`, `npm run ios`, and `npm run web`. Run `npm run lint` before opening a PR; it uses Expo's ESLint configuration. `npm run reset-project` restores the Expo starter layout and should only be used intentionally.

## Coding Style & Naming Conventions
Follow the existing TypeScript and React Native style: functional components, named imports, and 2-space indentation. Use PascalCase for component files such as `ThemedText.tsx`, camelCase for hooks such as `useColorScheme`, and keep route filenames aligned with their URL segment, for example `app/modal.tsx`. Prefer shared values in `constants/` and shared behavior in `hooks/` instead of duplicating logic in screens.

## Testing Guidelines
There is no automated test suite configured yet. Until one is added, treat `npm run lint` as the required baseline check and manually verify changed flows in Expo on at least one target (`android`, `ios`, or `web`). When adding tests, place them next to the feature or in a local `__tests__/` folder, and name them `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Git history is minimal today (`Initial commit`), so use short, imperative commit subjects going forward, for example `Add expense summary card` or `Fix theme hook typing`. Keep commits focused on one change. PRs should include: a brief summary, affected screens or modules, manual verification steps, and screenshots or recordings for UI changes. Link the related issue when one exists.

## Configuration Notes
Primary app configuration lives in `app.json`; TypeScript pathing and compiler behavior are in `tsconfig.json`; lint rules are in `eslint.config.js`. Do not commit secrets or environment-specific tokens. Keep asset filenames stable once referenced by config or routes.
