import { create } from 'zustand';
import { ProfileCompletionBody } from '@/types/auth';

interface OnboardingFormState {
    formData: Partial<ProfileCompletionBody>;
    setStep1Data: (data: {
        dateOfBirth: string;
        gender: 'MALE' | 'FEMALE' | 'OTHER';
        country: string;
        profileImg?: string;
        preferences: {
            language: 'system' | 'en' | 'ar';
            themePreference: 'system' | 'light' | 'dark';
            notifications: boolean;
        };
    }) => void;
    setStep2Data: (data: {
        role: 'STUDENT' | 'TEACHER' | 'PARENT';
        interests: string[];
        bio?: string;
    }) => void;
    setStep3Data: (data: {
        goals: string[];
        parentIds?: string[];
        newsletterEnabled: boolean;
    }) => void;
    resetForm: () => void;
}

export const useOnboardingStore = create<OnboardingFormState>((set) => ({
    formData: {
        // Don't set default preferences - let step1 detect system settings
        newsletterEnabled: false,
        goals: [],
        interests: [],
    },
    setStep1Data: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    setStep2Data: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    setStep3Data: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    resetForm: () => set({
        formData: {
            // Don't set default preferences - let step1 detect system settings
            newsletterEnabled: false,
            goals: [],
            interests: [],
        }
    }),
}));
