
import { CourseStatsCard, QRScannerModal, SyllabusItem } from '@/components/course';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CourseScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        if (params.action === 'scan') {
            setShowScanner(true);
        }
    }, [params.action]);

    const handleScan = (data: string) => {
        setShowScanner(false);
        // Navigate to success screen with data
        router.push({
            pathname: '/attendance-success',
            params: {
                data,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                location: 'Hall B' // Mock location based on successful scan
            }
        });
    };

    // Mock Data based on the provided design
    const courseInfo = {
        title: 'Network Security 101',
        code: 'SEC-404',
        level: 'Advanced Level',
        instructor: {
            name: 'Prof. Sarah Jenkins',
            department: 'Cybersecurity Dept',
            image: '' // This would be a real URL
        },
        stats: {
            attendance: 75,
            classesAttended: 12,
            totalClasses: 16,
            targetPercentage: 80,
        }
    };

    const syllabusData = [
        {
            id: '1',
            status: 'LIVE' as const,
            title: 'Intrusion Detection Systems',
            time: '10:00 AM - 11:30 AM',
            location: 'Lab 302 • Main Campus',
        },
        {
            id: '2',
            status: 'COMPLETED' as const,
            title: 'Firewall Configurations',
            time: '10:00 AM',
            date: 'Oct 14',
            location: 'Lecture Hall A',
        },
        {
            id: '3',
            status: 'ABSENT' as const,
            title: 'Intro to Cryptography',
            time: '10:00 AM',
            date: 'Oct 12',
            location: 'Lecture Hall B',
        },
        {
            id: '4',
            status: 'SCHEDULED' as const,
            title: 'Ethical Hacking Basics',
            description: 'Covers penetration testing methodologies and legal frameworks.',
            time: '10:00 AM',
            date: 'Oct 21',
            location: 'Lab 302',
        },
        {
            id: '5',
            status: 'SCHEDULED' as const,
            title: 'Wireless Security',
            time: '10:00 AM',
            date: 'Oct 23',
            location: 'Lab 101',
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.gray[600] }]}>COURSE DETAILS</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.heroSection}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[200] }]}>
                        <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.courseTitle, { color: isDark ? theme.text : '#0d1b15' }]}>{courseInfo.title}</Text>
                    <Text style={[styles.courseSubtitle, { color: theme.gray[500] }]}>
                        {courseInfo.code} • {courseInfo.level}
                    </Text>
                </Animated.View>

                {/* Stats Card */}
                <CourseStatsCard
                    attendance={courseInfo.stats.attendance}
                    classesAttended={courseInfo.stats.classesAttended}
                    totalClasses={courseInfo.stats.totalClasses}
                    targetPercentage={courseInfo.stats.targetPercentage}
                />

                {/* Instructor Info */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={[styles.instructorCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[200] }]}>
                    <View style={styles.instructorInfo}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }}
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={[styles.instructorName, { color: isDark ? theme.text : '#000' }]}>{courseInfo.instructor.name}</Text>
                            <Text style={[styles.department, { color: theme.gray[500] }]}>{courseInfo.instructor.department}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.chatButton, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Syllabus Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>Course Syllabus</Text>
                    <TouchableOpacity>
                        <Text style={[styles.viewAllText, { color: theme.primary }]}>VIEW ALL</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.syllabusList, { borderLeftColor: isDark ? theme.border : theme.gray[200] }]}>
                    {syllabusData.map((item, index) => (
                        <SyllabusItem
                            key={item.id}
                            {...item}
                            isLast={index === syllabusData.length - 1}
                            onPress={() => console.log('Syllabus item pressed')}
                            onMarkAttendance={() => setShowScanner(true)}
                            onAbsentRequest={() => router.push('/absence-request')}
                        />
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <QRScannerModal
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    courseTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        textAlign: 'center',
        marginBottom: 4,
    },
    courseSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    instructorCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    instructorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(18, 237, 135, 0.2)',
    },
    instructorName: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    department: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    chatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    viewAllText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    syllabusList: {
        borderLeftWidth: 2,
        marginLeft: 8,
        paddingLeft: 24,
        paddingBottom: 16,
    },
});
