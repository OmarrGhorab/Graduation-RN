import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock Data for Chat Detail
const MOCK_MESSAGES = [
    {
        id: '1',
        type: 'text',
        content: 'Hello! Did you have a chance to review the module 3 materials?',
        timestamp: '10:30 AM',
        isSender: false,
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvRj5ZCz1qmb_05bwS2r1ug8SM6QKOy1Y-vvbhPVvUNWSORMjszyv1Ai8WYuV9pEVZLmil2AUrtFclhEWC2Li7RCAvKayCJuiLvrpDoPg6b2O4F3tQX6nutqJnEURzYogTDu-HXNu3_SHKSVjz93s3xkvfIE6s_Bxio5i8lAkFMUcZUWProMrgvyCwiFBsLrX4uF2Nc75l-b0KhZ93S330acmjQ-yMvk3mJbn4LXR7yDwiVwll7vsLimfkIVG8UyjFKVhc3SXFpVUL'
    },
    {
        id: '2',
        type: 'text',
        content: 'Yes, I just finished them. I have one question about the case study.',
        timestamp: '10:32 AM',
        isSender: true,
        read: true,
    },
    {
        id: '3',
        type: 'audio',
        duration: '0:45',
        timestamp: '10:33 AM',
        isSender: false,
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATu6awXdRBeCmPl0SntjCPa-oIhOWBzgoCwMt31NebbPfdzsDB1SjA0Hu_u8v4fwO0chayQBYejS1RS03qhMaGsF0G9gifxj1Z1TitA5hlwEo-ulgsEj5_pxap7sIT4Dzi-ZOcg9QOwGmflPaSCVy7xp8nMX5YOEdQY3QQIlVBNptE8Rv8NUn9FVqmXuEMWu9XjTL-LKMjX5P1VoaVPO9m7QJqpbNFVho1nEY1WNC27aE5VvBLUBv1wVHJvFdUXcP_QsrWYbgFJZuz'
    },
    {
        id: '4',
        type: 'image',
        content: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBilc49AvKnvFItyiH8qZ5hMuMqtJy8fwWHdhsKZ_onuZm-s-Etio7ERp3SoUp2ibdYQm3Q9AgnPDB78KEQTW-ETNo0By8Iyp3GaRH_LkGS6AxodFAgyi8RsIDDjqTEz8M0z-sO2UnORa4_6gRSorMc_bkW-la0Ocv6rWQ_RZtjL8DVtuGMjS1STjLAfGvFkDtNhiRUS045qlJTruQWKvZaPNc6cjPyKoEjy6CkF1h5Fw1QkTSrA0zwVlJlTXw5Z1e_Z5YMYfYmrmLw',
        caption: 'Here is the section I was referring to in the PDF.',
        timestamp: '10:35 AM',
        isSender: true,
        read: true,
    }
];

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [inputText, setInputText] = useState('');

    const Header = () => (
        <BlurView
            intensity={Platform.OS === 'android' ? 50 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.header, { paddingTop: insets.top, borderBottomColor: theme.divider }]}
        >
            <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name={textAlign === 'right' ? "chevron-forward" : "chevron-back"} size={28} color={theme.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerProfile}
                        onPress={() => router.push(`/group-info/${id}`)}
                    >
                        <View>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjH3KYd3t7b_k-NYZRgvI4FqWTW5Hhc4Y7QrC9f2v5hNMmneGyKD_cR4SuXcKGq93TY74xPYPghejZcqdI97F7m1A_y5kxsCD98hKd0w87AA06mWj-PV96mnNuYYBwZmCRvDpS_vbAPKlBpdrqLeyAya_3-zkEjHQ2ZPVcFB2BtUN9M0-Rel2ZAaf4WTWqN3k9dCEjz7tgcG1AbGYtwiv5aXlaeRYCwa9QbWNU_kGJNKcnGx-jIam1HkzKSo77tfWbacmjSmgXHHvf' }}
                                style={[styles.headerAvatar, { borderColor: theme.border }]}
                                contentFit="cover"
                                transition={200}
                            />
                            <View style={[styles.onlineDot, { borderColor: theme.background }]} />
                        </View>
                        <View>
                            <Text style={[styles.headerName, { color: theme.text }]}>Dr. Sarah Smith</Text>
                            <View style={[styles.roleTag, { backgroundColor: isDark ? 'rgba(9, 125, 70, 0.2)' : 'rgba(9, 125, 70, 0.1)' }]}>
                                <Text style={[styles.roleText, { color: theme.primary }]}>INSTRUCTOR</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity>
                        <Ionicons name="videocam-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push(`/group-info/${id}`)}>
                        <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </BlurView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Image
                source={{ uri: isDark ? undefined : 'https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg' }}
                style={[StyleSheet.absoluteFill, { opacity: 0.05 }]}
                contentFit="cover"
            />
            {/* Using Stack.Screen to hide default header */}
            <Stack.Screen options={{ headerShown: false }} />

            <Header />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={[styles.messagesList, { paddingBottom: 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.dateDivider}>
                        <View style={[styles.dateBadge, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                            <Text style={[styles.dateText, { color: theme.textSecondary }]}>TODAY</Text>
                        </View>
                    </View>

                    {MOCK_MESSAGES.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} theme={theme} isDark={isDark} />
                    ))}
                </ScrollView>

                <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.divider, paddingBottom: insets.bottom || 20 }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Ionicons name="add-circle-outline" size={28} color={theme.icon} />
                    </TouchableOpacity>

                    <View style={[styles.inputFieldContainer, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text, textAlign }]}
                            placeholder="Type a message..."
                            placeholderTextColor={theme.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.smileyButton}>
                            <Ionicons name="happy-outline" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]}>
                        <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// Sub-components
const MessageBubble = ({ message, theme, isDark }: any) => {
    const isSender = message.isSender;

    const renderContent = () => {
        if (message.type === 'text') {
            return (
                <Text style={[
                    styles.messageText,
                    { color: isSender ? '#FFFFFF' : theme.text }
                ]}>
                    {message.content}
                </Text>
            );
        } else if (message.type === 'audio') {
            return (
                <View style={styles.audioContainer}>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.waveformContainer}>
                        {[...Array(12)].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.waveformBar,
                                    {
                                        height: [12, 20, 32, 16, 24, 28, 12, 20, 32, 16, 24, 8][i],
                                        backgroundColor: isSender ? 'rgba(255,255,255,0.8)' : theme.primary,
                                        opacity: [0, 6, 11].includes(i) ? 0.4 : 1
                                    }
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={[styles.audioDuration, { color: isSender ? 'rgba(255,255,255,0.9)' : theme.primary }]}>
                        {message.duration}
                    </Text>
                </View>
            );
        } else if (message.type === 'image') {
            return (
                <View style={styles.imageMessageContainer}>
                    <Image
                        source={{ uri: message.content }}
                        style={styles.messageImage}
                        contentFit="cover"
                        transition={200}
                    />
                    {message.caption && (
                        <View style={[styles.captionContainer, { backgroundColor: isSender ? 'rgba(0,0,0,0.1)' : 'transparent' }]}>
                            <Text style={[styles.messageText, { color: isSender ? '#FFFFFF' : theme.text }]}>
                                {message.caption}
                            </Text>
                        </View>
                    )}
                </View>
            );
        }
    };

    return (
        <View style={[
            styles.messageRow,
            isSender ? styles.messageRowSender : styles.messageRowReceiver
        ]}>
            {!isSender && (
                <Image
                    source={{ uri: message.senderAvatar }}
                    style={styles.messageAvatar}
                    contentFit="cover"
                />
            )}

            <View style={[styles.bubbleContainer, isSender ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                <View style={[
                    styles.bubble,
                    isSender ? [styles.bubbleSender, { backgroundColor: theme.primary }] : [styles.bubbleReceiver, { backgroundColor: isDark ? theme.surface : theme.surface }]
                ]}>
                    {renderContent()}
                </View>

                <View style={styles.messageMeta}>
                    <Text style={[styles.timestamp, { color: theme.textTertiary }]}>
                        {message.timestamp}
                    </Text>
                    {isSender && (
                        <Ionicons name="checkmark-done-outline" size={16} color={message.read ? theme.primary : theme.textTertiary} />
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 8, // Additional padding after safe area
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    backButton: {
        padding: 4,
    },
    headerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#48BB78',
        borderWidth: 2,
    },
    headerName: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        lineHeight: 20,
    },
    roleTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    roleText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    keyboardView: {
        flex: 1,
        paddingTop: 100, // Space for header
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 20,
    },
    dateDivider: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dateText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messageRow: {
        flexDirection: 'row',
        gap: 8,
        maxWidth: '100%',
        alignItems: 'flex-end',
    },
    messageRowSender: {
        justifyContent: 'flex-end',
        marginLeft: 'auto',
    },
    messageRowReceiver: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginBottom: 20, // Align with bubble bottom
    },
    bubbleContainer: {
        maxWidth: '85%',
        gap: 4,
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleSender: {
        borderBottomRightRadius: 4,
    },
    bubbleReceiver: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    messageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 2,
    },
    timestamp: {
        fontSize: 10,
    },
    // Audio styling
    audioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: 200,
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)', // Or primary if receiver
        justifyContent: 'center',
        alignItems: 'center',
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 24,
        gap: 2,
        flex: 1,
    },
    waveformBar: {
        width: 3,
        borderRadius: 2,
    },
    audioDuration: {
        fontSize: 11,
        fontFamily: Fonts.medium,
    },
    // Image styling
    imageMessageContainer: {
        overflow: 'hidden',
        // padding: 0, // Reset padding for image bubble
    },
    messageImage: {
        width: 240,
        height: 180,
        borderRadius: 16,
    },
    captionContainer: {
        marginTop: 8,
    },
    // Input styling
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 12,
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 4,
    },
    inputFieldContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        minHeight: 40,
        maxHeight: 100,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.regular,
        paddingVertical: 8,
        paddingRight: 8,
    },
    smileyButton: {
        padding: 4,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});
