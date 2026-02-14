import { logger } from '@/libs/logger';
import { apiClient } from './apiClient';

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
    createdAt: string;
    updatedAt: string;
}

export interface CoursesResponse {
    data: ApiCourse[];
    success: boolean;
}

export interface ApiSubject {
    id: string;
    name: string;
    description: string;
    icon: string;
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
 * Fetch all available courses
 */
export async function getAllCourses(params?: {
    subjectId?: string;
    deliveryType?: 'OFFLINE' | 'ONLINE';
    search?: string;
}): Promise<CoursesResponse> {
    logger.log('[Courses] Fetching all courses', params);
    return apiClient.get<CoursesResponse>('/api/v1/courses', { params });
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
    logger.log('[Lessons] Creating new lesson:', data.title);
    return apiClient.post<CreateLessonResponse>('/api/v1/lessons', data);
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
    deliveryType: 'OFFLINE' | 'ONLINE';
    locationName: string;
    locationLat?: number;
    locationLng?: number;
    geofenceRadiusM: number;
    attendanceWindowMinutes: number;
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
