/**
 * Toast Component
 * 
 * This file re-exports the modular Toast component for backward compatibility.
 * The component has been refactored into smaller, maintainable pieces with dark mode support.
 * 
 * Structure:
 * - toast-components/index.ts - Main exports
 * - toast-components/ToastProvider.tsx - Context provider and useToast hook
 * - toast-components/ToastItem.tsx - Individual toast item component
 * - toast-components/useToastStyles.ts - Theme-aware styles hook
 * - toast-components/types.ts - TypeScript interfaces
 */

export { ToastProvider, useToast } from './toast-components';
export type { Toast, ToastType, ToastContextType } from './toast-components';
