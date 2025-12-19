import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    email: z.string().email(),
    verified: z.boolean().default(false),
    onboardingCompleted: z.boolean().default(false),
    profileImg: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
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
        language: z.string().default('en'),
        themePreference: z.enum(['light', 'dark']).default('light'),
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
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: z.infer<typeof RegisterRequestSchema>['password'];
}

export interface ResetPasswordResponse {
    message: string;
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

