import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmojiKeyboard } from 'rn-emoji-keyboard';

// Extracted Header Component
const ChatHeader = React.memo(({
    headerInfo,
    insets,
    theme,
    isDark,
    router,
    id,
    textAlign
}: {
    headerInfo: any,
    insets: any,
    theme: any,
    isDark: boolean,
    router: any,
    id: string,
    textAlign: 'left' | 'right'
}) => (
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
                            source={{ uri: headerInfo.avatar || 'https://ui-avatars.com/api/?name=User' }}
                            style={[styles.headerAvatar, { borderColor: theme.border }]}
                            contentFit="cover"
                            transition={200}
                        />
                        <View style={[styles.onlineDot, { borderColor: theme.background }]} />
                    </View>
                    <View>
                        <Text style={[styles.headerName, { color: theme.text }]}>{headerInfo.name}</Text>
                        <View style={[styles.roleTag, { backgroundColor: isDark ? 'rgba(9, 125, 70, 0.2)' : 'rgba(9, 125, 70, 0.1)' }]}>
                            <Text style={[styles.roleText, { color: theme.primary }]}>{headerInfo.role}</Text>
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
));

export default function ChatDetailScreen() {
    const params = useLocalSearchParams<{ id: string, name?: string, avatar?: string, role?: string, type?: string }>();
    const { id, name: initialName, avatar: initialAvatar, role: initialRole, type: initialType } = params;
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const queryClient = useQueryClient();
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const isFocused = useIsFocused();
    const lastTypingReport = useRef<number>(0);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    // Fetch Conversation Details
    const { data: conversation } = useQuery({
        queryKey: ['conversation', id],
        queryFn: () => ChatService.getConversationDetails(id!),
        enabled: !!id,
    });

    // Initial Fetch for Message History
    const { data: messagesData, isLoading } = useQuery({
        queryKey: ['messages', id],
        queryFn: () => ChatService.getMessages(id!, { limit: 50 }),
        enabled: !!id,
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (messagesData?.messages) {
            const initialMessages = [...messagesData.messages].reverse();
            setMessages(initialMessages);
        }
    }, [messagesData]);

    // Long Polling Logic
    useEffect(() => {
        if (!id || !isFocused) return;

        let isMounted = true;
        const poll = async () => {
            // Use ref to get the absolute latest messages
            const currentMessages = messagesRef.current;
            const lastMessageId = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].id : undefined;

            if (!lastMessageId) {
                // If no messages yet, wait a bit and check again (or wait for messagesData)
                if (isMounted) setTimeout(poll, 1000);
                return;
            }

            try {
                const res = await ChatService.pollMessages(id, lastMessageId);
                if (isMounted && res.messages && res.messages.length > 0) {
                    setMessages(prev => {
                        const newMsgs = [...res.messages].reverse();
                        const filteredNewMsgs = newMsgs.filter(nm => !prev.some(pm => pm.id === nm.id));
                        return [...prev, ...filteredNewMsgs];
                    });

                    // Mark as read if we received new messages while focused
                    ChatService.markAsRead(id).catch(() => { });
                }
                // Immediately poll again
                if (isMounted) poll();
            } catch (error) {
                // On error (e.g. timeout), retry
                if (isMounted) {
                    setTimeout(poll, 1000);
                }
            }
        };

        poll();
        return () => { isMounted = false; };
    }, [id, isFocused]); // Re-run if messages array was empty and now has data

    // Mark as Read on Mount & Optimistic Update
    useEffect(() => {
        if (id && isFocused) {
            // 1. Call API
            ChatService.markAsRead(id).catch(err => console.error('Failed to mark as read', err));

            // 2. Optimistically update conversations list cache
            queryClient.setQueriesData({ queryKey: ['conversations'] }, (old: any) => {
                if (!old?.conversations) return old;
                return {
                    ...old,
                    conversations: old.conversations.map((c: any) =>
                        c.id === id ? { ...c, unread_count: 0 } : c
                    )
                };
            });
        }
    }, [id, isFocused, queryClient]);

    // Typing Polling (Listening) - Using useQuery for better lifecycle management
    const { data: typingData } = useQuery({
        queryKey: ['typing', id],
        queryFn: () => ChatService.getTypingUsers(id!),
        refetchInterval: isFocused ? 5000 : false, // Poll every 5s only when focused
        enabled: !!id && isFocused,
    });

    const currentTypingUsers = typingData?.typing_users || [];



    // Typing Reporting (I am typing)
    useEffect(() => {
        if (inputText && id && isFocused) {
            const now = Date.now();
            if (now - lastTypingReport.current > 2000) {
                lastTypingReport.current = now;
                ChatService.setTypingStatus(id).catch(() => { });
            }
        }
    }, [inputText, id, isFocused]);

    const getTypingMessage = () => {
        const othersTyping = currentTypingUsers.filter(u => u.user_id !== currentUser?.id);
        if (othersTyping.length === 0) return null;

        if (othersTyping.length === 1) {
            const member = conversation?.members?.find(m => m.user_id === othersTyping[0].user_id);
            return `${member?.user_name || 'Someone'} is typing...`;
        }

        return `${othersTyping.length} people are typing...`;
    };

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: (data: any) => ChatService.sendMessage(id!, data),
        onSuccess: (newMessage) => {
            setInputText('');
            setMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
            queryClient.invalidateQueries({ queryKey: ['messages', id] });
        },
    });

    const uploadAndSendMessage = async (uri: string, type: 'image' | 'voice', duration: number = 0) => {
        setUploadingMedia(true);
        try {
            console.log(`[ChatDetail] Starting upload for ${type}. URI:`, uri, 'Duration:', duration);
            const mediaUrl = await ChatService.uploadMedia(uri, type);
            console.log(`[ChatDetail] Upload success. Media URL:`, mediaUrl);

            const payload = {
                type,
                content: mediaUrl,
                media_metadata: type === 'voice' ? { duration } : undefined
            };
            console.log(`[ChatDetail] Sending message with payload:`, JSON.stringify(payload, null, 2));

            sendMessageMutation.mutate(payload);
        } catch (error: any) {
            console.error(`[ChatDetail] Upload/Send Error:`, error);
            Alert.alert('Process Failed', `Error: ${error.message}\n\nPlease check console for full data.`);
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleSend = async () => {
        if ((!inputText.trim() && selectedImages.length === 0) || sendMessageMutation.isPending || uploadingMedia) return;

        if (selectedImages.length > 0) {
            for (const uri of selectedImages) {
                await uploadAndSendMessage(uri, 'image');
            }
            setSelectedImages([]);
        }

        if (inputText.trim()) {
            sendMessageMutation.mutate({
                type: 'text',
                content: inputText.trim(),
            });
        }
    };

    // Media Logic
    const handlePickImage = async () => {
        setIsAttachmentMenuVisible(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const uris = result.assets.map(a => a.uri);
            setSelectedImages(prev => [...prev, ...uris]);
        }
    };

    const handleTakePhoto = async () => {
        setIsAttachmentMenuVisible(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Required", "Camera access is needed to take photos");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            uploadAndSendMessage(result.assets[0].uri, 'image');
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Microphone access is needed to record voice messages");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setIsRecording(false);
        try {
            const status = await recording.getStatusAsync();
            const duration = Math.floor((status as any).durationMillis / 1000);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            console.log(`[ChatDetail] Recording stopped. Status:`, status, 'Final URI:', uri);
            setRecording(null);
            if (uri) {
                uploadAndSendMessage(uri, 'voice', duration);
            }
        } catch (err) {
            console.error('[ChatDetail] Failed to stop recording', err);
        }
    };

    const AttachmentMenu = () => {
        if (!isAttachmentMenuVisible) return null;
        return (
            <View style={[styles.attachmentMenu, { backgroundColor: theme.surface, borderColor: theme.divider, borderWidth: 1 }]}>
                <TouchableOpacity style={styles.attachmentItem} onPress={handlePickImage} disabled={uploadingMedia}>
                    <View style={[styles.attachmentIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EBF4FF' }]}>
                        <Ionicons name="images" size={24} color="#3B82F6" />
                    </View>
                    <Text style={[styles.attachmentText, { color: theme.text }]}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.attachmentItem} onPress={handleTakePhoto} disabled={uploadingMedia}>
                    <View style={[styles.attachmentIcon, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFF5F5' }]}>
                        <Ionicons name="camera" size={24} color="#EF4444" />
                    </View>
                    <Text style={[styles.attachmentText, { color: theme.text }]}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.attachmentItem} onPress={() => { setIsAttachmentMenuVisible(false); startRecording(); }} disabled={uploadingMedia}>
                    <View style={[styles.attachmentIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#F0FFF4' }]}>
                        <Ionicons name="mic" size={24} color="#10B981" />
                    </View>
                    <Text style={[styles.attachmentText, { color: theme.text }]}>Voice</Text>
                </TouchableOpacity>
            </View>
        );
    };



    const getHeaderInfo = () => {
        // Prefer params if available (avoid flash of mock data)
        const paramInfo = {
            name: initialName,
            avatar: initialAvatar,
            role: initialRole,
            type: initialType
        };

        if (conversation) {
            if (conversation.type === 'DIRECT') {
                const otherMember = conversation.members?.find(m => m.user_id !== currentUser?.id);
                return {
                    name: otherMember?.user_name || 'User',
                    avatar: otherMember?.user_image || 'https://ui-avatars.com/api/?name=User',
                    role: otherMember?.user_role || 'STUDENT',
                };
            }
            return {
                name: conversation.name || 'Group Chat',
                avatar: 'https://ui-avatars.com/api/?name=' + (conversation.name || 'G'),
                role: 'GROUP',
            };
        }

        // Fallback to params if conversation not loaded yet
        if (paramInfo.name) {
            return {
                name: paramInfo.name,
                avatar: paramInfo.avatar || 'https://ui-avatars.com/api/?name=User',
                role: paramInfo.role || 'STUDENT'
            };
        }

        return { name: '...', avatar: undefined, role: '' };
    };

    const headerInfo = getHeaderInfo();



    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Image
                source={{ uri: isDark ? undefined : 'https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg' }}
                style={[StyleSheet.absoluteFill, { opacity: 0.05 }]}
                contentFit="cover"
            />
            <Stack.Screen options={{ headerShown: false }} />

                <ChatHeader
                    headerInfo={headerInfo}
                    insets={insets}
                    theme={theme}
                    isDark={isDark}
                    router={router}
                    id={id!}
                    textAlign={textAlign}
                />

                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : (
                        <ScrollView
                            ref={scrollViewRef}
                            contentContainerStyle={[styles.messagesList, { paddingBottom: 20 }]}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        >
                            <View style={styles.dateDivider}>
                                <View style={[styles.dateBadge, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>TODAY</Text>
                                </View>
                            </View>

                            {messages.map((msg: Message) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    theme={theme}
                                    isDark={isDark}
                                    currentUserId={currentUser?.id}
                                    onImagePress={setViewerImage}
                                />
                            ))}
                        </ScrollView>
                    )}

                    {getTypingMessage() && (
                        <View style={styles.typingIndicatorContainer}>
                            <AnimatedTypingDots theme={theme} />
                            <Text style={[styles.typingIndicatorText, { color: theme.textSecondary }]}>{getTypingMessage()}</Text>
                        </View>
                    )}

                    {selectedImages.length > 0 && (
                        <View style={[styles.thumbnailListContainer, { backgroundColor: theme.surfaceVariant }]}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 8, gap: 8 }}>
                                {selectedImages.map((uri, index) => (
                                    <View key={index} style={styles.thumbnailWrapper}>
                                        <Image source={{ uri }} style={styles.thumbnail} />
                                        <TouchableOpacity
                                            style={styles.removeThumbnail}
                                            onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                    <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.divider, paddingBottom: insets.bottom || 20 }]}>
                        <AttachmentMenu />

                        {isRecording ? (
                            <View style={styles.recordingContainer}>
                                <View style={styles.recordingIndicator}>
                                    <VoiceWaveform theme={theme} />
                                    <Text style={[styles.recordingText, { color: theme.text }]}>Recording...</Text>
                                </View>
                                <TouchableOpacity onPress={stopRecording} style={[styles.stopButton, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="stop" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.attachButton}
                                    onPress={() => setIsAttachmentMenuVisible(!isAttachmentMenuVisible)}
                                    disabled={uploadingMedia}
                                >
                                    <Ionicons
                                        name={isAttachmentMenuVisible ? "close-circle" : "add-circle-outline"}
                                        size={28}
                                        color={isAttachmentMenuVisible ? theme.primary : theme.icon}
                                    />
                                </TouchableOpacity>

                                <View style={[styles.inputFieldContainer, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, textAlign }]}
                                        placeholder="Type a message..."
                                        placeholderTextColor={theme.textTertiary}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline
                                        editable={!sendMessageMutation.isPending && !uploadingMedia}
                                    />
                                    <TouchableOpacity
                                        style={[styles.smileyButton, isEmojiOpen && { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EBF4FF', borderRadius: 20 }]}
                                        onPress={() => setIsEmojiOpen(!isEmojiOpen)}
                                    >
                                        <Ionicons name={isEmojiOpen ? "happy" : "happy-outline"} size={24} color={isEmojiOpen ? theme.primary : theme.icon} />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: theme.primary, opacity: (sendMessageMutation.isPending || uploadingMedia) ? 0.7 : 1 }]}
                                    onPress={handleSend}
                                    disabled={sendMessageMutation.isPending || uploadingMedia}
                                >
                                    {sendMessageMutation.isPending || uploadingMedia ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>

                {/* Image Viewer Modal */}
                <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
                    <View style={[styles.viewerContainer, { backgroundColor: 'rgba(0,0,0,0.95)' }]}>
                        <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerImage(null)}>
                            <Ionicons name="close" size={32} color="#FFFFFF" />
                        </TouchableOpacity>
                        {viewerImage && (
                            <Image
                                source={{ uri: viewerImage }}
                                style={styles.viewerImage}
                                contentFit="contain"
                            />
                        )}
                    </View>
                </Modal>
                {isEmojiOpen && (
                    <EmojiKeyboard
                        onEmojiSelected={(emoji) => setInputText(prev => prev + emoji.emoji)}
                        theme={{
                            container: theme.surface,
                            header: theme.surface,
                            category: {
                                icon: theme.icon,
                                iconActive: theme.primary,
                                container: theme.surface,
                                containerActive: theme.surfaceVariant
                            }
                        }}
                    />
                )}
            </View>
            );
}

            // Sub-components
            const AnimatedTypingDots = ({theme}: {theme: any }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
            const dot2 = useRef(new Animated.Value(0)).current;
            const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnimation = (value: Animated.Value, delay: number) => {
            return Animated.loop(
            Animated.sequence([
            Animated.delay(delay),
            Animated.timing(value, {
                toValue: 1,
            duration: 400,
            useNativeDriver: true,
                    }),
            Animated.timing(value, {
                toValue: 0,
            duration: 400,
            useNativeDriver: true,
                    }),
            ])
            );
        };

            const animations = [
            createAnimation(dot1, 0),
            createAnimation(dot2, 200),
            createAnimation(dot3, 400),
            ];

        animations.forEach(anim => anim.start());
        return () => animations.forEach(anim => anim.stop());
    }, []);

    const dotStyle = (value: Animated.Value) => ({
                transform: [{
                translateY: value.interpolate({
                inputRange: [0, 1],
            outputRange: [0, -4],
            })
        }],
            opacity: value.interpolate({
                inputRange: [0, 1],
            outputRange: [0.3, 1],
        })
    });

            return (
            <View style={styles.typingDots}>
                <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }, dotStyle(dot1)]} />
                <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }, dotStyle(dot2)]} />
                <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }, dotStyle(dot3)]} />
            </View>
            );
};

            const VoiceWaveform = ({theme}: {theme: any }) => {
    const bars = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

    useEffect(() => {
        const animations = bars.map((bar, i) => {
            return Animated.loop(
            Animated.sequence([
            Animated.delay(i * 100),
            Animated.timing(bar, {
                toValue: 1,
            duration: 300,
            useNativeDriver: false, // height doesn't support native driver
                    }),
            Animated.timing(bar, {
                toValue: 0,
            duration: 300,
            useNativeDriver: false,
                    }),
            ])
            );
        });

        animations.forEach(anim => anim.start());
        return () => animations.forEach(anim => anim.stop());
    }, []);

            return (
            <View style={styles.waveformAnimation}>
                {bars.map((bar, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.waveformBarSmall,
                            {
                                backgroundColor: '#EF4444',
                                height: bar.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [4, 16],
                                })
                            }
                        ]}
                    />
                ))}
            </View>
            );
};
            const MessageBubble = ({message, theme, isDark, currentUserId, onImagePress}: {message: Message, theme: any, isDark: boolean, currentUserId?: string, onImagePress?: (uri: string) => void }) => {
    const isSender = message.sender_id === currentUserId;
            const [isPlaying, setIsPlaying] = useState(false);
            const [sound, setSound] = useState<Audio.Sound | null>(null);
            const [progress, setProgress] = useState(0);
            const [duration, setDuration] = useState((message.media_metadata?.duration || 0) * 1000);
            const [waveformWidth, setWaveformWidth] = useState(0);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const handlePlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
                setDuration(status.durationMillis || ((message.media_metadata?.duration || 0) * 1000));
            // Only update progress from player if we are NOT dragging
            if (!isDragging.current) {
                setProgress(status.positionMillis);
            }
            if (status.didJustFinish) {
                setIsPlaying(false);
            sound?.setPositionAsync(0);
            setProgress(0);
            }
        }
    };

    const playAudio = async () => {
        try {
            if (sound) {
                if (isPlaying) {
                await sound.pauseAsync();
            setIsPlaying(false);
                } else {
                await sound.playAsync();
            setIsPlaying(true);
                }
            return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            });

            const {sound: newSound } = await Audio.Sound.createAsync(
            {uri: message.content },
            {shouldPlay: true },
            handlePlaybackStatusUpdate
            );
            setSound(newSound);
            setIsPlaying(true);
        } catch (error) {
                console.error('Error playing sound', error);
        }
    };

            const isDragging = useRef(false);
            const startDragProgress = useRef(0);

            const panResponder = useRef(
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: () => true,

            onPanResponderGrant: () => {
                isDragging.current = true;
            startDragProgress.current = progress; // Store where we started
            },

            onPanResponderMove: (evt, gestureState) => {
                if (!waveformWidth || !duration) return;

            // Calculate change in seconds based on pixel movement
            const percentChange = gestureState.dx / waveformWidth;
            const timeChange = percentChange * duration;

            // New position = start + change
            let newPos = startDragProgress.current + timeChange;

            // Clamp
            newPos = Math.max(0, Math.min(newPos, duration));

            // Update UI immediately
            setProgress(newPos);
            },

            onPanResponderRelease: async () => {
                // Commit the seek
                if (sound) {
                await sound.setPositionAsync(progress);
            if (!isPlaying) {
                await sound.playAsync();
            setIsPlaying(true);
                    }
                }
            isDragging.current = false;
            },

            onPanResponderTerminationRequest: () => false,
        })
            ).current;

    // We don't use handleSeek directly in PanResponder anymore
    const handleSeekTap = async (event: any) => {
        if (!waveformWidth || !duration) return;
            const x = event.nativeEvent.locationX;
            const seekPosition = (x / waveformWidth) * duration;

            if (sound) {
                await sound.setPositionAsync(seekPosition);
            setProgress(seekPosition);
            if (!isPlaying) {
                await sound.playAsync();
            setIsPlaying(true);
            }
        }
    };

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
        } else if (message.type === 'voice') {
            const displayDuration = duration > 0 ? duration / 1000 : (message.media_metadata?.duration || 0);
            const currentSeconds = Math.floor(progress / 1000);
            const totalSeconds = Math.floor(displayDuration);
            const progressRatio = duration > 0 ? progress / duration : 0;

            return (
            <View style={styles.audioContainer}>
                <View style={styles.audioTopRow}>
                    <TouchableOpacity onPress={playAudio} style={styles.playButton}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View
                        style={[
                            styles.waveformContainer,
                            { flex: 1, height: 32, justifyContent: 'center', maxWidth: 160, overflow: 'hidden' }
                        ]}
                        onLayout={(e) => setWaveformWidth(e.nativeEvent.layout.width)}
                        {...panResponder.panHandlers}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={handleSeekTap}
                            style={{ flexDirection: 'row', alignItems: 'center', height: '100%', width: '100%', justifyContent: 'space-between' }}
                        >
                            {[...Array(20)].map((_, i) => { // Reduced to 20 to fit better
                                const barProgress = i / 20;
                                const isFilled = barProgress < progressRatio;
                                const heightPattern = [12, 20, 32, 16, 24, 28, 12, 20, 32, 16, 24, 8, 14, 22, 18, 10, 26, 14, 18, 10];
                                const barHeight = heightPattern[i % heightPattern.length];

                                return (
                                    <View
                                        key={i}
                                        style={[
                                            styles.waveformBar,
                                            {
                                                height: barHeight,
                                                width: 3,
                                                backgroundColor: isFilled
                                                    ? (isSender ? '#FFFFFF' : theme.primary)
                                                    : (isSender ? 'rgba(255,255,255,0.4)' : theme.icon),
                                                opacity: 1,
                                                borderRadius: 1.5,
                                            }
                                        ]}
                                    />
                                );
                            })}
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.audioDuration, {
                    color: isSender ? 'rgba(255,255,255,0.7)' : theme.textTertiary,
                    marginTop: 4,
                    alignSelf: 'flex-start',
                    marginLeft: 40 // Align with waveform start
                }]}>
                    {`${Math.floor(currentSeconds / 60)}:${String(currentSeconds % 60).padStart(2, '0')} / ${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`}
                </Text>
            </View>
            );
        } else if (message.type === 'image') {
            return (
            <TouchableOpacity onPress={() => onImagePress?.(message.content)} style={styles.imageMessageContainer}>
                <Image
                    source={{ uri: message.content }}
                    style={styles.messageImage}
                    contentFit="cover"
                    transition={200}
                />
            </TouchableOpacity>
            );
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

            return (
            <View style={[
                styles.messageRow,
                isSender ? styles.messageRowSender : styles.messageRowReceiver
            ]}>
                {!isSender && (
                    <Image
                        source={{ uri: message.sender_image || undefined }}
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
                            {formatTime(message.created_at)}
                        </Text>
                        {isSender && (
                            <Ionicons name="checkmark-done-outline" size={16} color={theme.primary} />
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
            shadowOffset: {width: 0, height: 1 },
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
                minWidth: 150,
    },
            audioTopRow: {
                flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
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
            shadowOffset: {width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
    },
            attachmentMenu: {
                position: 'absolute',
            bottom: 60,
            left: 10,
            width: 150,
            flexDirection: 'column',
            padding: 12,
            gap: 12,
            borderRadius: 16,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            zIndex: 100,
    },
            attachmentItem: {
                flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
    },
            attachmentIcon: {
                width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
    },
            attachmentText: {
                fontSize: 12,
            fontFamily: Fonts.medium,
    },
            recordingContainer: {
                flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
    },
            recordingIndicator: {
                flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
    },
            recordingDot: {
                width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#EF4444',
    },
            recordingText: {
                fontSize: 16,
            fontFamily: Fonts.medium,
    },
            stopButton: {
                width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
    },
            typingIndicatorContainer: {
                flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 8,
            gap: 8,
    },
            typingDots: {
                flexDirection: 'row',
            gap: 3,
    },
            typingDot: {
                width: 4,
            height: 4,
            borderRadius: 2,
    },
            typingIndicatorText: {
                fontSize: 12,
            fontFamily: Fonts.medium,
            fontStyle: 'italic',
    },
            waveformAnimation: {
                flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            marginRight: 8,
    },
            waveformBarSmall: {
                width: 3,
            borderRadius: 1.5,
    },
            viewerContainer: {
                flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
    },
            viewerClose: {
                position: 'absolute',
            top: 40,
            right: 20,
            zIndex: 10,
            padding: 8,
    },
            viewerImage: {
                width: '100%',
            height: '80%',
    },
            thumbnailListContainer: {
                paddingHorizontal: 8,
    },
            thumbnailWrapper: {
                position: 'relative',
    },
            thumbnail: {
                width: 60,
            height: 60,
            borderRadius: 8,
    },
            removeThumbnail: {
                position: 'absolute',
            top: -6,
            right: -6,
            backgroundColor: 'white',
            borderRadius: 10,
    },
});
