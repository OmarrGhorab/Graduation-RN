# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
This is a mobile application built with **React Native** and **Expo**, using **TypeScript**. It leverages **Expo Router** for navigation and **EAS** (Expo Application Services) for build and submission.

## Common Commands

### Setup & Development
- **Install Dependencies**: `npm install`
- **Start Development Server**: `npx expo start` (or `npm start`)
  - Use `w` for Web, `a` for Android, `i` for iOS in the terminal UI.
- **Run on specific platforms**:
  - Android: `npm run android`
  - iOS: `npm run ios`
  - Web: `npm run web`
- **Reset Project**: `npm run reset-project` (Resets the project state if needed)

### Code Quality
- **Lint Code**: `npm run lint` (Uses `eslint` with `eslint-config-expo`)

### Testing
- *Note: No test scripts are currently configured in `package.json`.*

## Architecture & Structure

### Key Directories
- **`app/`**: Contains the application source code and routing configuration (Expo Router).
  - **`_layout.tsx`**: The root layout file.
  - **`(auth)/`**: A route group for authentication-related screens (Sign in, Sign up, Password reset). These routes are accessible without the `(auth)` prefix in the URL.
  - **`onboarding/`**: Contains onboarding flow screens (`step1`, `step2`, `step3`).
  - **`index.tsx`**: The main entry screen of the application.
- **`components/`**: Reusable UI components (e.g., `toast.tsx`).
- **`services/`**: Intended for API services and data fetching logic (currently empty).
- **`hooks/`**: Custom React hooks.
- **`constants/`**: Application constants.
- **`assets/`**: Static assets like images and fonts.

### Routing
This project uses **Expo Router**'s file-based routing.
- Files in `app/` automatically become routes.
- Directories enclosed in parentheses (e.g., `(auth)`) are **Groups** and do not affect the URL path.
- `_layout.tsx` files are used to define shared UI (headers, tab bars, etc.) for routes in that directory.

### Path Aliases
- **`@/*`**: Maps to the project root (`./*`). This allows absolute imports (e.g., `import { Toast } from '@/components/toast'`).

### Configuration
- **`app.json`**: Expo config (name, slug, version, plugins).
- **`eas.json`**: Configuration for EAS Build (development, preview, production profiles).
- **`tsconfig.json`**: TypeScript configuration with strict mode enabled.
