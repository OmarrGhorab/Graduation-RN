# AI Agent Prompt: Create Notification UI/UX Screens

**Role:** Expert UI/UX Designer and React Native Developer.

**Objective:** Create a premium, visually stunning Notification UI for a React Native (Expo) application. The design must feature "rich aesthetics" suitable for a modern mobile app, using animations and a polished design system.

## 1. Technical Context
- **Framework:** React Native (Expo SDK 50+).
- **Navigation:** `expo-router`.
- **State Management:** React Query (`@tanstack/react-query`) + Zustand.
- **Styling:** Custom StyleSheet + constants (no Tailwind).
- **Animations:** `react-native-reanimated`.
- **Icons:** `@expo/vector-icons` (Ionicons).
- **Fonts:** `Rubik` (Light, Regular, Medium, SemiBold, Bold).

## 2. Design System (Must Follow Strictly)
You must strictly adhere to the project's existing design tokens found in `constants/theme.ts`.

### Colors & Palette
- **Primary (CSK Green):** `#097D46` (Light Mode), `#4FBF8A` (Dark Mode).
- **Background:** `#FFFFFF` (Light), `#121212` (Dark).
- **Surface/Cards:** `#F7F8F9` (Light), `#1E1E1E` (Dark).
- **Text:**
    - Primary: `#11181C` (Light), `#E1E5E9` (Dark).
    - Secondary: `#696F77` (Light), `#A8B0B8` (Dark).
- **Status Colors:**
    - Warning: `#FFB547`
    - Error: `#EF4444`
    - Accepted/Success: `#097D46`

### Typography
- **Font Family:** `Rubik`
- **Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold).
- **Borders:** Curved radii (approx 12-16px for cards), subtle borders (`#D1D5D9` Light / `#3A4048` Dark).

## 3. Requirements for the Notification Screen

Create a **Notification Screen** (and components) that replaces or enhances the current "Modal" approach.

### Feature Requirements:
1.  **Notification List:**
    -   Group notifications (e.g., "New", "Earlier").
    -   Swipeable items (Swipe left to delete).
    -   Pull-to-refresh functionality (already supported by React Query).
    -   Infinite scroll support.

2.  **Notification Item Types:**
    -   **Standard Info:** Icon/Avatar + Title + Body + Time.
    -   **Friend/Parent Request:** Needs explicit **Action Buttons** (Accept / Decline) embedded in the card.
        -   *Current Logic:* Handled via `parent_link_request`.
        -   *States:* Pending (Actions visible), Accepted (Green check badge), Declined (Red X badge).
    -   **Chat Message:** Avatar + "New Message" preview.

3.  **Visual Polish:**
    -   Use `LinearGradient` for badges or special highlights if appropriate (using `primaryGradient` tokens).
    -   Subtle entry animations (FadeInUp) using `react-native-reanimated`.
    -   Empty State: A beautiful illustration or icon (use `Ionicons` `notifications-off-outline`) with encouraging text.
    -   Loading Skeleton: Shimmer effect for loading states.

4.  **Header:**
    -   "Notifications" title.
    -   Action to "Mark All as Read".
    -   Badge count for unread items.

## 4. Code Structure
Start by creating the files:
-   `components/notifications/NotificationScreen.tsx`
-   `components/notifications/NotificationCard.tsx` (Smart component handling logic based on `type`)
-   `components/notifications/NotificationSectionHeader.tsx`

## 5. Mock Data Interface used in the app
```typescript
interface ApiNotification {
    id: string;
    type: 'info' | 'parent_link_request' | 'chat_message' | 'location_request';
    read: boolean;
    createdAt: string;
    data: {
        title: string;
        body: string;
        requestId?: string;
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
        child?: {
            name: string;
            profileImg?: string;
        };
    };
}
```

**Deliverable:**
Provide the full React Native code for these components, ensuring they are fully styled, responsive, and implement the "Premium" look requested.
