# Course Details Screen Refactoring

## Overview
Refactor the course-details.tsx screen to fix critical bugs, improve maintainability, and follow React Native best practices.

## Problem Statement
The course details screen has undergone an incomplete refactoring that removed the StyleSheet definition, causing runtime crashes. Additionally, the component is monolithic with multiple responsibilities, making it difficult to maintain and test.

## User Stories

### 1. As a developer, I need the app to run without crashes
**Acceptance Criteria:**
- 1.1 The StyleSheet object must be restored with all required style definitions
- 1.2 All style references in JSX must resolve to valid style objects
- 1.3 No runtime errors occur when navigating to the course details screen
- 1.4 The screen renders correctly in both light and dark modes

### 2. As a developer, I need proper TypeScript type safety
**Acceptance Criteria:**
- 2.1 Icon names must use proper Ionicons type instead of `as any` casting
- 2.2 All function parameters have explicit types
- 2.3 No TypeScript errors or warnings in the file
- 2.4 Nullable types are handled correctly (e.g., `attendanceStatus?: string | null`)

### 3. As a developer, I need the component to be maintainable
**Acceptance Criteria:**
- 3.1 Extract hero section into separate component
- 3.2 Extract instructor card into separate component
- 3.3 Extract lesson item into separate component
- 3.4 Extract create lesson modal into separate component
- 3.5 Main component should be under 300 lines
- 3.6 Each extracted component should have a single responsibility

### 4. As a developer, I need consistent code organization
**Acceptance Criteria:**
- 4.1 All helper functions (getLessonIcon, getLessonIconColor) moved to utils or hooks
- 4.2 Modal logic extracted to custom hook
- 4.3 Lesson creation logic extracted to custom hook or service
- 4.4 File follows project structure conventions from structure.md

### 5. As a user, I need all existing functionality to work
**Acceptance Criteria:**
- 5.1 Course enrollment works correctly
- 5.2 QR code scanning for attendance works
- 5.3 Lesson creation modal works for teachers
- 5.4 Starting lessons works for teachers
- 5.5 Module expansion/collapse works
- 5.6 Navigation to related screens works
- 5.7 All action buttons function correctly

## Technical Requirements

### Component Structure
```
components/course/
├── CourseHero.tsx           # Hero image with navigation
├── CourseMainCard.tsx       # Title, badge, instructor card
├── InstructorCard.tsx       # Instructor info with profile link
├── CourseDescription.tsx    # Description with read more
├── LessonItem.tsx          # Individual lesson with actions
├── CreateLessonModal.tsx   # Lesson creation modal
└── index.ts                # Barrel export
```

### Custom Hooks
```
hooks/
├── useLessonActions.ts     # Lesson action handlers
└── useCreateLessonModal.ts # Modal state and creation logic
```

### Utils
```
libs/
└── lessonHelpers.ts        # Icon and status helper functions
```

## Non-Functional Requirements

### Performance
- Component memoization where appropriate
- Avoid unnecessary re-renders
- Efficient list rendering for lessons

### Code Quality
- Follow ESLint rules
- Use TypeScript strict mode
- Follow naming conventions from structure.md
- Maintain existing theme system usage

### Testing Considerations
- Extracted components should be testable in isolation
- Business logic in hooks should be unit testable
- Helper functions should be pure and testable

## Out of Scope
- Changing the UI design or layout
- Adding new features
- Modifying API integration
- Changing navigation structure

## Dependencies
- Existing hooks: `useCourseDetails`, `useEnrollCourse`, `useCreateLesson`, `useLessonMutations`
- Existing components: `QRScannerModal`
- Theme system from `@/constants/theme`
- All existing third-party libraries

## Success Metrics
- Zero runtime errors
- Zero TypeScript errors
- Main component under 300 lines
- At least 5 extracted components
- 100% feature parity with current implementation
