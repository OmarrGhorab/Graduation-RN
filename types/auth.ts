import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    email: z.string().email(),
    verified: z.coerce.boolean().default(false),
    onboardingCompleted: z.coerce.boolean().default(false),
    profileImg: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    goals: z.array(z.string()).optional(),
    interests: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })).optional(),
    hasPassword: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginResponseSchema = z.object({
    user: UserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
    requiresOnboarding: z.boolean().optional(),
    message: z.string().optional(),
    requiresDeviceVerification: z.boolean().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegisterResponseSchema = z.object({
    user: UserSchema.optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    suggestions: z.array(z.string()).optional(),
    otp: z.string().optional(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

export const RegisterRequestSchema = z.object({
    name: z.string(),
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(6), // User's requirement might vary, 6 is common
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const ProfileCompletionBodySchema = z.object({
    dateOfBirth: z.string(), // accepting string for ISO date
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    country: z.string(),
    role: z.enum(['STUDENT', 'TEACHER', 'PARENT']),
    profileImg: z.string().optional(),
    bio: z.string().max(500).optional(),
    goals: z.array(z.string()).min(1),
    newsletterEnabled: z.boolean(),
    preferences: z.object({
        language: z.enum(['system', 'en', 'ar']).default('system'),
        themePreference: z.enum(['system', 'light', 'dark']).default('system'),
        notifications: z.boolean().default(true),
    }),
    interests: z.array(z.string()).min(1),
    parentIds: z.array(z.string()).optional(),
});

export type ProfileCompletionBody = z.infer<typeof ProfileCompletionBodySchema>;

// New types from AuthService refactor
export const LoginRequestSchema = z.object({
    emailOrUsername: z.string(),
    password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export type LoginSuccessResponse = LoginResponse;
export interface LoginErrorResponse {
    requiresVerification: boolean;
    message?: string;
    error?: string;
}

export interface VerifyEmailOTPRequest {
    email: string;
    otp: string;
}

export interface VerifyEmailOTPResponse {
    message: string;
    user?: User;
}

export interface ForgotPasswordRequest {
    emailOrUsername: string;
}

export interface ForgotPasswordResponse {
    message: string;
    otp?: string; // Only in dev mode
}

export interface ResetPasswordRequest {
    emailOrUsername: string;
    otp: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface VerifyResetOTPRequest {
    emailOrUsername: string;
    otp: string;
}

export interface VerifyResetOTPResponse {
    message: string;
    valid: boolean;
}

export type OnboardingData = ProfileCompletionBody;

export interface OnboardingResponse {
    success: boolean;
    message?: string;
    user?: User;
}

export interface ParentSearchResponse {
    success: boolean;
    data: any[]; // Adjust based on actual parent data structure if known
}

export interface ParentLinkRequest {
    parentId: string;
}

export interface ParentLinkResponse {
    success: boolean;
    message: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

// Device Verification Types
export interface DeviceVerificationRequired {
    error: string;
    message: string;
    deviceBlocked: true;
    requiresDeviceVerification: true;
    deviceFingerprint: string;
    otp?: string; // Only in development mode
}

export interface DeviceVerifyRequest {
    emailOrUsername: string;
    deviceFingerprint: string;
    otp: string;
}

export interface DeviceVerifyResponse {
    message: string;
    deviceVerified: boolean;
    requires2FA?: boolean;
    emailOrUsername?: string;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    requiresOnboarding?: boolean;
}

export interface ResendDeviceVerificationOTPRequest {
    emailOrUsername: string;
    deviceFingerprint: string;
}

export interface ResendDeviceVerificationOTPResponse {
    message: string;
    otp?: string; // Only in development mode
}

// Account Reactivation Types
export interface AccountDeactivatedResponse {
    error: string;
    message: string;
    accountDeactivated: true;
    requiresReactivation: true;
    tempToken: string;
}

export interface ConfirmReactivationResponse {
    message: string;
    accountReactivated: true;
    user: User;
    accessToken: string;
    refreshToken: string;
    requiresOnboarding: boolean;
}

