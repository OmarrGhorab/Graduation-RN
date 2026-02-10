import { logger } from '@/libs/logger';
import { apiClient } from './apiClient';

export interface ApiCourse {
    id: string;
    title: string;
    description: string;
    subjectId: string;
    subjectName: string;
    teacherId: string;
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
    status: 'ACTIVE' | 'INACTIVE';
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
    };
    progress: {
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
    }[];
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
