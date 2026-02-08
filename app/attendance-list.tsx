
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock Data
const CLASS_NAME = 'Class 3-B Attendance';
const SUB_INFO = 'Science 101 • Mr. Anderson';

type StudentStatus = 'Present' | 'Late' | 'Absent';

interface Student {
    id: string;
    name: string;
    studentId: string;
    grade: string;
    status: StudentStatus;
    image: string;
}

const studentsData: Student[] = [
    {
        id: '1',
        name: 'Alice Smith',
        studentId: '99824',
        grade: 'Grade 10',
        status: 'Present',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLhyLGX1G96a9o1XsZVfIhfe6lvZTecR7xxv2bXVTVm0G5PDOiSBFJ9aAM5n4hhK8t2GI3lKXLafKs8TD0tiWkLYmpGQnccTTZ9oqlJ_WSboSJgGxDlJ2l5A2c1xSMWeKNzhV0YICwv7cnuEEOUWEucdQe2m9jmTd4vsAZKfK2eb6YM5JLUkLIL7kR2mpPZdwsIpsaye5z7eGDb6oBq2oLkzVwo87x_Pfpfdo9jcSvI4WG4JOXE82NSyXy7pxyIT4wPDe9r1zPEfqR'
    },
    {
        id: '2',
        name: 'Bob Jones',
        studentId: '99825',
        grade: 'Grade 10',
        status: 'Late',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcFpIRAC1UusEX0FXq0516wYiEMXoVwX4GxbliVhdrSXtWwwmh-uTR6j0h9O7Yw8sf04wgBcNEQfn9Vgbj9B1oqqDvlTHn_NjaNT2OOxZOEw7a-Vft8wlvT2IzynkrshlmU1ooRN_WkFWonGN5iYz-yBQzFkyo_RbIm4By4OjVHoth7540jNv1b-4GTM11IkvE34vq6AitM3VRkqPXrg4DgO4q6CIt8bw0m6dmgOLksCwLMFUOmJwS0zwhlGv7958ILBUuDOmhA-Ns'
    },
    {
        id: '3',
        name: 'Charlie Day',
        studentId: '99826',
        grade: 'Grade 10',
        status: 'Absent',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEFoWKJZ1wCZQ0IIQgi-1eq_N8Jn1yvbcOrme4NlyXzAbba7IlZgqLeYsvuAGpED8wTC0NTLyaQNOWC4rBj6UlRcCEHDlA1UCKRP05ljn8NxNfWbl4BhjIiEjYnqdt7FFjP6h3vBjYZKq6P54qpwo_CvpYSPijzWy83C7PqAAKJU3oXI2hgAwP8FKuacPns9SUUJRYi_Sl_VfrwdR9Kky76ki4p0pbmdIpCPU44RyY0TgOF7a8o6axMiky1jxHbICRLwRfcAFCWV4G'
    },
    {
        id: '4',
        name: 'Diana Prince',
        studentId: '99827',
        grade: 'Grade 10',
        status: 'Present',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC72YAsxRgwTSM9SIkudCKlruUJBNI0Xjfv4eoKWLVPuAQCljeqPt-ad60SA8g01zHSDry8Xlb_67u_y-HN8GmjAuhmwy4jQAJkfZyubwFq69X63XVZxpheD6AGEeuiLXW59XQtdHnlE_10_yldi0OYi5H_Idb_H2RnspVxExWtRrqraUMGEHppC5OhAYoTavH_Qloi9rbZtGNN6RRzhYu7LdFWXzPiwpChlR5oTpWcfZjwdurhdXjL0pl9usc7hZhwMF-MKjfGZw54'
    },
    {
        id: '5',
        name: 'Evan Wright',
        studentId: '99828',
        grade: 'Grade 10',
        status: 'Present',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK2cDEqXNxQdmjAROxFFvub2bgHcrPmUtzkyY5X6gIn7aDtvBlCUkYxhr5ZctoaOBccp2TKfifwiVFI8KmiZlSWlPTUa_B3bVYPDVecpxkKV0w94NNUByzxJTaR_20SR8IWyEoUjTRrgf5WOYeUbqxmnPF3iM06gmgxrZxeTaNkcV_QbgeRQqw02aCEqy2m1wXdsKWJG-QAj2Ms8eZv2-Q8h74EbOfJICatRr7agP4P1krQfSEgSJPPF9R7MNaPBnf3-g9BwdOuDrj'
    },
    {
        id: '6',
        name: 'Fiona Gallagher',
        studentId: '99829',
        grade: 'Grade 10',
        status: 'Late',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFUElwXbjuA-FzvVgL12pCX6pjkotIyZo3ncpf2Gcxv0y_Axg6ZanWiKyiHh1_T0OMlLBtdN-e-O_eVu5fKlevsdDr_4eIzPOgl3Wgr8TNTsg8eCNJ6WGHDVb0MBtmPY73tIkDF-ZVJER2dcBJX0tzb4-yoz82XBBiEFY0aJpbn97K8wc_wdFf4X7awXsppJft18hD5ydGwA8LrRsjyRYrd2kM-3usFt-yIFkTO4qn7pAdzBnBIYy8HH4raGoaLjdMxHg-9hDk5eqE'
    },
];

const STATUS_COLORS = {
    Present: '#12ed87',
    Late: '#fbbf24',
    Absent: '#ef4444',
};

const STATUS_BG = {
    Present: 'rgba(18, 237, 135, 0.15)',
    Late: 'rgba(251, 191, 36, 0.15)',
    Absent: 'rgba(239, 68, 68, 0.10)',
};

const STATUS_BORDER = {
    Present: 'rgba(18, 237, 135, 0.2)',
    Late: 'rgba(251, 191, 36, 0.2)',
    Absent: 'rgba(239, 68, 68, 0.2)',
};

const STATUS_TEXT = {
    Present: '#0db566', // Darker green for text
    Late: '#b45309', // Dark yellow/brown
    Absent: '#dc2626', // Red
};

export default function AttendanceListScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Filter students based on search
    const filteredStudents = studentsData.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery)
    );

    const renderStudentItem = ({ item }: { item: Student }) => {
        const isAbsent = item.status === 'Absent';

        return (
            <TouchableOpacity
                style={[
                    styles.studentCard,
                    {
                        backgroundColor: isDark ? '#1a2e26' : '#ffffff',
                        borderColor: 'transparent'
                    }
                ]}
                onPress={() => router.push({
                    pathname: '/student-analytics',
                    params: {
                        name: item.name,
                        id: item.studentId,
                        image: item.image
                    }
                })}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.image }}
                        style={[
                            styles.avatar,
                            isAbsent && { opacity: 0.8, } // Using style prop for grayscale isn't direct in RN Image without props or filters, stick to opacity
                        ]}
                    />
                    {item.status === 'Present' && (
                        <View style={[styles.statusDot, { backgroundColor: cskColors[500], borderColor: isDark ? '#1a2e26' : '#ffffff' }]} />
                    )}
                </View>

                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.studentDetails, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                        ID: {item.studentId} • {item.grade}
                    </Text>
                </View>

                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: STATUS_BG[item.status],
                        borderColor: STATUS_BORDER[item.status]
                    }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: isDark ? STATUS_COLORS[item.status] : STATUS_TEXT[item.status] }
                    ]}>
                        {item.status}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#10221a' : '#f8fcfa'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{CLASS_NAME}</Text>
                        <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{SUB_INFO}</Text>
                    </View>
                    <TouchableOpacity style={[styles.filterButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="tune" size={24} color={isDark ? '#e2e8f0' : '#334155'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={isDark ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
                    <TextInput
                        style={[
                            styles.searchInput,
                            {
                                backgroundColor: isDark ? '#1a2e26' : '#ffffff',
                                color: isDark ? '#ffffff' : '#0f172a'
                            }
                        ]}
                        placeholder="Search student by name or ID"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Content List */}
            <FlatList
                data={filteredStudents}
                renderItem={renderStudentItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <Text style={[styles.listHeaderTitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>STUDENTS ({filteredStudents.length})</Text>
                        <Text style={[styles.liveUpdateText, { color: isDark ? cskColors[500] : '#0db566' }]}>Live Updates On</Text>
                    </View>
                )}
            />

            {/* Bottom Floating Action */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: cskColors[500], shadowColor: 'rgba(0,0,0,0.2)' }]}
                    activeOpacity={0.9}
                    onPress={() => router.back()} // Mock submit action
                >
                    <MaterialIcons name="check-circle" size={24} color="#0f172a" />
                    <Text style={styles.fabText}>Submit Report</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Gradient Fade */}
            <LinearGradient
                colors={isDark ? ['rgba(16, 34, 26, 0)', '#10221a'] : ['rgba(248, 252, 250, 0)', '#f8fcfa']}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
        paddingBottom: 20,
        gap: 16,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    filterButton: {
        padding: 8,
        borderRadius: 12,
    },
    searchContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    searchInput: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        paddingLeft: 48,
        paddingRight: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for FAB
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    listHeaderTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    liveUpdateText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 16,
        borderWidth: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#ffffff', // Default light mode border
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    studentInfo: {
        flex: 1,
        gap: 2,
    },
    studentName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    studentDetails: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    fabText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#0f172a',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 96,
        zIndex: 10,
    }
});
