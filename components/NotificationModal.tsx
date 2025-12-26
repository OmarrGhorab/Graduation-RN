/**
 * NotificationModal
 * 
 * This file re-exports the modular NotificationModal component for backward compatibility.
 * The component has been refactored into smaller, maintainable pieces with dark mode support.
 * 
 * Structure:
 * - NotificationModal/index.tsx - Main modal component
 * - NotificationModal/NotificationItem.tsx - Individual notification item
 * - NotificationModal/useNotificationStyles.ts - Theme-aware styles hook
 * - NotificationModal/types.ts - TypeScript interfaces
 * - NotificationModal/utils.ts - Helper functions
 */

export { default } from './NotificationModal/index';
export type { NotificationModalProps } from './NotificationModal/types';
