import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, SafeAreaView } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LessonMaterialsSection } from './LessonMaterialsSection';


const { width } = Dimensions.get('window');

interface LessonDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    lesson: any;
    isTeacher: boolean;
}

export function LessonDetailsModal({ visible, onClose, lesson, isTeacher }: LessonDetailsModalProps) {
    const { theme, isDark } = useTheme();
    
    const player = useVideoPlayer(lesson?.videoUrl, player => {
        player.loop = false;
    });

    if (!lesson) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: isDark ? theme.border : theme.gray[200] }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={isDark ? theme.text : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={1}>
                        {lesson.title}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Video Player */}
                    {lesson.videoUrl ? (
                        <View style={styles.videoContainer}>
                            <VideoView
                                player={player}
                                style={styles.video}
                                allowsFullscreen
                                allowsPictureInPicture
                                startsPictureInPictureAutomatically={true}
                            />
                        </View>
                    ) : (
                        <View style={[styles.noVideoContainer, { backgroundColor: isDark ? theme.surface : '#FFF', borderColor: isDark ? theme.border : theme.gray[200] }]}>
                            <Ionicons name="videocam-off-outline" size={48} color={theme.gray[300]} />
                            <Text style={{ color: theme.gray[400], marginTop: 12, fontFamily: Fonts.medium }}>
                                No video available for this lesson
                            </Text>
                        </View>
                    )}

                    {/* Lesson Info */}
                    <View style={[styles.content, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
                        <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>{lesson.title}</Text>
                        
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={16} color={theme.gray[500]} />
                                <Text style={[styles.metaText, { color: theme.gray[500] }]}>
                                    {new Date(lesson.scheduledAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={16} color={theme.gray[500]} />
                                <Text style={[styles.metaText, { color: theme.gray[500] }]}>
                                    {new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.separator, { backgroundColor: isDark ? theme.border : 'rgba(0,0,0,0.05)' }]} />

                        <Text style={[styles.sectionLabel, { color: theme.primary }]}>Description</Text>
                        <Text style={[styles.description, { color: isDark ? theme.gray[300] : theme.gray[600] }]}>
                            {lesson.description || 'No description provided for this lesson.'}
                        </Text>
                        
                        {lesson.locationName && (
                             <View style={[styles.locationBox, { backgroundColor: isDark ? theme.background : theme.gray[50] }]}>
                                <Ionicons name="location-outline" size={18} color={theme.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.locationLabel, { color: theme.gray[500] }]}>Location</Text>
                                    <Text style={[styles.locationName, { color: isDark ? theme.text : '#000' }]}>{lesson.locationName}</Text>
                                </View>
                             </View>
                        )}
                    </View>

                    {/* Materials Section */}
                    <LessonMaterialsSection
                        videoUrl={lesson.videoUrl}
                        materialsUrl={lesson.materialsUrl}
                        duration={lesson.duration}
                        isTeacher={isTeacher}
                        onPlayVideo={() => player.play()}
                    />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    videoContainer: {
        width: width,
        height: width * (9 / 16),
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    noVideoContainer: {
        width: width,
        height: width * (9 / 16),
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
    },
    content: {
        padding: 20,
        marginTop: 12,
        borderRadius: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    title: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    separator: {
        height: 1,
        marginVertical: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        lineHeight: 24,
    },
    locationBox: {
        marginTop: 20,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    locationLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    locationName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    }
});
