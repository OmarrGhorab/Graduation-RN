export default {
  // Common
  common: {
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    back: 'رجوع',
    next: 'التالي',
    done: 'تم',
    search: 'بحث',
    retry: 'إعادة المحاولة',
    yes: 'نعم',
    no: 'لا',
    ok: 'حسناً',
    close: 'إغلاق',
    submit: 'إرسال',
    continue: 'متابعة',
    skip: 'تخطي',
  },

  // Auth
  auth: {
    // Login screen
    welcomeBack: 'مرحباً بعودتك',
    welcomeSubtitle: 'سجل دخولك للوصول إلى حسابك ومتابعة رحلتك معنا.',
    continueWithGoogle: 'المتابعة مع جوجل',
    signUp: 'إنشاء حساب',
    logIn: 'تسجيل الدخول',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    
    // Sign In screen
    signIn: 'تسجيل الدخول',
    emailUsername: 'البريد الإلكتروني / اسم المستخدم',
    emailPlaceholder: 'smantha@mail.com',
    password: 'كلمة المرور',
    passwordPlaceholder: '* * * *',
    forgotPassword: 'نسيت كلمة المرور؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    or: 'أو',
    
    // Sign Up screen
    createAccount: 'إنشاء حساب',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'أدخل اسمك الكامل',
    username: 'اسم المستخدم',
    usernamePlaceholder: 'اختر اسم مستخدم فريد',
    email: 'البريد الإلكتروني',
    emailInputPlaceholder: 'أدخل بريدك الإلكتروني',
    createPassword: 'أنشئ كلمة مرور',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    usernameAvailable: 'اسم المستخدم متاح!',
    suggestions: 'اقتراحات:',
    
    // Forgot Password
    forgotPasswordTitle: 'نسيت كلمة المرور',
    forgotPasswordSubtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق في الخطوة التالية.',
    continue: 'متابعة',
    
    // Verification
    verifyOTP: 'التحقق من الرمز',
    verifyOTPSubtitle: 'يرجى إدخال رمز الأمان المرسل إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور.',
    resendCode: 'إعادة إرسال الرمز',
    resendIn: 'إعادة الإرسال خلال {{seconds}} ثانية',
    
    // Reset Password
    resetPassword: 'إعادة تعيين كلمة المرور',
    resetPasswordSubtitle: 'أنشئ كلمة مرور جديدة لحسابك.',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'أكد كلمة المرور',
    confirm: 'تأكيد',
    
    // Reset Success
    resetSuccessTitle: 'تم إعادة تعيين كلمة المرور بنجاح!',
    resetSuccessSubtitle: 'تم تغيير كلمة المرور الخاصة بك بنجاح.',
    goToLogin: 'الذهاب لتسجيل الدخول',
    
    // Device Verification
    newDeviceDetected: 'تم اكتشاف جهاز جديد',
    deviceVerificationTitle: 'تحقق من جهازك',
    deviceVerificationSubtitle: 'لاحظنا أنك تسجل الدخول من جهاز جديد. يرجى إدخال رمز التحقق المرسل إلى بريدك الإلكتروني.',
    verifyDevice: 'تحقق من الجهاز',
    
    // 2FA
    twoFactorTitle: 'المصادقة الثنائية',
    twoFactorSubtitle: 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة.',
    backupCodeTitle: 'استخدام رمز احتياطي',
    backupCodeSubtitle: 'أدخل أحد رموزك الاحتياطية المكونة من 8 أحرف.',
    verify: 'تحقق',
    useBackupCode: 'استخدم رمز احتياطي بدلاً من ذلك',
    useAuthenticator: 'استخدم تطبيق المصادقة بدلاً من ذلك',
    
    // Reactivate Account
    welcomeBackTitle: 'مرحباً بعودتك!',
    accountDeactivated: 'تم تعطيل حسابك',
    reactivateSubtitle: 'يسعدنا رؤيتك مرة أخرى. حسابك جاهز لإعادة التفعيل.',
    reactivateAccount: 'إعادة تفعيل الحساب',
    goBack: 'العودة',
    dataPreserved: 'بياناتك محفوظة',
    dataPreservedDesc: 'جميع تقدمك وإعداداتك ومعلوماتك آمنة',
    instantAccess: 'وصول فوري',
    instantAccessDesc: 'عد إلى حسابك فوراً',
    
    // Validation messages
    emailRequired: 'البريد الإلكتروني وكلمة المرور مطلوبان',
    invalidCode: 'يرجى إدخال الرمز المكون من 6 أرقام كاملاً',
    missingEmail: 'البريد الإلكتروني مفقود',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordTooShort: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
    fillAllFields: 'يرجى ملء جميع الحقول',
    fixUsernameErrors: 'يرجى إصلاح أخطاء اسم المستخدم',
  },

  // Settings
  settings: {
    title: 'الإعدادات',
    security: 'الأمان',
    twoFactorAuth: 'المصادقة الثنائية',
    twoFactorAuthSubtitle: 'أضف حماية إضافية لحسابك',
    activeSessions: 'الجلسات النشطة',
    activeSessionsSubtitle: 'إدارة الأجهزة المسجلة',
    activity: 'النشاط',
    activityLog: 'سجل النشاط',
    activityLogSubtitle: 'عرض نشاط حسابك الأخير',
    family: 'العائلة',
    myChildren: 'أطفالي',
    parentLink: 'ربط الوالدين',
    viewManageChildren: 'عرض وإدارة الأطفال المرتبطين',
    linkWithParent: 'الربط مع والديك',
    preferences: 'التفضيلات',
    theme: 'المظهر',
    language: 'اللغة',
    notifications: 'الإشعارات',
    notificationsSubtitle: 'استلام الإشعارات الفورية',
    newsletter: 'النشرة الإخبارية',
    newsletterSubtitle: 'استلام التحديثات عبر البريد',
    dangerZone: 'منطقة الخطر',
    accountManagement: 'إدارة الحساب',
    accountManagementSubtitle: 'تعطيل أو حذف الحساب',
    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeSystem: 'النظام',
  },

  // Profile
  profile: {
    title: 'الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    phone: 'رقم الهاتف',
    dateOfBirth: 'تاريخ الميلاد',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    other: 'آخر',
    preferNotToSay: 'أفضل عدم الإفصاح',
  },

  // Location
  location: {
    title: 'الموقع',
    currentLocation: 'الموقع الحالي',
    locationHistory: 'سجل المواقع',
    shareLocation: 'مشاركة الموقع',
    lastUpdated: 'آخر تحديث',
    noLocationData: 'لا توجد بيانات موقع',
  },

  // Onboarding
  onboarding: {
    welcome: 'مرحباً',
    getStarted: 'ابدأ الآن',
    letsGo: 'هيا بنا',
  },

  // Errors
  errors: {
    somethingWentWrong: 'حدث خطأ ما',
    networkError: 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
    sessionExpired: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    requiredField: 'هذا الحقل مطلوب',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
    passwordTooShort: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة',
  },

  // Time
  time: {
    justNow: 'الآن',
    minutesAgo: 'منذ {{count}} دقيقة',
    hoursAgo: 'منذ {{count}} ساعة',
    daysAgo: 'منذ {{count}} يوم',
  },
};
