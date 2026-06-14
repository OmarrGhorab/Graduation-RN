import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileCompletionBody } from '@/types/auth';

interface OnboardingFormState {
    formData: Partial<Omit<ProfileCompletionBody, 'preferences'>> & {
        preferences?: Partial<ProfileCompletionBody['preferences']>;
    };
    setStep1Data: (data: {
        dateOfBirth?: string;
        gender?: 'MALE' | 'FEMALE' | 'OTHER';
        country?: string;
        profileImg?: string;
        preferences?: Partial<ProfileCompletionBody['preferences']>;
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

export const useOnboardingStore = create<OnboardingFormState>()(
    persist(
        (set) => ({
            formData: {
                // Don't set default preferences - let step1 detect system settings
                newsletterEnabled: false,
                goals: [],
                interests: [],
            },
            setStep1Data: (data) => set((state) => ({
                formData: {
                    ...state.formData,
                    ...data,
                    preferences: data.preferences || state.formData.preferences
                        ? {
                            ...state.formData.preferences,
                            ...data.preferences
                        }
                        : undefined
                }
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
        }),
        {
            name: 'onboarding-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
