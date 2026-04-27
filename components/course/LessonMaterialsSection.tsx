import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LessonMaterialsSectionProps {
    videoUrl?: string;
    materialsUrl?: string;
    duration?: number;
    isTeacher: boolean;
    onUploadVideo?: () => void;
    onUploadDocument?: () => void;
    onDeleteVideo?: () => void;
    onPlayVideo?: () => void;
}

export function LessonMaterialsSection({
    videoUrl,
    materialsUrl,
    duration,
    isTeacher,
    onUploadVideo,
    onUploadDocument,
    onDeleteVideo,
    onPlayVideo,
}: LessonMaterialsSectionProps) {
    const { theme, isDark } = useTheme();

    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'Duration not available';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const handleDownloadDocument = async () => {
        if (materialsUrl) {
            try {
                const supported = await Linking.canOpenURL(materialsUrl);
                if (supported) {
                    await Linking.openURL(materialsUrl);
                } else {
                    Alert.alert('Error', 'Cannot open document URL');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to open document');
            }
        }
    };

    if (!isTeacher && !videoUrl && !materialsUrl) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>
                Lesson Materials
            </Text>

            {/* Video Section */}
            <View style={[styles.materialCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}>
                <View style={styles.materialHeader}>
                    <View style={[styles.materialIcon, { backgroundColor: `${theme.primary}15` }]}>
                        <Ionicons name="videocam" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.materialInfo}>
                        <Text style={[styles.materialTitle, { color: isDark ? theme.text : '#000' }]}>
                            Lesson Video
                        </Text>
                        {videoUrl && duration && (
                            <Text style={[styles.materialMeta, { color: theme.gray[500] }]}>
                                {formatDuration(duration)}
                            </Text>
                        )}
                    </View>
                </View>

                {videoUrl ? (
                    <View style={styles.materialActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                            onPress={onPlayVideo}
                        >
                            <Ionicons name="play" size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Watch Video</Text>
                        </TouchableOpacity>
                        {isTeacher && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
                                onPress={onDeleteVideo}
                            >
                                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : isTeacher ? (
                    <TouchableOpacity
                        style={[styles.uploadButton, { borderColor: theme.primary }]}
                        onPress={onUploadVideo}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color={theme.primary} />
                        <Text style={[styles.uploadButtonText, { color: theme.primary }]}>
                            Upload Video
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.noMaterialText, { color: theme.gray[400] }]}>
                        No video available yet
                    </Text>
                )}
            </View>

            {/* Document Section */}
            <View style={[styles.materialCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}>
                <View style={styles.materialHeader}>
                    <View style={[styles.materialIcon, { backgroundColor: `${theme.primary}15` }]}>
                        <Ionicons name="document-text" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.materialInfo}>
                        <Text style={[styles.materialTitle, { color: isDark ? theme.text : '#000' }]}>
                            Course Materials
                        </Text>
                        <Text style={[styles.materialMeta, { color: theme.gray[500] }]}>
                            PDF, Slides, Resources
                        </Text>
                    </View>
                </View>

                {materialsUrl ? (
                    <View style={styles.materialActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                            onPress={handleDownloadDocument}
                        >
                            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Download</Text>
                        </TouchableOpacity>
                    </View>
                ) : isTeacher ? (
                    <TouchableOpacity
                        style={[styles.uploadButton, { borderColor: theme.primary }]}
                        onPress={onUploadDocument}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color={theme.primary} />
                        <Text style={[styles.uploadButtonText, { color: theme.primary }]}>
                            Upload Document
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.noMaterialText, { color: theme.gray[400] }]}>
                        No materials available yet
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 16,
    },
    materialCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    materialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    materialIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    materialInfo: {
        flex: 1,
        marginLeft: 12,
    },
    materialTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 2,
    },
    materialMeta: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    materialActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    noMaterialText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        paddingVertical: 8,
    },
});
