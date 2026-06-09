import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    Keyboard,
    Modal,
    Dimensions,
    useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatbotService } from '@/services/ChatbotService';
import { ChatMessage, ChatSession } from '@/types/chatbot';
import { Fonts } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { 
    FadeIn, 
    FadeOut,
    FadeInDown, 
    SlideInLeft,
    SlideOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withDelay,
    withSequence,
    withTiming,
    SlideInUp,
} from 'react-native-reanimated';
import { useToast } from '@/components/toast';

const { width } = Dimensions.get('window');

// Premium Avatar Path
const AI_AVATAR = require('@/assets/images/ai-avatar-premium.png');

const SUGGESTED_TOPICS = [
    { id: '1', title: 'Security', icon: 'shield-checkmark-outline', prompt: 'How does the secure QR attendance system work?' },
    { id: '2', title: 'Progress', icon: 'stats-chart-outline', prompt: 'How can I track my graduation project progress?' },
    { id: '3', title: 'Appeal', icon: 'document-text-outline', prompt: 'What is the process for appealing a missed attendance?' },
    { id: '4', title: 'History', icon: 'calendar-outline', prompt: 'Show me my recent lesson and attendance history.' },
];

// --- Components ---

const ThinkingDots = React.memo(({ isVisible, color }: { isVisible: boolean, color: string }) => {
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
        const animate = (val: any, delay: number) => {
            val.value = withRepeat(
                withSequence(withDelay(delay, withTiming(1, { duration: 400 })), withTiming(0.3, { duration: 400 })),
                -1, true
            );
        };
        if (isVisible) { animate(dot1, 0); animate(dot2, 200); animate(dot3, 400); }
    }, [isVisible]);

    const style1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
    const style2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
    const style3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

    if (!isVisible) return null;
    return (
        <View style={styles.thinkingWrapper}>
            <Animated.View style={[styles.dot, { backgroundColor: color }, style1]} />
            <Animated.View style={[styles.dot, { backgroundColor: color }, style2]} />
            <Animated.View style={[styles.dot, { backgroundColor: color }, style3]} />
        </View>
    );
});

const WelcomePlaceholder = React.memo(({ userName, theme, onSelectTopic }: { userName: string, theme: any, onSelectTopic: (text: string) => void }) => (
    <View style={styles.emptyRoot}>
        <Animated.View entering={FadeIn.duration(800)} exiting={FadeOut.duration(400)} style={styles.emptyContent}>
            <Image source={AI_AVATAR} style={styles.largeAiIcon} contentFit="contain" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Hello {userName}!</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>What can I help you with today?</Text>

            <View style={styles.iconRow}>
                {SUGGESTED_TOPICS.map((topic, idx) => (
                    <Animated.View key={topic.id} entering={FadeInDown.delay(400 + (idx * 100))}>
                        <TouchableOpacity 
                            style={[styles.iconButton, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onSelectTopic(topic.prompt);
                            }}
                        >
                            <Ionicons name={topic.icon as any} size={24} color={theme.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.iconLabel, { color: theme.textSecondary }]}>{topic.title}</Text>
                    </Animated.View>
                ))}
            </View>
        </Animated.View>
    </View>
));

export default function AIChatScreen() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const toast = useToast();
    const { width: windowWidth } = useWindowDimensions();
    const sidebarWidth = useMemo(() => Math.min(windowWidth * 0.86, 380), [windowWidth]);
    
    // Core State
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // UI State
    const [showSessions, setShowSessions] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [sessionToEdit, setSessionToEdit] = useState<ChatSession | null>(null);
    const [editTitle, setEditTitle] = useState('');
    
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (streamingContent || isTyping || isUploading) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [streamingContent, isTyping, isUploading]);

    // Initial Loading
    useEffect(() => {
        const initializeChat = async () => {
            try {
                setIsLoading(true);
                const data = await ChatbotService.getSessions();
                setSessions(data);
                if (data.length > 0) {
                    await handleSelectSession(data[0]);
                }
            } catch (error) {
                console.error('[AIChat] Init Error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        initializeChat();
    }, []);

    const handleSelectSession = async (session: ChatSession) => {
        setCurrentSession(session);
        setShowSessions(false);
        try {
            const history = await ChatbotService.getHistory(session.id);
            setMessages(history);
        } catch (error) {
            console.error('[AIChat] History Error:', error);
        }
    };

    const handleNewSessionAction = () => {
        setCurrentSession(null);
        setMessages([]);
        setShowSessions(false);
        setInputText('');
        setSelectedImage(null);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast.error('Permission Denied', 'Allow access to gallery to send photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleUpdateTitle = async () => {
        if (!sessionToEdit || !editTitle.trim()) return;
        try {
            const updated = await ChatbotService.updateSession(sessionToEdit.id, editTitle.trim());
            const finalSession = (updated && updated.id) ? updated : { ...sessionToEdit, title: editTitle.trim() };
            setSessions(prev => prev.map(s => s.id === sessionToEdit.id ? finalSession : s));
            if (currentSession?.id === sessionToEdit.id) setCurrentSession(finalSession);
            setEditModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) { toast.error('Error', 'Failed to update title'); }
    };

    const handleConfirmDelete = async () => {
        if (!sessionToEdit) return;
        try {
            await ChatbotService.deleteSession(sessionToEdit.id);
            const remaining = sessions.filter(s => s.id !== sessionToEdit.id);
            setSessions(remaining);
            if (currentSession?.id === sessionToEdit.id) {
                if (remaining.length > 0) handleSelectSession(remaining[0]);
                else handleNewSessionAction();
            }
            setDeleteModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) { toast.error('Error', 'Failed to delete chat'); }
    };

    const handleSend = useCallback(async (customText?: string) => {
        const textToSend = customText || inputText.trim();
        const hasImage = !!selectedImage;

        if ((!textToSend && !hasImage) || isTyping || isUploading) return;

        setInputText('');
        const imageToUpload = selectedImage;
        setSelectedImage(null);
        setIsTyping(true);
        setStreamingContent('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        let activeSession = currentSession;

        if (!activeSession) {
            try {
                const title = textToSend 
                    ? (textToSend.substring(0, 20) + (textToSend.length > 20 ? '...' : ''))
                    : 'Photo Shared';
                activeSession = await ChatbotService.createSession({ title });
                setCurrentSession(activeSession);
                setSessions(prev => [activeSession!, ...prev]);
            } catch (err) {
                toast.error('Error', 'Failed to start conversation');
                setIsTyping(false);
                return;
            }
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            chatId: activeSession.id,
            role: 'user',
            content: textToSend || 'Sent an image',
            imageUrl: imageToUpload || undefined,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        
        try {
            let accumulated = '';
            if (imageToUpload) {
                setIsUploading(true);
                // Binary Vision Streaming Flow
                await ChatbotService.sendBinaryMessageStreaming(
                    activeSession.id,
                    textToSend || 'Explain this image',
                    imageToUpload,
                    'image/jpeg',
                    (chunk) => {
                        accumulated += chunk;
                        setStreamingContent(accumulated);
                    }
                );
            } else {
                // Regular Streaming Flow
                await ChatbotService.sendMessageStreaming(
                    activeSession.id,
                    textToSend,
                    (chunk) => {
                        accumulated += chunk;
                        setStreamingContent(accumulated);
                    }
                );
            }

            if (!accumulated.trim()) {
                toast.error('No response', 'The assistant did not return a usable reply. Please try again.');
                setStreamingContent('');
                return;
            }

            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                chatId: activeSession.id,
                role: 'assistant',
                content: accumulated,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, assistantMsg]);
            setStreamingContent('');
        } catch (error) {
            console.error('[AIChat] Send Error:', error);
            if (streamingContent.trim()) {
                const fallbackAssistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    chatId: activeSession.id,
                    role: 'assistant',
                    content: streamingContent,
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, fallbackAssistantMessage]);
                setStreamingContent('');
                toast.error('Connection interrupted', 'Saved the partial reply we received.');
            } else {
                toast.error('Error', 'Failed to get a response');
            }
        } finally {
            setIsTyping(false);
            setIsUploading(false);
        }
    }, [inputText, currentSession, isTyping, selectedImage, isUploading, streamingContent, toast]);

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
        const isAssistant = item.role === 'assistant';
        return (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.messageRow, isAssistant ? styles.assistantRow : styles.userRow]}>
                {isAssistant && (
                    <View style={styles.assistantAvatarContainer}>
                        <Image source={AI_AVATAR} style={styles.aiIcon} contentFit="cover" />
                    </View>
                )}
                <View style={[styles.bubble, isAssistant ? [styles.assistantBubble, { backgroundColor: isDark ? theme.surfaceVariant : '#F0F0F0' }] : [styles.userBubble, { backgroundColor: theme.primary }]]}>
                    {item.imageUrl && (
                        <Image 
                            source={{ uri: item.imageUrl }} 
                            style={styles.messageImage} 
                            contentFit="cover" 
                        />
                    )}
                    <Text style={[styles.messageText, { color: isAssistant ? theme.text : '#FFF' }]}>{item.content}</Text>
                    <Text style={[styles.timeText, { color: isAssistant ? theme.textTertiary : 'rgba(255,255,255,0.6)' }]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </Animated.View>
        );
    }, [theme, isDark]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Stack.Screen options={{ headerShown: false }} />

            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => setShowSessions(true)} style={styles.headerBtn}><Ionicons name="menu" size={28} color={theme.text} /></TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>AI Assistant</Text>
                        <View style={styles.headerStatus}>
                            <View style={[styles.onlineDot, { backgroundColor: isTyping ? '#F59E0B' : '#34D399' }]} />
                            <Text style={[styles.statusText, { color: theme.textTertiary }]}>{(isTyping || isUploading) ? 'Thinking...' : 'Connected'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleNewSessionAction} style={styles.headerBtn}><Ionicons name="add" size={28} color={theme.text} /></TouchableOpacity>
                </View>
            </BlurView>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
            >
                {isLoading && messages.length === 0 ? (
                    <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
                ) : (
                    <FlatList
                        ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={item => item.id}
                        contentContainerStyle={[styles.list, messages.length === 0 && { flexGrow: 1 }]}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={() => (
                            <WelcomePlaceholder userName={user?.name?.split(' ')[0] || ''} theme={theme} onSelectTopic={handleSend} />
                        )}
                        ListFooterComponent={() => (
                            <View style={styles.footerSpace}>
                                {(isTyping || streamingContent || isUploading) && (
                                    <View style={[styles.messageRow, styles.assistantRow]}>
                                        <View style={styles.assistantAvatarContainer}><Image source={AI_AVATAR} style={styles.aiIcon} /></View>
                                        <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: isDark ? theme.surfaceVariant : '#F0F0F0' }]}>
                                            {streamingContent ? <Text style={[styles.messageText, { color: theme.text }]}>{streamingContent}</Text> : <ThinkingDots isVisible={true} color={theme.primary} />}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    />
                )}

                {/* --- Image Selection Preview --- */}
                {selectedImage && (
                    <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.imagePreviewContainer}>
                        <View style={[styles.previewWrapper, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                            <Image source={{ uri: selectedImage }} style={styles.previewThumbnail} contentFit="cover" />
                            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
                                <Ionicons name="close-circle" size={24} color={theme.error[500]} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={[styles.inputContainer, { paddingBottom: Math.max(insets.top > 20 ? insets.bottom : 16, 16) }]}>
                    <View style={[styles.inputRow, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E5E5' }]}>
                        <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
                            <Ionicons name="add" size={26} color={theme.primary} />
                        </TouchableOpacity>
                        <TextInput 
                            style={[styles.inputInput, { color: theme.text }]} 
                            placeholder="Message AI..." 
                            placeholderTextColor={theme.textTertiary} 
                            value={inputText} 
                            onChangeText={setInputText} 
                            multiline 
                            maxLength={2000} 
                        />
                        <TouchableOpacity 
                            onPress={() => handleSend()} 
                            disabled={(!inputText.trim() && !selectedImage) || isTyping || isUploading} 
                            style={[styles.sendBtn, { backgroundColor: (inputText.trim() || selectedImage) && !isTyping ? theme.primary : (isDark ? '#2C2C2E' : '#F0F0F0') }]}
                        >
                            {isUploading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="arrow-up" size={22} color={(inputText.trim() || selectedImage) && !isTyping ? '#FFF' : theme.textTertiary} />}
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>

            {/* Existing Sidebar / Modals... */}
            <Modal visible={showSessions} transparent animationType="none" onRequestClose={() => setShowSessions(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={() => setShowSessions(false)} />
                    <Animated.View entering={SlideInLeft.duration(300)} exiting={SlideOutLeft.duration(250)} style={[styles.sidebar, { width: sidebarWidth, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', paddingTop: insets.top }]}>
                        <View style={styles.sidebarHeader}><Text style={[styles.sidebarTitle, { color: theme.text }]}>History</Text><TouchableOpacity onPress={() => setShowSessions(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity></View>
                        <TouchableOpacity style={[styles.newChatBtn, { backgroundColor: theme.primary + '15' }]} onPress={handleNewSessionAction}>
                            <Ionicons name="add" size={20} color={theme.primary} /><Text style={[styles.newChatText, { color: theme.primary }]}>Start New Chat</Text>
                        </TouchableOpacity>
                        <FlatList
                            data={sessions} keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={[styles.sessionItemContainer, currentSession?.id === item.id && { backgroundColor: theme.primary + '10' }]}>
                                    <TouchableOpacity style={styles.sessionItemMain} onPress={() => handleSelectSession(item)}>
                                        <Ionicons name={currentSession?.id === item.id ? "chatbubble" : "chatbubble-outline"} size={20} color={currentSession?.id === item.id ? theme.primary : theme.textTertiary} />
                                        <Text numberOfLines={1} style={[styles.sessionTitle, { color: currentSession?.id === item.id ? theme.primary : theme.text }]}>{item.title || 'Conversation'}</Text>
                                    </TouchableOpacity>
                                    <View style={styles.sessionActions}>
                                        <TouchableOpacity onPress={() => { setSessionToEdit(item); setEditTitle(item.title); setEditModalVisible(true); }} style={styles.actionBtn}><Ionicons name="pencil-outline" size={16} color={theme.textTertiary} /></TouchableOpacity>
                                        <TouchableOpacity onPress={() => { setSessionToEdit(item); setDeleteModalVisible(true); }} style={styles.actionBtn}><Ionicons name="trash-outline" size={16} color={theme.error[500]} /></TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    </Animated.View>
                </View>
            </Modal>

            {/* Rename Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
                <BlurView intensity={30} tint="dark" style={styles.customModalOverlay}>
                    <Animated.View entering={SlideInUp} style={[styles.customModalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                        <Text style={[styles.modalHeading, { color: theme.text }]}>Rename History</Text>
                        <View style={[styles.customInputWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }]}><TextInput style={[styles.customInput, { color: theme.text }]} value={editTitle} onChangeText={setEditTitle} autoFocus /></View>
                        <View style={styles.modalButtons}><TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}><Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={handleUpdateTitle}><Text style={styles.confirmBtnText}>Save</Text></TouchableOpacity></View>
                    </Animated.View>
                </BlurView>
            </Modal>

            {/* Delete Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
                <BlurView intensity={30} tint="dark" style={styles.customModalOverlay}>
                    <Animated.View entering={SlideInUp} style={[styles.customModalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                        <View style={styles.warningIconContainer}><Ionicons name="alert-circle" size={48} color={theme.error[500]} /></View>
                        <Text style={[styles.modalHeading, { color: theme.text, textAlign: 'center' }]}>Delete Chat?</Text>
                        <Text style={[styles.modalSubtext, { color: theme.textSecondary }]}>This will permanently delete this conversation history.</Text>
                        <View style={styles.modalButtons}><TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}><Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Back</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.error[500] }]} onPress={handleConfirmDelete}><Text style={styles.confirmBtnText}>Delete</Text></TouchableOpacity></View>
                    </Animated.View>
                </BlurView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', zIndex: 100 },
    headerContent: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    headerInfo: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: Fonts.bold },
    headerStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 12, fontFamily: Fonts.medium },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16 },
    messageRow: { flexDirection: 'row', marginBottom: 20, maxWidth: '85%' },
    assistantRow: { alignSelf: 'flex-start' },
    userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    assistantAvatarContainer: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginRight: 8, marginTop: 4, backgroundColor: '#f0f0f0' },
    aiIcon: { width: '100%', height: '100%' },
    bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    assistantBubble: { borderTopLeftRadius: 4 },
    userBubble: { borderTopRightRadius: 4 },
    messageText: { fontSize: 16, lineHeight: 22, fontFamily: Fonts.medium },
    messageImage: { width: width * 0.6, height: 200, borderRadius: 12, marginBottom: 8 },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', fontFamily: Fonts.regular },
    footerSpace: { minHeight: 40 },
    emptyRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
    largeAiIcon: { width: 140, height: 140, marginBottom: 24, borderRadius: 70 },
    emptyTitle: { fontSize: 26, fontFamily: Fonts.bold, marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 16, fontFamily: Fonts.regular, textAlign: 'center', marginBottom: 40, opacity: 0.7 },
    iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    iconButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginHorizontal: 12, borderWidth: 1 },
    iconLabel: { fontSize: 12, fontFamily: Fonts.medium, textAlign: 'center' },
    thinkingWrapper: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4 },
    dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 2 },
    inputContainer: { padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, paddingVertical: 4, paddingLeft: 8, paddingRight: 4, borderWidth: 1 },
    attachBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    inputInput: { flex: 1, maxHeight: 120, fontSize: 16, paddingVertical: 10, fontFamily: Fonts.regular },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    imagePreviewContainer: { paddingHorizontal: 16, paddingBottom: 8 },
    previewWrapper: { width: 80, height: 80, borderRadius: 12, overflow: 'visible', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    previewThumbnail: { width: '100%', height: '100%', borderRadius: 12 },
    removeImageBtn: { position: 'absolute', top: -10, right: -10, zIndex: 10 },
    modalOverlay: { flex: 1, flexDirection: 'row' },
    modalBackdrop: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebar: { height: '100%' },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    sidebarTitle: { fontSize: 22, fontFamily: Fonts.bold },
    newChatBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 14, borderRadius: 14, marginBottom: 16 },
    newChatText: { marginLeft: 10, fontFamily: Fonts.bold, fontSize: 16 },
    sessionItemContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: 14, marginBottom: 6, gap: 8 },
    sessionItemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minWidth: 0 },
    sessionTitle: { marginLeft: 12, fontSize: 15, fontFamily: Fonts.medium, flex: 1, minWidth: 0 },
    sessionActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
    actionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
    customModalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    customModalContent: { width: '100%', maxWidth: 340, padding: 24, borderRadius: 24 },
    modalHeading: { fontSize: 20, fontFamily: Fonts.bold, marginBottom: 16 },
    modalSubtext: { fontSize: 15, fontFamily: Fonts.regular, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    customInputWrapper: { borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
    customInput: { height: 50, fontSize: 16, fontFamily: Fonts.regular },
    modalButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, marginRight: 8 },
    cancelBtnText: { fontSize: 15, fontFamily: Fonts.bold },
    confirmBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonts.bold },
    warningIconContainer: { alignItems: 'center', marginBottom: 12 },
});
