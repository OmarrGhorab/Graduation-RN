import { useLocalSearchParams, Redirect } from 'expo-router';
import React from 'react';

/**
 * Proxy screen for /course-reviews
 * This screen redirects to the appropriate course details screen with the reviews tab selected.
 * This resolves the 'unmatched routes' error when clicking review-related notifications.
 */
export default function CourseReviewsProxy() {
    const params = useLocalSearchParams();
    const { id, courseId } = params;
    
    // Use either 'id' or 'courseId' from params
    const effectiveId = id || courseId;
    
    if (!effectiveId) {
        return <Redirect href="/home" />;
    }

    return (
        <Redirect 
            href={{ 
                pathname: `/course-details`, 
                params: { ...params, id: effectiveId, tab: 'REVIEWS' } 
            }} 
        />
    );
}
