export default {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    search: 'Search',
    retry: 'Retry',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    close: 'Close',
    submit: 'Submit',
    continue: 'Continue',
    skip: 'Skip',
  },

  // Auth
  auth: {
    // Login screen
    welcomeBack: 'WELCOME BACK',
    welcomeSubtitle: 'Sign in to access your account and continue your journey with us.',
    continueWithGoogle: 'Continue With Google',
    signUp: 'Sign Up',
    logIn: 'Log In',
    login: 'Login',
    logout: 'Logout',
    
    // Sign In screen
    signIn: 'Sign In',
    emailUsername: 'Email / Username',
    emailPlaceholder: 'smantha@mail.com',
    password: 'Password',
    passwordPlaceholder: '* * * *',
    forgotPassword: 'Forgot password ?',
    dontHaveAccount: "Don't have an account?",
    or: 'Or',
    
    // Sign Up screen
    createAccount: 'Create Account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    username: 'Username',
    usernamePlaceholder: 'Choose a unique username',
    email: 'Email',
    emailInputPlaceholder: 'Enter your email address',
    createPassword: 'Create a password',
    alreadyHaveAccount: 'Already have an account?',
    usernameAvailable: 'Username is available!',
    suggestions: 'Suggestions:',
    
    // Forgot Password
    forgotPasswordTitle: 'Forgot Password',
    forgotPasswordSubtitle: 'Enter your email address We will send an OTP code for verification in the next step.',
    continue: 'Continue',
    
    // Verification
    verifyOTP: 'Verify OTP Code',
    verifyOTPSubtitle: 'Please enter the security code sent to your email to reset your password.',
    resendCode: 'Resend Code',
    resendIn: 'Resend in {{seconds}}s',
    
    // Reset Password
    resetPassword: 'Reset Password',
    resetPasswordSubtitle: 'Create a new password for your account.',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    confirm: 'Confirm',
    
    // Reset Success
    resetSuccessTitle: 'Reset Password Successful!',
    resetSuccessSubtitle: 'Your password has been successfully changed.',
    goToLogin: 'Go To Log in',
    
    // Device Verification
    newDeviceDetected: 'New Device Detected',
    deviceVerificationTitle: 'Verify Your Device',
    deviceVerificationSubtitle: 'We noticed you\'re logging in from a new device. Please enter the verification code sent to your email.',
    verifyDevice: 'Verify Device',
    
    // 2FA
    twoFactorTitle: 'Two-Factor Authentication',
    twoFactorSubtitle: 'Enter the 6-digit code from your authenticator app.',
    backupCodeTitle: 'Use Backup Code',
    backupCodeSubtitle: 'Enter one of your 8-character backup codes.',
    verify: 'Verify',
    useBackupCode: 'Use backup code instead',
    useAuthenticator: 'Use authenticator app instead',
    
    // Reactivate Account
    welcomeBackTitle: 'Welcome Back!',
    accountDeactivated: 'Your account was deactivated',
    reactivateSubtitle: 'We\'re glad to see you again. Your account is ready to be reactivated.',
    reactivateAccount: 'Reactivate Account',
    goBack: 'Go Back',
    dataPreserved: 'Your Data is Preserved',
    dataPreservedDesc: 'All your progress, settings, and information are safe',
    instantAccess: 'Instant Access',
    instantAccessDesc: 'Get back to your account immediately',
    
    // Validation messages
    emailRequired: 'Email and password are required',
    invalidCode: 'Please enter the full 6-digit code',
    missingEmail: 'Missing email address',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    fillAllFields: 'Please fill in all fields',
    fixUsernameErrors: 'Please fix username errors',
  },

  // Settings
  settings: {
    title: 'Settings',
    security: 'Security',
    twoFactorAuth: 'Two-Factor Authentication',
    twoFactorAuthSubtitle: 'Add extra security to your account',
    activeSessions: 'Active Sessions',
    activeSessionsSubtitle: 'Manage your logged-in devices',
    activity: 'Activity',
    activityLog: 'Activity Log',
    activityLogSubtitle: 'View your recent account activity',
    family: 'Family',
    myChildren: 'My Children',
    parentLink: 'Parent Link',
    viewManageChildren: 'View and manage linked children',
    linkWithParent: 'Link with your parent',
    preferences: 'Preferences',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
    notificationsSubtitle: 'Receive push notifications',
    newsletter: 'Newsletter',
    newsletterSubtitle: 'Receive email updates',
    dangerZone: 'Danger Zone',
    accountManagement: 'Account Management',
    accountManagementSubtitle: 'Deactivate or delete account',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
  },

  // Profile
  profile: {
    title: 'Profile',
    editProfile: 'Edit Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone Number',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    preferNotToSay: 'Prefer not to say',
  },

  // Location
  location: {
    title: 'Location',
    currentLocation: 'Current Location',
    locationHistory: 'Location History',
    shareLocation: 'Share Location',
    lastUpdated: 'Last updated',
    noLocationData: 'No location data available',
  },

  // Onboarding
  onboarding: {
    welcome: 'Welcome',
    getStarted: 'Get Started',
    letsGo: "Let's Go",
  },

  // Errors
  errors: {
    somethingWentWrong: 'Something went wrong',
    networkError: 'Network error. Please check your connection.',
    sessionExpired: 'Session expired. Please login again.',
    invalidCredentials: 'Invalid email or password',
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsDoNotMatch: 'Passwords do not match',
  },

  // Time
  time: {
    justNow: 'Just now',
    minutesAgo: '{{count}}m ago',
    hoursAgo: '{{count}}h ago',
    daysAgo: '{{count}}d ago',
  },
};
