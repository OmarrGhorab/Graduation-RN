# Requirements Document

## Introduction

This specification defines the requirements for refactoring the create-lesson.tsx screen to improve code quality, maintainability, testability, and developer experience while preserving all existing functionality and user experience. The refactoring addresses technical debt accumulated in a 646-line component with fragmented state management, inline validation logic, and limited type safety.

## Glossary

- **Form_State**: The collection of all user input values for creating a lesson (course selection, title, description, schedule, delivery type, location)
- **Validation_Logic**: Rules that determine whether form input is valid before submission
- **Form_Component**: A reusable UI component that handles a specific type of form input (text, date, segmented control)
- **Custom_Hook**: A React hook that encapsulates reusable stateful logic
- **Type_Safety**: TypeScript's ability to catch type-related errors at compile time
- **Component_Decomposition**: Breaking a large component into smaller, focused components
- **Separation_of_Concerns**: Organizing code so that each module has a single, well-defined responsibility

## Requirements

### Requirement 1: Form State Management Consolidation

**User Story:** As a developer, I want form state managed in a single, cohesive structure, so that state updates are predictable and easier to maintain.

#### Acceptance Criteria

1. THE System SHALL consolidate all 11 separate useState calls into a unified form state structure
2. WHEN form state is updated, THE System SHALL maintain type safety for all field values
3. THE System SHALL provide a custom hook that encapsulates form state management logic
4. THE System SHALL expose setter functions for individual form fields from the custom hook
5. THE System SHALL initialize form state with default values including any URL parameters

### Requirement 2: Validation Logic Extraction

**User Story:** As a developer, I want validation logic separated from UI components, so that validation rules are testable and reusable.

#### Acceptance Criteria

1. THE System SHALL extract all inline validation logic into a dedicated validation utility
2. WHEN validation is performed, THE System SHALL return structured error messages for each field
3. THE System SHALL validate required fields (courseId, title, locationName for offline lessons)
4. THE System SHALL validate numeric fields (durationMinutes, coordinates, geofenceRadius)
5. THE System SHALL validate that scheduledAt is not in the past
6. THE System SHALL provide clear, user-friendly error messages for each validation failure

### Requirement 3: Component Decomposition

**User Story:** As a developer, I want the create-lesson screen broken into smaller components, so that each component has a single responsibility and is easier to understand.

#### Acceptance Criteria

1. THE System SHALL extract form input fields into reusable components
2. THE System SHALL create a FormInput component for text input fields
3. THE System SHALL create a FormTextArea component for multiline text input
4. THE System SHALL create a FormDateTimePicker component for date and time selection
5. THE System SHALL create a FormSegmentedControl component for delivery type selection
6. THE System SHALL create a CourseSelector component for course selection
7. THE System SHALL create a LocationInput component for location-related fields
8. WHEN components are extracted, THE System SHALL maintain all existing styling and behavior

### Requirement 4: Type Safety Enhancement

**User Story:** As a developer, I want comprehensive TypeScript types for all form data, so that type errors are caught at compile time.

#### Acceptance Criteria

1. THE System SHALL define a FormData interface that represents all form fields
2. THE System SHALL define a ValidationErrors interface that represents validation error states
3. THE System SHALL define proper types for the DeliveryType enum
4. THE System SHALL ensure all form state operations are type-safe
5. THE System SHALL ensure all validation functions have proper type signatures

### Requirement 5: Error Handling Improvement

**User Story:** As a user, I want clear feedback when form submission fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN validation fails, THE System SHALL display field-specific error messages below each invalid field
2. WHEN API submission fails, THE System SHALL display a user-friendly error message
3. WHEN network errors occur, THE System SHALL distinguish network errors from validation errors
4. THE System SHALL maintain error state for each form field independently
5. WHEN a field with an error is corrected, THE System SHALL clear that field's error message

### Requirement 6: Accessibility Enhancement

**User Story:** As a user with accessibility needs, I want proper labels and hints on form fields, so that I can use screen readers effectively.

#### Acceptance Criteria

1. THE System SHALL provide accessible labels for all form input fields
2. THE System SHALL provide accessibility hints that describe the purpose of each field
3. THE System SHALL ensure error messages are announced to screen readers
4. THE System SHALL maintain proper focus management for keyboard navigation
5. THE System SHALL ensure all interactive elements have minimum touch target sizes (44x44 points)

### Requirement 7: Code Organization and Maintainability

**User Story:** As a developer, I want clear separation between UI, business logic, and data access, so that the codebase is maintainable and testable.

#### Acceptance Criteria

1. THE System SHALL separate form state management into a custom hook
2. THE System SHALL separate validation logic into utility functions
3. THE System SHALL separate reusable UI components into individual files
4. THE System SHALL maintain a clear file structure with components in appropriate directories
5. THE System SHALL ensure no business logic is embedded in UI components

### Requirement 8: Functional Preservation

**User Story:** As a user, I want the refactored screen to work identically to the current implementation, so that my workflow is not disrupted.

#### Acceptance Criteria

1. THE System SHALL preserve all existing form fields and their behavior
2. THE System SHALL preserve the course selection interface with visual feedback
3. THE System SHALL preserve date and time picker functionality
4. THE System SHALL preserve delivery type toggle between ONLINE and OFFLINE
5. THE System SHALL preserve conditional rendering of location coordinates for OFFLINE lessons
6. THE System SHALL preserve the fixed footer with create button
7. THE System SHALL preserve loading states during form submission
8. THE System SHALL preserve success and error alert dialogs
9. THE System SHALL preserve navigation behavior (back button and post-creation navigation)
10. THE System SHALL preserve all styling, colors, and visual design

### Requirement 9: Performance Optimization

**User Story:** As a user, I want the form to respond quickly to my input, so that the interface feels smooth and responsive.

#### Acceptance Criteria

1. THE System SHALL prevent unnecessary re-renders of form components
2. THE System SHALL use React.memo for components that don't need frequent updates
3. THE System SHALL debounce validation for text input fields
4. THE System SHALL optimize date/time picker rendering
5. THE System SHALL ensure form submission is not blocked by validation overhead

### Requirement 10: Testing Infrastructure

**User Story:** As a developer, I want the refactored code to be testable, so that I can verify correctness and prevent regressions.

#### Acceptance Criteria

1. THE System SHALL structure validation logic to be unit testable
2. THE System SHALL structure form state management to be testable in isolation
3. THE System SHALL ensure reusable components can be tested independently
4. THE System SHALL provide clear interfaces for mocking dependencies in tests
5. THE System SHALL ensure all validation rules can be verified through automated tests
