import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const ONBOARDING_KEY = '@onboarding_completed';
const ONBOARDING_STEP_KEY = '@onboarding_current_step';

// Types
export type OnboardingStep = 1 | 2 | 3 | 'completed';

// Check if onboarding is completed
export const isOnboardingCompleted = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        return value === 'true';
    } catch (error) {
        console.error('Error checking onboarding status:', error);
        return false;
    }
};

// Get current onboarding step
export const getCurrentOnboardingStep = async (): Promise<OnboardingStep> => {
    try {
        const step = await AsyncStorage.getItem(ONBOARDING_STEP_KEY);
        if (step === 'true') return 'completed';
        if (step === '1' || step === '2' || step === '3') return parseInt(step) as OnboardingStep;
        return 1; // Default to first step if not set
    } catch (error) {
        console.error('Error getting onboarding step:', error);
        return 1;
    }
};

// Set current onboarding step
export const setOnboardingStep = async (step: OnboardingStep): Promise<void> => {
    try {
        if (step === 'completed') {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'true');
        } else {
            await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step.toString());
        }
    } catch (error) {
        console.error('Error setting onboarding step:', error);
    }
};

// Mark onboarding as completed
export const completeOnboarding = async (): Promise<void> => {
    try {
        await setOnboardingStep('completed');
    } catch (error) {
        console.error('Error completing onboarding:', error);
    }
};

// Reset onboarding (for testing purposes)
export const resetOnboarding = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        await AsyncStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch (error) {
        console.error('Error resetting onboarding:', error);
    }
};
