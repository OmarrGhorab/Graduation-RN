# Technology Stack

## Framework & Platform

- **React Native**: 0.81.5
- **Expo SDK**: ~54.0.30
- **React**: 19.1.0
- **TypeScript**: ~5.9.2 (strict mode enabled)
- **Node Package Manager**: npm

## Navigation & Routing

- **expo-router**: ~6.0.21 (file-based routing)
- **@react-navigation/native**: ^7.1.8
- **@react-navigation/bottom-tabs**: ^7.4.0

File-based routing structure in `/app` directory with support for:
- Route groups: `(auth)`, `(main)`
- Dynamic routes
- Typed routes (experimental feature enabled)

## State Management

- **@tanstack/react-query**: ^5.90.12 (server state, caching, data fetching)
- **zustand**: ^5.0.9 (client state management)
- **@react-native-async-storage/async-storage**: ^2.2.0 (persistent storage)

## Styling & UI

- **Custom StyleSheet**: No CSS-in-JS libraries or Tailwind
- **Theme System**: Centralized in `constants/theme.ts`
- **Fonts**: Rubik family (Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black)
- **Icons**: @expo/vector-icons (primarily Ionicons)
- **Animations**: react-native-reanimated ~4.1.1
- **Gradients**: expo-linear-gradient ~15.0.8

## Real-time Communication

- **WebSocket**: Custom WebSocketService for real-time messaging
- **SSE (Server-Sent Events)**: react-native-sse ^1.2.1 for notifications
- **Push Notifications**: expo-notifications ~0.32.15

## Key Libraries

- **Authentication**: @react-native-google-signin/google-signin ^16.0.0
- **Location**: expo-location ~19.0.8
- **Camera**: expo-camera ~17.0.10
- **Image Handling**: expo-image ~3.0.11, expo-image-picker ~17.0.10
- **Validation**: zod ^4.2.1
- **Internationalization**: i18n-js ^4.5.1
- **Gestures**: react-native-gesture-handler ~2.28.0

## Build & Development

### Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start

# Platform-specific builds
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web

# Code quality
npm run lint       # Run ESLint
```

### Build Configuration

- **EAS Build**: Configured with project ID
- **New Architecture**: Enabled (`newArchEnabled: true`)
- **React Compiler**: Experimental feature enabled
- **Android Package**: com.omarghorab.graduation
- **Google Services**: Configured for Android (google-services.json)

## API Integration

- **Base Client**: Centralized in `services/apiClient.ts`
- **Authentication**: Automatic token injection via `getValidAccessToken()`
- **Device Headers**: Automatic device info injection
- **Request Deduplication**: Built-in duplicate request prevention
- **Timeout Handling**: Default 30s timeout with AbortController
- **Error Handling**: Custom error types (ApiError, NetworkError, AuthError, TimeoutError)

## TypeScript Configuration

- **Strict Mode**: Enabled
- **Path Aliases**: `@/*` maps to workspace root
- **Expo Types**: Auto-generated types in `.expo/types`

## Platform Support

- iOS (tablet support enabled)
- Android (edge-to-edge, adaptive icons)
- Web (static output)

## Development Tools

- **ESLint**: expo config
- **VS Code**: Workspace configuration available
- **Git**: Version control with standard .gitignore
