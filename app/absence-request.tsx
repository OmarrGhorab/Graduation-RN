
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AbsenceRequestScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();

    // Form State
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [hasAttachment, setHasAttachment] = useState(false); // Mock for now

    const handleSubmit = () => {
        // Handle submission logic here (e.g., API call)
        console.log({ date, reason, notes, hasAttachment });
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#10221a' : '#f8fcfa'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                >
                    <MaterialIcons name="arrow-back-ios-new" size={24} color={isDark ? '#fff' : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>New Absence</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Description */}
                <Text style={[styles.description, { color: isDark ? '#88cba8' : '#4c9a75' }]}>
                    Please provide details for your absence. All submissions are verified by the attendance officer.
                </Text>

                <View style={styles.form}>
                    {/* Date Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>When will you be away?</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                    color: isDark ? '#f0fdf7' : '#0d1b15',
                                    borderColor: isDark ? '#2a4a3c' : '#cfe7dc'
                                }]}
                                placeholder="Select Date"
                                placeholderTextColor={isDark ? '#4c9a75' : '#a0aec0'}
                                value={date}
                                onChangeText={setDate}
                            />
                            <MaterialIcons
                                name="calendar-today"
                                size={20}
                                color="#4c9a75"
                                style={styles.inputIcon}
                            />
                        </View>
                    </View>

                    {/* Reason Selector (Mocked as View for visual) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Reason for absence</Text>
                        <View style={styles.inputContainer}>
                            {/* In a real app, use a Modal or Picker here */}
                            <TouchableOpacity style={[styles.input, {
                                justifyContent: 'center',
                                backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                borderColor: isDark ? '#2a4a3c' : '#cfe7dc'
                            }]}>
                                <Text style={{ color: reason ? (isDark ? '#f0fdf7' : '#0d1b15') : (isDark ? '#4c9a75' : '#a0aec0') }}>
                                    {reason || "Select a reason..."}
                                </Text>
                            </TouchableOpacity>
                            <MaterialIcons
                                name="expand-more"
                                size={24}
                                color="#4c9a75"
                                style={styles.inputIcon}
                            />
                        </View>
                        {/* Simple mock options row */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                            {['Medical', 'Sickness', 'Family', 'Other'].map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => setReason(opt)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: reason === opt ? cskColors[500] : (isDark ? '#1a332a' : '#f0fdf7'),
                                            borderColor: reason === opt ? cskColors[500] : (isDark ? '#2a4a3c' : '#cfe7dc')
                                        }
                                    ]}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: reason === opt ? '#10221a' : (isDark ? '#88cba8' : '#4c9a75') }
                                    ]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Notes */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Additional Notes</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                    color: isDark ? '#f0fdf7' : '#0d1b15',
                                    borderColor: isDark ? '#2a4a3c' : '#cfe7dc'
                                }]}
                                placeholder="Please describe the situation briefly..."
                                placeholderTextColor={isDark ? '#4c9a75' : '#a0aec0'}
                                multiline
                                textAlignVertical="top"
                                value={notes}
                                onChangeText={setNotes}
                                maxLength={200}
                            />
                            <Text style={[styles.charCount, { backgroundColor: isDark ? '#1a332a' : '#ffffff', color: '#4c9a75' }]}>
                                {notes.length}/200
                            </Text>
                        </View>
                    </View>

                    {/* Evidence Section */}
                    <View style={styles.evidenceSection}>
                        <View style={styles.evidenceHeader}>
                            <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Medical Certificate</Text>
                            <View style={[styles.optionalBadge, { backgroundColor: 'rgba(18, 237, 135, 0.1)' }]}>
                                <Text style={[styles.optionalText, { color: cskColors[500] }]}>Optional</Text>
                            </View>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceList}>
                            {/* Add Button */}
                            <TouchableOpacity style={[styles.addEvidenceButton, { borderColor: isDark ? '#2a4a3c' : '#cfe7dc' }]}>
                                <View style={[styles.addIconCircle, { backgroundColor: cskColors[500] }]}>
                                    <MaterialIcons name="add" size={20} color="#10221a" />
                                </View>
                                <Text style={[styles.addEvidenceText, { color: isDark ? '#88cba8' : '#4c9a75' }]}>Add Photo</Text>
                            </TouchableOpacity>

                            {/* Mock Thumbnail */}
                            <View style={[styles.thumbnailContainer, { borderColor: isDark ? '#2a4a3c' : '#cfe7dc' }]}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHEb1weQ9IgAWmeAaUBqC1M9JB8YlN2j5Y8h2NFzSCYn9ppzPJp7Ffxs5zf4WZRyOauljk96Yjc0XmDMTWbfiB7jgIFvjrRWAFM2AseaSSHHZnp105IKojJ7HO6RGJndABs41SGndy7mpalCUp4RRL0G71J1ihc7pGN9615tQA3nVrY_TmC4fSM2sA4WoE_I5hJqFgEIfxWb3lgQbW40QSYmqoOjsN2j8QhtybD_ntditUEdnPrgxPoJFpXaH0lKjNkjxEy-KAs2-W' }}
                                    style={styles.thumbnail}
                                />
                                <TouchableOpacity style={styles.removeButton}>
                                    <MaterialIcons name="close" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <LinearGradient
                colors={isDark ? ['rgba(16, 34, 26, 0)', '#10221a'] : ['rgba(248, 252, 250, 0)', '#f8fcfa']}
                style={styles.footer}
            >
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: cskColors[500], shadowColor: 'rgba(18, 237, 135, 0.2)' }]}
                    activeOpacity={0.9}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                    <MaterialIcons name="send" size={20} color="#10221a" />
                </TouchableOpacity>

                <View style={styles.secureBadge}>
                    <MaterialIcons name="lock" size={14} color={isDark ? '#88cba8' : '#4c9a75'} />
                    <Text style={[styles.secureText, { color: isDark ? '#88cba8' : '#4c9a75' }]}>SECURE SUBMISSION</Text>
                </View>
            </LinearGradient>
        </View>
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
        paddingTop: Platform.OS === 'android' ? 40 : 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    description: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        lineHeight: 22,
        marginBottom: 32,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: Fonts.regular,
        height: 54,
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    textAreaContainer: {
        position: 'relative',
    },
    textArea: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: Fonts.regular,
        minHeight: 120,
    },
    charCount: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        fontSize: 12,
        fontFamily: Fonts.regular,
        paddingHorizontal: 4,
    },
    evidenceSection: {
        paddingTop: 8,
        gap: 12,
    },
    evidenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionalBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    optionalText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    evidenceList: {
        gap: 12,
        paddingBottom: 8,
    },
    addEvidenceButton: {
        width: 96,
        height: 96,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    addEvidenceText: {
        fontSize: 10,
        fontFamily: Fonts.medium,
    },
    thumbnailContainer: {
        width: 96,
        height: 96,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 32,
    },
    submitButton: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#10221a', // Dark text on primary button
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
        opacity: 0.6,
    },
    secureText: {
        fontSize: 10,
        fontFamily: Fonts.medium,
        letterSpacing: 0.5,
    },
});
