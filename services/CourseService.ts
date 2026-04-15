import { BASE_URL } from '@/constants/config';
import { logger } from '@/libs/logger';
import { getValidAccessToken } from './AuthService';
import { apiClient } from './apiClient';
import { DeviceService } from './DeviceService';

export interface ApiCourse {
    id: string;
    title: string;
    description: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
    teacherName: string;
    teacherProfileImg?: string;
    teacherRating?: number;
    courseImage?: string;
    courseRating?: number;
    totalRatings?: number;
    enrolledStudents?: number;
    deliveryType: 'OFFLINE' | 'ONLINE';
    locationName: string;
    locationLat?: number;
    locationLng?: number;
    geofenceRadiusM: number;
    totalLessons: number;
    attendanceWindowMinutes: number;
    price: number;
    currency: string;
    isPaid: boolean;
    billingType: 'ONE_TIME' | 'MONTHLY';
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PAUSED';
    attendanceWeight: number;
    previewVideoUrl?: string;
    previewVideoPublicId?: string;
    preview_video_url?: string;
    preview_video_public_id?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CourseMeta {
    total: number;
    limit: number;
    page: number;
}

export interface CoursesResponse {
     data: ApiCourse[];
     meta?: {
         total: number;
         page: number;
         limit: number;
         totalPages?: number;
     };
     success: boolean;
}

export interface RecommendationCourseItem {
    courseId: string;
    score: number;
    title: string;
    courseImage?: string;
    price: number;
    currency: string;
    enrolledCount: number;
    subjectName: string;
    teacher: {
        name: string;
        avatar?: string;
    };
    matchReason?: string;
    priority?: string;
}

export interface RecommendationCoursesResponse {
    success: boolean;
    data: RecommendationCourseItem[];
}

export interface ApiSubject {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface CourseReview {
    id: string;
    studentId: string;
    studentName: string;
    studentUsername: string;
    studentProfile?: string;
    rating: number;
    review: string;
    createdAt: string;
    updatedAt: string;
}

export interface RatingBreakdown {
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStar: number;
}

export interface CourseReviewsResponse {
    success: boolean;
    data: {
        courseId: string;
        courseTitle: string;
        averageRating: number;
        totalRatings: number;
        ratingBreakdown: RatingBreakdown;
        reviews: CourseReview[];
        pagination: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
        };
    };
}

export interface CreateReviewRequest {
    rating: number;
    Review: string;
}

export interface CreateReviewResponse {
    success: boolean;
    data: CourseReview;
}

export interface SubjectsResponse {
    data: ApiSubject[];
    success: boolean;
}

export interface ApiCourseDetails {
    course: {
        id: string;
        title: string;
        description: string;
        subjectId: string;
        subjectName: string;
        deliveryType: 'OFFLINE' | 'ONLINE';
        locationName: string;
        totalLessons: number;
        attendanceWindowMinutes: number;
        price: number;
        currency: string;
        isPaid: boolean;
        billingType: 'ONE_TIME' | 'MONTHLY';
        status: 'ACTIVE' | 'INACTIVE';
        attendanceWeight: number;
        locationLat?: number;
        locationLng?: number;
        geofenceRadiusM?: number;
        enrollmentCount?: number;
        assistants?: CourseAssistant[];
        freeTrialLessons?: number;
        courseRating?: number;
        totalReviews?: number;
        courseImage?: string;
        previewVideoUrl?: string;
        previewVideoPublicId?: string;
        preview_video_url?: string;
        preview_video_public_id?: string;
    };
    progress?: {
        attendancePercentage: number;
        classesAttended: number;
        totalClasses: number;
        overallGrade: number;
        status: string;
        targetPercentage: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        excusedCount: number;
        lastUpdated: string;
    } | null;
    teacher: {
        id: string;
        name: string;
        profileImg: string | null;
    };
    lessons: {
        id: string;
        title: string;
        description: string;
        lessonNumber: number;
        status: 'COMPLETED' | 'LIVE' | 'SCHEDULED' | 'CANCELED';
        scheduledAt: string;
        startsAt: string;
        endsAt: string;
        durationMinutes: number;
        locationName: string;
        locationLat?: number;
        locationLng?: number;
        canMarkAttendance: boolean;
        attendanceStatus?: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | null;
        absenceRequestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
        attendeeCount?: number;
        deliveryType?: 'ONLINE' | 'OFFLINE';
        isFree?: boolean;
        videoUrl?: string;
        videoPublicId?: string;
        materialsUrl?: string;
        duration?: number;
    }[];
    enrollment?: {
        id: string;
        courseId: string;
        userId: string;
        isActive: boolean;
        isPaid: boolean;
        enrolledAt: string;
    } | null;
}

export interface CourseDetailsResponse {
    data: ApiCourseDetails;
    success: boolean;
}

// Subject Details with Courses
export interface ApiSubjectCourse {
    id: string;
    title: string;
    description: string;
    teacherId: string;
    teacherName: string;
    teacherProfileImg: string | null;
    deliveryType: 'OFFLINE' | 'ONLINE';
    locationName: string;
    totalLessons: number;
    price: number;
    currency: string;
    isPaid: boolean;
    billingType: 'ONE_TIME' | 'MONTHLY';
    status: 'ACTIVE' | 'INACTIVE';
    progress?: {
        attendancePercentage: number;
        classesAttended: number;
        totalClasses: number;
        overallGrade: number;
        status: string;
        targetPercentage: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        excusedCount: number;
        lastUpdated: string;
    };
}

export interface ApiSubjectDetails {
    subject: {
        id: string;
        name: string;
        description: string;
        icon: string;
        totalCourses: number;
    };
    courses: ApiSubjectCourse[];
}

export interface SubjectDetailsResponse {
    data: ApiSubjectDetails;
    success: boolean;
}

/**
 * Fetch courses for the current student
 */
export async function getMyCourses(): Promise<CoursesResponse> {
    logger.log('[Courses] Fetching my courses');
    return apiClient.get<CoursesResponse>('/api/v1/courses/my');
}

/**
 * Fetch subject categories for the student
 */
export async function getMySubjects(): Promise<SubjectsResponse> {
    logger.log('[Courses] Fetching my subjects');
    return apiClient.get<SubjectsResponse>('/api/v1/courses/my-subjects');
}

/**
 * Fetch all available courses with filters and pagination
 */
export async function getAllCourses(params?: {
    teacherId?: string;
    subjectId?: string;
    teacherName?: string;
    subjectName?: string;
    search?: string;
    deliveryType?: 'OFFLINE' | 'ONLINE';
    isPaid?: boolean;
    status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    billingType?: 'ONE_TIME' | 'MONTHLY';
    page?: number;
    limit?: number;
}): Promise<CoursesResponse> {
    logger.log('[Courses] Fetching all courses', params);
    return apiClient.get<CoursesResponse>('/api/v1/courses', { params });
}

export async function getTrendingCourses(): Promise<RecommendationCoursesResponse> {
    logger.log('[Courses] Fetching trending courses');
    return apiClient.get<RecommendationCoursesResponse>('/api/v1/recommendations/trending/');
}

export async function getRecommendedCourses(): Promise<RecommendationCoursesResponse> {
    logger.log('[Courses] Fetching recommended courses');
    return apiClient.get<RecommendationCoursesResponse>('/api/v1/recommendations/');
}

/**
 * Fetch detailed course information
 */
export async function getCourseDetails(courseId: string, studentId?: string): Promise<CourseDetailsResponse> {
    logger.log('[Courses] Fetching course details:', { courseId, studentId });
    return apiClient.get<CourseDetailsResponse>(`/api/v1/courses/${courseId}/details`, {
        params: { studentId }
    });
}

/**
 * Fetch subject details with courses
 */
export async function getSubjectDetails(subjectId: string): Promise<SubjectDetailsResponse> {
    logger.log('[Courses] Fetching subject details:', { subjectId });
    return apiClient.get<SubjectDetailsResponse>(`/api/v1/courses/subjects/${subjectId}/details`);
}

/**
 * TEACHER ENDPOINTS
 */

export interface LessonQRResponse {
    success: boolean;
    data: {
        lesson_id: string;
        payload: string;
        signature: string;
        issued_at: string;
        expires_at: string;
    };
}

export interface LessonAttendanceResponse {
    success: boolean;
    data: {
        id: string;
        lessonId: string;
        studentId: string;
        studentName: string;
        studentProfileImg?: string;
        status: 'PRESENT' | 'LATE' | 'ABSENT';
        scannedAt: string | null;
        isManualOverride?: boolean;
        createdAt?: string;
        updatedAt?: string;
    }[];
}

export interface StudentAnalyticsResponse {
    success: boolean;
    data: {
        studentId: string;
        studentName: string;
        studentProfileImg?: string;
        courseId: string;
        courseName: string;
        attendanceRate: number;
        attendanceChange: number;
        completionRate: number;
        completedLessons: number;
        totalLessons: number;
        weeklyAttendance: {
            day: string;
            hours: number;
        }[];
        rank: number;
        totalStudents: number;
        points: number;
        recentActivity: {
            lessonId: string;
            lessonTitle: string;
            status: 'PRESENT' | 'LATE' | 'ABSENT';
            scheduledAt: string;
            scannedAt: string | null;
            durationMins: number;
        }[];
    };
}

export interface CreateLessonRequest {
    courseId: string;
    title: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    deliveryType: 'ONLINE' | 'OFFLINE';
    locationName: string;
    locationLat?: number;
    locationLng?: number;
    geofenceRadiusM: number;
}

export interface ApiLesson {
    id: string;
    courseId: string;
    title: string;
    description: string;
    lessonNumber: number;
    scheduledAt: string;
    durationMinutes: number;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELED';
    locationName: string;
    locationLat: number;
    locationLng: number;
    geofenceRadiusM: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLessonResponse {
    data: ApiLesson;
    success: boolean;
}

/**
 * Start a lesson (Teacher)
 */
export async function startLesson(lessonId: string, deviceId?: string, deviceFingerprint?: string): Promise<{ success: boolean; message: string; qr_token?: any }> {
    logger.log('[Lessons] Starting lesson:', lessonId);
    return apiClient.post<{ success: boolean; message: string; qr_token?: any }>(`/api/v1/lessons/${lessonId}/start`, {
        deviceId,
        deviceFingerprint
    });
}

/**
 * Get current QR token for a lesson (Teacher)
 */
export async function getLessonQR(lessonId: string): Promise<LessonQRResponse> {
    logger.log('[Lessons] Fetching QR for lesson:', lessonId);
    return apiClient.get<LessonQRResponse>(`/api/v1/lessons/${lessonId}/qr`);
}

/**
 * End a lesson (Teacher)
 */
export async function endLesson(lessonId: string): Promise<{ success: boolean; message: string }> {
    logger.log('[Lessons] Ending lesson:', lessonId);
    return apiClient.post<{ success: boolean; message: string }>(`/api/v1/lessons/${lessonId}/end`, {});
}

/**
 * Get attendance records for a lesson (Teacher)
 */
export async function getLessonAttendance(lessonId: string): Promise<LessonAttendanceResponse> {
    logger.log('[Lessons] Fetching attendance for lesson:', lessonId);
    return apiClient.get<LessonAttendanceResponse>(`/api/v1/attendance/lesson/${lessonId}`);
}

/**
 * Get student analytics for a course (Teacher)
 */
export async function getStudentAnalytics(studentId: string, courseId: string): Promise<StudentAnalyticsResponse> {
    logger.log('[Analytics] Fetching student analytics:', { studentId, courseId });
    return apiClient.get<StudentAnalyticsResponse>(`/api/v1/attendance/student/${studentId}/course/${courseId}/analytics`);
}

/**
 * Create a new lesson (Teacher)
 */
export async function createLesson(data: CreateLessonRequest): Promise<CreateLessonResponse> {
    console.log('[CourseService] Creating lesson with FULL data:');
    console.log('  courseId:', data.courseId);
    console.log('  title:', data.title);
    console.log('  description:', data.description);
    console.log('  scheduledAt:', data.scheduledAt);
    console.log('  durationMinutes:', data.durationMinutes);
    console.log('  deliveryType:', data.deliveryType);
    console.log('  locationName:', data.locationName);
    console.log('  locationLat:', data.locationLat);
    console.log('  locationLng:', data.locationLng);
    console.log('  geofenceRadiusM:', data.geofenceRadiusM);
    console.log('[CourseService] Full object:', data);
    
    logger.log('[Lessons] Creating new lesson:', data.title);
    
    try {
        const response = await apiClient.post<CreateLessonResponse>('/api/v1/lessons', data);
        console.log('[CourseService] Lesson created successfully:', response);
        return response;
    } catch (error: any) {
        console.error('[CourseService] Create lesson failed:', error);
        console.error('[CourseService] Error response:', error.response?.data);
        console.error('[CourseService] Error status:', error.response?.status);
        throw error;
    }
}

/**
 * Get detailed lesson information
 */
export async function getLessonDetails(lessonId: string): Promise<{ success: boolean; data: any }> {
    logger.log('[Lessons] Fetching lesson details:', lessonId);
    return apiClient.get<{ success: boolean; data: any }>(`/api/v1/lessons/${lessonId}`);
}

/**
 * Get all lessons for a specific course (Teacher)
 */
export interface CourseLessonsResponse {
    success: boolean;
    data: ApiLesson[];
}

export async function getCourseLessons(courseId: string): Promise<CourseLessonsResponse> {
    logger.log('[Lessons] Fetching lessons for course:', courseId);
    return apiClient.get<CourseLessonsResponse>(`/api/v1/courses/${courseId}/lessons`);
}

/**
 * Cancel a lesson (Teacher)
 */
export async function cancelLesson(lessonId: string): Promise<{ success: boolean; message: string }> {
    logger.log('[Lessons] Canceling lesson:', lessonId);
    return apiClient.post<{ success: boolean; message: string }>(`/api/v1/lessons/${lessonId}/cancel`);
}

/**
 * Reschedule a lesson (Teacher)
 */
export interface RescheduleLessonRequest {
    scheduledAt: string;
    durationMinutes?: number;
    locationName?: string;
    locationLat?: number;
    locationLng?: number;
}

export async function rescheduleLesson(
    lessonId: string,
    data: RescheduleLessonRequest
): Promise<{ success: boolean; message: string; data: ApiLesson }> {
    logger.log('[Lessons] Rescheduling lesson:', lessonId, data);
    return apiClient.post<{ success: boolean; message: string; data: ApiLesson }>(
        `/api/v1/lessons/${lessonId}/reschedule`,
        data
    );
}

/**
 * Update a lesson (Teacher)
 */
export interface UpdateLessonRequest {
    title?: string;
    description?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    locationName?: string;
    locationLat?: number;
    locationLng?: number;
    geofenceRadiusM?: number;
}

export async function updateLesson(
    lessonId: string,
    data: UpdateLessonRequest
): Promise<{ success: boolean; message: string; data: ApiLesson }> {
    logger.log('[Lessons] Updating lesson:', lessonId, data);
    return apiClient.patch<{ success: boolean; message: string; data: ApiLesson }>(
        `/api/v1/lessons/${lessonId}`,
        data
    );
}

/**
 * Force rotate QR token for a lesson (Teacher)
 */
export async function rotateQRToken(lessonId: string): Promise<LessonQRResponse> {
    logger.log('[Lessons] Rotating QR token for lesson:', lessonId);
    return apiClient.post<LessonQRResponse>(`/api/v1/lessons/${lessonId}/qr/rotate`);
}

/**
 * Check if a student attended a class
 */
export async function getStudentAttendance(studentId: string): Promise<{ success: boolean; data: any }> {
    logger.log('[Attendance] Checking student attendance:', studentId);
    return apiClient.get<{ success: boolean; data: any }>(`/api/v1/attendance/student/${studentId}`);
}

/**
 * Update a course (Teacher)
 */
export interface UpdateCourseRequest {
    title?: string;
    description?: string;
    deliveryType?: 'OFFLINE' | 'ONLINE';
    locationName?: string;
    locationLat?: number;
    locationLng?: number;
    geofenceRadiusM?: number;
    attendanceWindowMinutes?: number;
    price?: number;
    currency?: string;
    isPaid?: boolean;
    billingType?: 'ONE_TIME' | 'MONTHLY';
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PAUSED';
    attendanceWeight?: number;
}

export async function updateCourse(
    courseId: string,
    data: UpdateCourseRequest
): Promise<{ success: boolean; message: string; data: ApiCourse }> {
    logger.log('[Courses] Updating course:', courseId, data);
    return apiClient.patch<{ success: boolean; message: string; data: ApiCourse }>(
        `/api/v1/courses/${courseId}`,
        data
    );
}

/**
 * Create a new course (Teacher)
 */
export interface CreateCourseRequest {
    title: string;
    description: string;
    subjectId: string;
    courseImage?: string;
    previewVideoUrl?: string;
    previewVideoPublicId?: string;
    deliveryType: 'OFFLINE' | 'ONLINE';
    totalLessons: number;
    freeTrialLessons?: number;
    locationName?: string;
    locationLat?: number;
    locationLng?: number;
    geofenceRadiusM?: number;
    attendanceWindowMinutes?: number;
    price: number;
    currency: string;
    isPaid: boolean;
    billingType: 'ONE_TIME' | 'MONTHLY';
    attendanceWeight: number;
}

export async function createCourse(data: CreateCourseRequest): Promise<{ success: boolean; data: ApiCourse }> {
    logger.log('[Courses] Creating new course:', data.title);
    return apiClient.post<{ success: boolean; data: ApiCourse }>('/api/v1/courses', data);
}

/**
 * Get single course details (Teacher/Student)
 */
export async function getCourse(courseId: string): Promise<{ success: boolean; data: ApiCourse }> {
    logger.log('[Courses] Fetching course:', courseId);
    return apiClient.get<{ success: boolean; data: ApiCourse }>(`/api/v1/courses/${courseId}`);
}

/**
 * Enroll in a course (Student)
 */
export interface EnrollCourseRequest {
    studentId: string;
}

export interface EnrollmentResponse {
    success: boolean;
    data: {
        id: string;
        courseId: string;
        userId: string;
        isActive: boolean;
        isPaid: boolean;
        enrolledAt: string;
    };
}

export async function enrollInCourse(
    courseId: string,
    data: EnrollCourseRequest
): Promise<EnrollmentResponse> {
    logger.log('[Courses] Enrolling in course:', courseId, data);
    return apiClient.post<EnrollmentResponse>(`/api/v1/courses/${courseId}/enroll`, data);
}

/**
 * Get all subjects
 */
export interface Subject {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface SubjectsListResponse {
    success: boolean;
    data: Subject[];
}

export async function getAllSubjects(): Promise<SubjectsListResponse> {
    logger.log('[Courses] Fetching all subjects');
    return apiClient.get<SubjectsListResponse>('/api/v1/subjects');
}

/**
 * Mark attendance using QR code
 * OLD METHOD - Deprecated
 */
export async function markAttendance(qrCode: string): Promise<{ success: boolean; message: string }> {
    logger.log('[Courses] Marking attendance (Legacy)', { qrCode });
    return apiClient.post<{ success: boolean; message: string }>('/api/v1/attendance/mark', { qrCode });
}

/**
 * Correct request format for scanning attendance
 * Backend expects raw payload and signature, NOT decoded
 */
export interface ScanAttendanceRequest {
    qrPayload: string;           // Raw base64 payload from QR endpoint
    qrSignature: string;          // Raw signature from QR endpoint
    deviceId: string;             // Device identifier
    deviceFingerprint?: string;   // Optional device fingerprint
    attestationToken?: string;    // Optional device attestation
    latitude?: number;            // Optional for geofence validation (required for OFFLINE courses)
    longitude?: number;           // Optional for geofence validation (required for OFFLINE courses)
}

/**
 * Scan attendance with QR code
 * IMPORTANT: Sends raw payload and signature without decoding
 */
export async function scanAttendance(
    qrString: string,
    options?: {
        deviceId?: string;
        deviceFingerprint?: string;
        latitude?: number;
        longitude?: number;
    }
): Promise<{ success: boolean; message: string; data?: any }> {
    try {
        logger.log('[Courses] Processing QR Code for attendance');

        let qrData: any;
        try {
            qrData = JSON.parse(qrString);
        } catch (e) {
            // If not JSON, try generic legacy mark
            logger.warn('[Courses] QR is not JSON, falling back to legacy');
            return markAttendance(qrString);
        }

        // Check if it matches the expected structure
        if (!qrData.data || !qrData.data.payload || !qrData.data.signature) {
            logger.warn('[Courses] Invalid QR structure, falling back to legacy');
            return markAttendance(qrString);
        }

        const { payload, signature } = qrData.data;

        // Get device info
        const deviceInfo = await import('./DeviceService').then(m => m.DeviceService.getDeviceInfo());
        const deviceId = options?.deviceId || `${deviceInfo.platform}-${deviceInfo.deviceModel}`;
        const deviceFingerprint = options?.deviceFingerprint || deviceInfo.deviceName;

        // Build request with RAW payload and signature (DO NOT DECODE!)
        const requestBody: ScanAttendanceRequest = {
            qrPayload: payload,           // Send raw base64 string
            qrSignature: signature,        // Send raw signature
            deviceId,
            deviceFingerprint,
        };

        // Add location if provided
        if (options?.latitude !== undefined && options?.longitude !== undefined) {
            requestBody.latitude = options.latitude;
            requestBody.longitude = options.longitude;
        }

        logger.log('[Courses] Sending Scan Request with raw payload');
        return apiClient.post<{ success: boolean; message: string; data?: any }>(
            '/api/v1/attendance/scan',
            requestBody
        );

    } catch (error) {
        logger.error('[Courses] Scan attendance error:', error);
        throw error;
    }
}

/**
 * ABSENCE / EXCUSE ENDPOINTS
 */

export type AbsenceReasonType = 'PARENT_EXCUSE' | 'MEDICAL' | 'EMERGENCY';
export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateAbsenceRequest {
    lessonId: string;
    studentId: string;
    reasonType: AbsenceReasonType;
    reasonText: string;
    attachment?: string;
}

export interface ApiAbsenceRequest {
    id: string;
    lessonId: string;
    studentId: string;
    reasonType: AbsenceReasonType;
    reasonText: string;
    attachmentUrl?: string;
    requestedBy: string;
    requestedAt: string;
    status: AbsenceStatus;
    respondedBy?: string;
    respondedAt?: string;
    responseNote?: string;
    attendanceRecordId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AbsenceResponse {
    success: boolean;
    data: ApiAbsenceRequest;
}

export interface AbsencesListResponse {
    success: boolean;
    data: ApiAbsenceRequest[];
}

/**
 * Submit an absence excuse request
 */
export async function createAbsenceRequest(data: CreateAbsenceRequest): Promise<AbsenceResponse> {
    logger.log('[Absences] Creating absence request for lesson:', data.lessonId);
    return apiClient.post<AbsenceResponse>('/api/v1/absences', data);
}

/**
 * Get absence requests for a specific student
 */
export async function getStudentAbsenceRequests(studentId: string): Promise<AbsencesListResponse> {
    logger.log('[Absences] Fetching absence requests for student:', studentId);
    return apiClient.get<AbsencesListResponse>(`/api/v1/absences/student/${studentId}`);
}

/**
 * Get absence requests for a specific lesson (Teacher)
 */
export async function getLessonAbsenceRequests(lessonId: string): Promise<AbsencesListResponse> {
    logger.log('[Absences] Fetching absence requests for lesson:', lessonId);
    return apiClient.get<AbsencesListResponse>(`/api/v1/absences/lesson/${lessonId}`);
}

/**
 * Get pending absence requests for parent's children
 */
export async function getPendingParentAbsenceRequests(): Promise<AbsencesListResponse> {
    logger.log('[Absences] Fetching pending parent absence requests');
    return apiClient.get<AbsencesListResponse>('/api/v1/absences/pending-parent');
}

/**
 * Respond to an absence request (Approve/Reject)
 */
export async function respondToAbsenceRequest(
    requestId: string,
    data: { approve: boolean; responseNote?: string }
): Promise<AbsenceResponse> {
    logger.log('[Absences] Responding to absence request:', requestId, data.approve ? 'APPROVE' : 'REJECT');
    return apiClient.post<AbsenceResponse>(`/api/v1/absences/${requestId}/respond`, data);
}

/**
 * COURSE ASSISTANTS ENDPOINTS
 */

export interface CourseAssistant {
    id: string;
    assistantId: string;
    assistantName: string;
    assistantProfileImg: string;
    canStartLesson: boolean;
    canEndLesson: boolean;
    canViewAttendance: boolean;
    canEditAttendance: boolean;
    addedAt: string;
}

export interface AddAssistantRequest {
    assistantId: string;
}

export interface AssistantResponse {
    success: boolean;
    data: {
        id: string;
        courseId: string;
        assistantId: string;
        canStartLesson: boolean;
        canEndLesson: boolean;
        canViewAttendance: boolean;
        canEditAttendance: boolean;
        createdAt: string;
    };
}

export interface AssistantsListResponse {
    success: boolean;
    data: CourseAssistant[];
}

/**
 * Add an assistant to a course (Teacher only)
 */
export async function addCourseAssistant(
    courseId: string,
    data: AddAssistantRequest
): Promise<AssistantResponse> {
    logger.log('[Courses] Adding assistant to course:', courseId, data.assistantId);
    return apiClient.post<AssistantResponse>(`/api/v1/courses/${courseId}/assistants`, data);
}

/**
 * Get all assistants for a course (Teacher only)
 */
export async function getCourseAssistants(courseId: string): Promise<AssistantsListResponse> {
    logger.log('[Courses] Fetching assistants for course:', courseId);
    return apiClient.get<AssistantsListResponse>(`/api/v1/courses/${courseId}/assistants`);
}

/**
 * Remove an assistant from a course (Teacher only)
 */
export async function removeCourseAssistant(
    courseId: string,
    assistantId: string
): Promise<{ success: boolean; message: string }> {
    logger.log('[Courses] Removing assistant from course:', courseId, assistantId);
    return apiClient.delete<{ success: boolean; message: string }>(
        `/api/v1/courses/${courseId}/assistants/${assistantId}`
    );
}


/**
 * REVIEWS & RATINGS ENDPOINTS
 */

/**
 * LESSON MATERIALS ENDPOINTS
 */

export interface UploadVideoResponse {
    success: boolean;
    data: {
        id: string;
        url: string;
        publicId: string;
    };
    message: string;
    upload_info?: {
        size_mb: number;
        format: string;
    };
}

export interface UploadDocumentResponse {
    success: boolean;
    data: {
        id: string;
        url: string;
    };
    message: string;
}

export interface UpdateMaterialsRequest {
    videoUrl?: string;
    videoPublicId?: string;
    materialsUrl?: string;
    duration?: number;
}

/**
 * Upload video for lesson (backend upload to Cloudinary)
 */
export async function uploadLessonVideo(
    lessonId: string,
    videoFile: {
        uri: string;
        type: string;
        name: string;
    },
    onProgress?: (progress: number) => void
): Promise<UploadVideoResponse> {
    logger.log('[Lessons] Uploading video for lesson:', lessonId);
    
    const formData = new FormData();
    
    // Format file object correctly for React Native FormData
    formData.append('video', {
        uri: videoFile.uri,
        type: videoFile.type,
        name: videoFile.name,
    } as any);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });
        }
        
        xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });
        
        // Get auth token and setup request
        Promise.all([getValidAccessToken(), DeviceService.getDeviceHeaders()]).then(([token, deviceHeaders]) => {
            if (!token) {
                reject(new Error('No authentication token found'));
                return;
            }
            
            xhr.open('POST', `${BASE_URL}/api/v1/lessons/${lessonId}/upload-video`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            // Attach Device Headers (Passport)
            Object.entries(deviceHeaders).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value as string);
            });

            xhr.send(formData as any);
        }).catch(reject);
    });
}

/**
 * Upload document for lesson (backend upload to Cloudinary)
 */
export async function uploadLessonDocument(
    lessonId: string,
    documentFile: {
        uri: string;
        type: string;
        name: string;
    },
    onProgress?: (progress: number) => void
): Promise<UploadDocumentResponse> {
    logger.log('[Lessons] Uploading document for lesson:', lessonId);
    
    const formData = new FormData();
    
    // Format file object correctly for React Native FormData
    formData.append('document', {
        uri: documentFile.uri,
        type: documentFile.type,
        name: documentFile.name,
    } as any);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });
        }
        
        xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });
        
        // Get auth token and setup request
        Promise.all([getValidAccessToken(), DeviceService.getDeviceHeaders()]).then(([token, deviceHeaders]) => {
            if (!token) {
                reject(new Error('No authentication token found'));
                return;
            }
            
            xhr.open('POST', `${BASE_URL}/api/v1/lessons/${lessonId}/upload-document`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            // Attach Device Headers (Passport)
            Object.entries(deviceHeaders).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value as string);
            });

            xhr.send(formData as any);
        }).catch(reject);
    });
}

/**
 * Delete lesson video
 */
export async function deleteLessonVideo(lessonId: string): Promise<{ success: boolean; message: string }> {
    logger.log('[Lessons] Deleting video for lesson:', lessonId);
    return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/lessons/${lessonId}/video`);
}

/**
 * Update lesson materials (manual URLs)
 */
export async function updateLessonMaterials(
    lessonId: string,
    data: UpdateMaterialsRequest
): Promise<{ success: boolean; message: string; data: ApiLesson }> {
    logger.log('[Lessons] Updating materials for lesson:', lessonId);
    return apiClient.put<{ success: boolean; message: string; data: ApiLesson }>(
        `/api/v1/lessons/${lessonId}/materials`,
        data
    );
}

// ============================================================================
// COURSE ENROLLMENTS
// ============================================================================

export interface CourseEnrollment {
    id: string;
    studentId: string;
    courseId: string;
    enrolledAt: string;
    status: string;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePicture?: string;
    };
}

export interface CourseEnrollmentsResponse {
    success: boolean;
    data: CourseEnrollment[];
}

/**
 * Get all enrollments for a course (Teacher only)
 */
export async function getCourseEnrollments(courseId: string): Promise<CourseEnrollmentsResponse> {
    logger.log('[Courses] Fetching enrollments for course:', courseId);
    return apiClient.get<CourseEnrollmentsResponse>(`/api/v1/courses/${courseId}/enrollments`);
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface StudentProgress {
    studentId: string;
    courseId: string;
    attendanceRate: number;
    completionRate: number;
    status: 'GOOD_STANDING' | 'NEEDS_IMPROVEMENT' | 'AT_RISK';
    totalLessons: number;
    attendedLessons: number;
    lastUpdated: string;
}

export interface StudentProgressResponse {
    success: boolean;
    data: StudentProgress;
}

export interface CourseProgressResponse {
    success: boolean;
    data: StudentProgress[];
}

/**
 * Get student progress for a course
 */
export async function getStudentProgress(
    courseId: string,
    studentId: string
): Promise<StudentProgressResponse> {
    logger.log('[Progress] Fetching student progress:', { courseId, studentId });
    return apiClient.get<StudentProgressResponse>(`/api/v1/progress/student/${courseId}/${studentId}`);
}

/**
 * Get progress for all students in a course (Teacher only)
 */
export async function getCourseProgress(courseId: string): Promise<CourseProgressResponse> {
    logger.log('[Progress] Fetching course progress:', courseId);
    return apiClient.get<CourseProgressResponse>(`/api/v1/progress/course/${courseId}`);
}

/**
 * Recompute progress for a student in a course (Teacher only)
 */
export async function recomputeProgress(
    courseId: string,
    studentId: string
): Promise<StudentProgressResponse> {
    logger.log('[Progress] Recomputing progress:', { courseId, studentId });
    return apiClient.post<StudentProgressResponse>(`/api/v1/progress/recompute/${courseId}/${studentId}`, {});
}

// ============================================================================
// CALENDAR
// ============================================================================

export interface CalendarLesson {
    id: string;
    courseId: string;
    title: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    deliveryType: 'ONLINE' | 'OFFLINE';
    course: {
        id: string;
        title: string;
        courseImage?: string;
    };
}

export interface CalendarResponse {
    success: boolean;
    data: CalendarLesson[];
}

/**
 * Get student calendar (upcoming lessons)
 */
export async function getStudentCalendar(
    start?: string,
    end?: string
): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching student calendar:', { start, end });
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    
    return apiClient.get<CalendarResponse>('/api/v1/calendar/student', { params });
}

/**
 * Get teacher calendar (scheduled lessons)
 */
export async function getTeacherCalendar(
    start?: string,
    end?: string
): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching teacher calendar:', { start, end });
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    
    return apiClient.get<CalendarResponse>('/api/v1/calendar/teacher', { params });
}

// ============================================================================
// TEACHERS
// ============================================================================

export interface TopRatedTeacher {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    averageRating: number;
    totalRatings: number;
    totalCourses: number;
}

export interface TopRatedTeachersResponse {
    success: boolean;
    data: TopRatedTeacher[];
}

export interface TeacherRatingResponse {
    success: boolean;
    data: {
        teacherId: string;
        averageRating: number;
        totalRatings: number;
    };
}

/**
 * Get top rated teachers (Public)
 */
export async function getTopRatedTeachers(
    limit: number = 10,
    minRating: number = 4.0
): Promise<TopRatedTeachersResponse> {
    logger.log('[Teachers] Fetching top rated teachers:', { limit, minRating });
    return apiClient.get<TopRatedTeachersResponse>('/api/v1/teachers/top-rated', {
        params: { limit, minRating }
    });
}

/**
 * Get teacher rating (Public)
 */
export async function getTeacherRating(teacherId: string): Promise<TeacherRatingResponse> {
    logger.log('[Teachers] Fetching teacher rating:', teacherId);
    return apiClient.get<TeacherRatingResponse>(`/api/v1/teachers/${teacherId}/rating`);
}

/**
 * Upload thumbnail for course (Teacher)
 */
export async function uploadCourseImage(
    imageFile: {
        uri: string;
        type: string;
        name: string;
    },
    onProgress?: (progress: number) => void
): Promise<{ success: boolean; data: { url: string }; message: string }> {
    logger.log('[Courses] Uploading course thumbnail');
    
    const formData = new FormData();
    formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
    } as any);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });
        }
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)); }
                catch (e) { reject(new Error('Failed to parse response')); }
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        
        Promise.all([getValidAccessToken(), DeviceService.getDeviceHeaders()]).then(([token, deviceHeaders]) => {
            xhr.open('POST', `${BASE_URL}/api/v1/courses/upload-image`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            
            // Attach Device Headers (Passport)
            Object.entries(deviceHeaders).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value as string);
            });

            xhr.send(formData as any);
        }).catch(reject);
    });
}

/**
 * Upload preview video for course (Teacher)
 */
export async function uploadCoursePreviewVideo(
    videoFile: {
        uri: string;
        type: string;
        name: string;
    },
    onProgress?: (progress: number) => void
): Promise<{ success: boolean; data: { url: string; publicId: string }; message: string }> {
    logger.log('[Courses] Uploading course preview video');
    
    const formData = new FormData();
    formData.append('video', {
        uri: videoFile.uri,
        type: videoFile.type,
        name: videoFile.name,
    } as any);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });
        }
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)); }
                catch (e) { reject(new Error('Failed to parse response')); }
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        
        Promise.all([getValidAccessToken(), DeviceService.getDeviceHeaders()]).then(([token, deviceHeaders]) => {
            xhr.open('POST', `${BASE_URL}/api/v1/courses/upload-video`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            
            // Attach Device Headers (Passport)
            Object.entries(deviceHeaders).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value as string);
            });

            xhr.send(formData as any);
        }).catch(reject);
    });
}

/**
 * Get teacher analytics (Teacher)
 */
export async function getTeacherAnalytics(): Promise<{ success: boolean; data: any }> {
    logger.log('[Analytics] Fetching teacher analytics');
    return apiClient.get<{ success: boolean; data: any }>('/api/v1/courses/teacher/analytics');
}

/**
 * Mark a lesson as completed (Student progress tracking)
 */
export async function markLessonCompleted(lessonId: string): Promise<{ success: boolean; message: string }> {
    logger.log('[Progress] Marking lesson as completed:', lessonId);
    return apiClient.post<{ success: boolean; message: string }>(`/api/v1/progress/${lessonId}`, {});
}

/**
 * Get reviews for a specific course
 */
export async function getCourseReviews(courseId: string, page: number = 1, limit: number = 20): Promise<CourseReviewsResponse> {
    logger.log('[Courses] Fetching reviews for course:', courseId);
    return apiClient.get<CourseReviewsResponse>(`/api/v1/courses/${courseId}/reviews`, {
        params: { page, limit }
    });
}

/**
 * Add a review for a course (Student)
 */
export async function createCourseReview(courseId: string, data: CreateReviewRequest): Promise<CreateReviewResponse> {
    logger.log('[Courses] Adding review for course:', courseId);
    return apiClient.post<CreateReviewResponse>(`/api/v1/courses/${courseId}/reviews`, data);
}

/**
 * Update a review for a course (Student)
 */
export async function updateCourseReview(courseId: string, data: CreateReviewRequest): Promise<CreateReviewResponse> {
    logger.log('[Courses] Updating review for course:', courseId);
    return apiClient.put<CreateReviewResponse>(`/api/v1/courses/${courseId}/reviews`, data);
}

/**
 * Delete a course review (Student)
 */
export async function deleteCourseReview(courseId: string): Promise<{ success: boolean; message: string }> {
    logger.log('[Courses] Deleting review for course:', courseId);
    return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/courses/${courseId}/reviews`);
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export interface HealthResponse {
    success: boolean;
    status: string;
    timestamp: string;
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<HealthResponse> {
    return apiClient.get<HealthResponse>('/api/v1/health');
}

/**
 * Readiness check endpoint
 */
export async function readinessCheck(): Promise<HealthResponse> {
    return apiClient.get<HealthResponse>('/api/v1/ready');
}
