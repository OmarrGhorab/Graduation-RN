import {
    deleteLessonVideo,
    updateLessonMaterials,
    uploadLessonDocument,
    uploadLessonVideo
} from '@/services/CourseService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useLessonMaterials(lessonId: string, courseId: string) {
    const queryClient = useQueryClient();

    const uploadVideoMutation = useMutation({
        mutationFn: (videoFile: { uri: string; type: string; name: string }) =>
            uploadLessonVideo(lessonId, videoFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
            queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        },
    });

    const uploadDocumentMutation = useMutation({
        mutationFn: (documentFile: { uri: string; type: string; name: string }) =>
            uploadLessonDocument(lessonId, documentFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
            queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        },
    });

    const deleteVideoMutation = useMutation({
        mutationFn: () => deleteLessonVideo(lessonId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
            queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        },
    });

    const updateMaterialsMutation = useMutation({
        mutationFn: (data: {
            videoUrl?: string;
            videoPublicId?: string;
            materialsUrl?: string;
            duration?: number;
        }) => updateLessonMaterials(lessonId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
            queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
        },
    });

    return {
        uploadVideo: uploadVideoMutation.mutateAsync,
        uploadDocument: uploadDocumentMutation.mutateAsync,
        deleteVideo: deleteVideoMutation.mutateAsync,
        updateMaterials: updateMaterialsMutation.mutateAsync,
        isUploadingVideo: uploadVideoMutation.isPending,
        isUploadingDocument: uploadDocumentMutation.isPending,
        isDeletingVideo: deleteVideoMutation.isPending,
        isUpdatingMaterials: updateMaterialsMutation.isPending,
    };
}
