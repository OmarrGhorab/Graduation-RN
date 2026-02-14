# Project Structure

## Root Directory Layout

```
/
├── app/                    # File-based routing (expo-router)
├── components/             # Reusable UI components
├── services/               # API clients and business logic
├── constants/              # Theme, config, and static values
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── libs/                   # Utility libraries and helpers
├── assets/                 # Images, fonts, and static assets
├── android/                # Native Android code (generated)
├── .expo/                  # Expo build artifacts
├── .kiro/                  # Kiro AI configuration
└── .vscode/                # VS Code workspace settings
```

## App Directory (Routing)

File-based routing with expo-router conventions:

- **Route Groups**: Directories wrapped in parentheses `(auth)`, `(main)` - not part of URL
- **Layout Files**: `_layout.tsx` - defines shared layout for route segment
- **Index Routes**: `index.tsx` - default route for directory
- **Dynamic Routes**: `[id].tsx` - parameterized routes

### Key Route Groups

- `app/(auth)/` - Authentication flows (login, signup)
- `app/(main)/` - Main authenticated app screens
- `app/onboarding/` - User onboarding flow
- `app/conversation/` - Chat/messaging screens
- `app/group-info/` - Group details
- `app/location-history/` - Location tracking views

## Components Directory

Organized by feature/domain:

```
components/
├── auth/                   # Authentication components
├── home/                   # Home screen components
├── course/                 # Course-related components
├── profile/                # User profile components
├── location/               # Location tracking components
├── navigation/             # Navigation-specific components
├── onboarding/             # Onboarding flow components
├── settings/               # Settings screen components
├── account/                # Account management components
├── NotificationModal/      # Notification UI components
├── toast-components/       # Toast notification components
└── [shared components]     # Shared/common components at root
```

### Component Naming Conventions

- **PascalCase** for component files: `HomeHeader.tsx`, `NotificationBadge.tsx`
- **Feature-grouped**: Components organized by feature domain
- **Co-location**: Related components grouped in feature folders

## Services Directory

API clients and business logic services:

```
services/
├── auth/                   # Authentication service modules
├── apiClient.ts            # Base HTTP client with interceptors
├── AuthService.ts          # Authentication logic
├── ChatService.ts          # Chat/messaging API
├── CourseService.ts        # Course management API
├── LocationService.ts      # Location tracking API
├── NotificationService.ts  # Push notifications
├── NotificationSSEService.ts # SSE notification stream
├── WebSocketService.ts     # WebSocket connection management
└── [other services]        # Domain-specific services
```

### Service Patterns

- All services use `apiClient` from `services/apiClient.ts`
- Automatic token injection and device headers
- Centralized error handling
- Request deduplication built-in

## Constants Directory

Centralized configuration and theme:

- `theme.ts` - Complete design system (colors, fonts, gradients)
- `config.ts` - App configuration (API URLs, feature flags)
- Other constant values and enums

## Hooks Directory

Custom React hooks for shared logic:

- Follow `use[Name]` naming convention
- Encapsulate reusable stateful logic
- May integrate with React Query or Zustand

## Types Directory

TypeScript type definitions:

- `errors.ts` - Custom error types (ApiError, NetworkError, etc.)
- Domain-specific type definitions
- Shared interfaces and types

## Path Aliases

Use `@/` prefix for imports from workspace root:

```typescript
import { Colors } from '@/constants/theme';
import { apiClient } from '@/services/apiClient';
import HomeHeader from '@/components/HomeHeader';
```

## Styling Conventions

- **No external CSS libraries** - Use React Native StyleSheet
- **Theme imports**: Always import from `@/constants/theme`
- **Color usage**: Use `Colors.light` and `Colors.dark` from theme
- **Font usage**: Use `Fonts` object from theme with appropriate weight
- **Responsive**: Use `Platform.select()` for platform-specific styles

## File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Services**: PascalCase with Service suffix (e.g., `AuthService.ts`)
- **Hooks**: camelCase with use prefix (e.g., `useAuth.ts`)
- **Types**: camelCase (e.g., `errors.ts`, `user.types.ts`)
- **Constants**: camelCase (e.g., `theme.ts`, `config.ts`)

## Import Order Convention

1. React and React Native imports
2. Third-party libraries
3. Local imports with `@/` alias
4. Relative imports
5. Type imports (if separated)

## Generated Directories (Do Not Edit)

- `.expo/` - Expo build artifacts and generated types
- `android/` - Generated native Android code
- `ios/` - Generated native iOS code (if present)
- `node_modules/` - Dependencies
