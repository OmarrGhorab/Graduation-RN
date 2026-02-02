import CustomConfirmModal from '@/components/CustomConfirmModal';
import { MessageActionSheet } from '@/components/MessageActionSheet';
import { useToast } from '@/components/toast';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, KeyboardAvoidingView, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
                            key={headerInfo.avatar}
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
                <TouchableOpacity onPress={() => router.push(`/group-info/${id}`)}>
                    <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>
        </View>
    </BlurView>
));

export default function ChatDetailScreen() {
    const params = useLocalSearchParams<{
        id: string,
        name?: string,
        avatar?: string,
        role?: string,
        type?: string,
        scrollTo?: string
    }>();
    const { id, name: initialName, avatar: initialAvatar, role: initialRole, type: initialType, scrollTo } = params;

    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const queryClient = useQueryClient();
    const [inputText, setInputText] = useState('');
    // const scrollViewRef = useRef<ScrollView>(null);
    const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const toast = useToast();
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
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

    // Infinite Query for Messages
    const {
        data: messagesData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['messages', id],
        queryFn: ({ pageParam = 0 }) => ChatService.getMessages(id!, { limit: 20, offset: pageParam as number }),
        initialPageParam: 0,
        getNextPageParam: (lastPage: any, allPages) => {
            // Defensive check for potentially undefined response or pages array
            const messages = Array.isArray(lastPage) ? lastPage : lastPage?.messages;
            if (!messages || messages.length < 20) return undefined;
            return (allPages?.length || 0) * 20;
        },
        enabled: !!id,
    });

    // Flatten messages from pages
    const messages = React.useMemo(() => {
        if (!messagesData?.pages) return [];

        const allMessages: Message[] = [];
        const seenIds = new Set<string>();

        messagesData.pages.forEach(page => {
            const pageObj = page as any;
            const msgs = Array.isArray(page) ? page : pageObj?.messages;
            if (Array.isArray(msgs)) {
                msgs.forEach((m: Message) => {
                    if (m && m.id && !seenIds.has(m.id)) {
                        seenIds.add(m.id);
                        allMessages.push(m);
                    }
                });
            }
        });

        return allMessages;
    }, [messagesData?.pages]);

    // Pinned Messages Query
    const { data: pinnedData, refetch: refetchPinned } = useQuery({
        queryKey: ['pinned-messages', id],
        queryFn: () => ChatService.getPinnedMessages(id!),
        enabled: !!id,
    });
    const pinnedMessages = pinnedData?.pinned_messages || [];



    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    const [permissions, setPermissions] = useState({ canDelete: false, canPin: false, canKick: false });
    const [isKickModalVisible, setIsKickModalVisible] = useState(false);

    // Determine Permissions
    const checkPermissions = (message: Message) => {
        const user = currentUser;
        const member = conversation?.members?.find(m => m.user_id === user?.id);
        const globalRole = user?.role;

        // Delete: Only own messages (for now)
        const canDelete = message.sender_id === user?.id;

        // Pin: Only Owner/Admin in Group (Ignore global roles per doc update)
        const canPin = member?.member_role === 'OWNER' || member?.member_role === 'ADMIN';

        // Kick: Strictly local roles. Owner can kick anyone, Admin can kick Members.
        let canKick = false;
        if (message.sender_id !== user?.id && member) {
            const targetMember = conversation?.members?.find(m => m.user_id === message.sender_id);
            const targetRole = targetMember?.member_role;

            if (member.member_role === 'OWNER') canKick = true;
            else if (member.member_role === 'ADMIN') canKick = targetRole === 'MEMBER';
        }

        return { canDelete, canPin, canKick };
    };

    const handleMessageLongPress = (message: Message) => {
        const perms = checkPermissions(message);
        setPermissions(perms);
        setSelectedMessage(message);
        setIsActionSheetVisible(true);
    };

    const closeActionSheet = () => {
        setIsActionSheetVisible(false);
        setSelectedMessage(null);
    };

    const handleReply = () => {
        if (selectedMessage) {
            setReplyToMessage(selectedMessage);
        }
        closeActionSheet();
    };

    const scrollToMessage = (messageId: string) => {
        const index = messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
            flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5
            });
        }
    };

    const handlePin = async () => {
        if (!selectedMessage) return;
        const isCurrentlyPinned = pinnedMessages.some(m => m.message_id === selectedMessage.id);

        console.log(`[ChatDetail] Attempting to ${isCurrentlyPinned ? 'unpin' : 'pin'} message:`, {
            conversationId: id,
            messageId: selectedMessage.id
        });

        try {
            if (isCurrentlyPinned) {
                await ChatService.unpinMessage(id!, selectedMessage.id);
                toast.success('Unpinned', 'Message unpinned successfully');
            } else {
                await ChatService.pinMessage(id!, selectedMessage.id);
                toast.success('Pinned', 'Message pinned successfully');
            }
            refetchPinned();
        } catch (error: any) {
            console.error(`[ChatDetail] Pin/Unpin failed:`, error);
            toast.error('Error', error.response?.data?.message || error.message);
        }
        closeActionSheet();
    };

    const handleCopy = async () => {
        if (selectedMessage?.content) {
            await Clipboard.setStringAsync(selectedMessage.content);
            toast.info('Copied', 'Text copied to clipboard');
        }
        closeActionSheet();
    };

    const handleKick = () => {
        if (!selectedMessage) return;
        setIsKickModalVisible(true);
        closeActionSheet();
    };

    const confirmKick = async () => {
        if (!selectedMessage) return;
        const userToKickName = selectedMessage.sender_name || 'this user';
        try {
            await ChatService.removeMember(id!, selectedMessage.sender_id);
            toast.success('Removed', `${userToKickName} has been removed.`);
            queryClient.invalidateQueries({ queryKey: ['members', id] });
        } catch (error: any) {
            toast.error('Error', 'Failed to remove user');
        }
        setIsKickModalVisible(false);
    };

    const handleDelete = () => {
        if (!selectedMessage) return;
        setMessageToDelete(selectedMessage);
        setIsDeleteModalVisible(true);
        closeActionSheet();
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;
        try {
            await ChatService.deleteMessage(id!, messageToDelete.id);
            // Optimistic update
            queryClient.setQueryData(['messages', id], (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => {
                        const msgs = Array.isArray(page) ? page : page.messages;
                        if (!Array.isArray(msgs)) return page;
                        const filtered = msgs.filter((m: any) => m.id !== messageToDelete.id);
                        return Array.isArray(page) ? filtered : { ...page, messages: filtered };
                    })
                };
            });
            toast.success('Deleted', 'Message deleted successfully');
        } catch (error: any) {
            console.error('[ChatDetail] Delete failed:', error);
            toast.error('Error', 'Failed to delete message');
        }
        setMessageToDelete(null);
    };



    // Consolidated Focus and Scroll logic
    useFocusEffect(
        React.useCallback(() => {
            if (id) {
                console.log('[ChatDetail] Focused. Refreshing all data for:', id);

                // Invalidate and refetch everything to ensure UI is fresh (especially after group info changes)
                queryClient.invalidateQueries({ queryKey: ['conversation', id] });
                queryClient.invalidateQueries({ queryKey: ['messages', id] });
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                queryClient.invalidateQueries({ queryKey: ['pinned-messages', id] });
                queryClient.invalidateQueries({ queryKey: ['members', id] });

                // Mark as read
                ChatService.markAsRead(id).catch(err => console.error('Failed to mark as read', err));

                // Optimistically reset unread count
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
        }, [id, queryClient])
    );

    useEffect(() => {
        if (scrollTo && messages.length > 0) {
            // Give some time for layouts to settle and messages to render
            const timer = setTimeout(() => {
                scrollToMessage(scrollTo);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [scrollTo, messages.length]);

    /*
    // Old useEffect for markAsRead (Removed in favor of useFocusEffect)
    useEffect(() => { ... }, [id, isFocused, queryClient]);
    */

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

    // Mark as Read when new messages arrive and screen is focused
    useEffect(() => {
        if (isFocused && id && messages.length > 0) {
            // We assume that if the user is focused and messages update, they read them.
            // This covers the "User B reads -> User B's count = 0" case dynamically.
            ChatService.markAsRead(id).catch(err => console.error('[ChatDetail] Failed to mark as read on update', err));
        }
    }, [messages, id, isFocused]);

    const getTypingMessage = () => {
        const latestMessageSenderId = messages.length > 0 ? messages[0].sender_id : null;
        const othersTyping = currentTypingUsers.filter(u =>
            u.user_id !== currentUser?.id &&
            u.user_id !== latestMessageSenderId
        );

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
            // Optimistically update infinite query cache (Messages)
            queryClient.setQueryData(['messages', id], (old: any) => {
                if (!old) return old;

                // Infinite Query Structure { pages: [ [Message, ...], [Message, ...] ] }
                if (old.pages) {
                    const newPages = [...old.pages];
                    if (newPages.length > 0) {
                        let targetPage = newPages[0];
                        let isArray = Array.isArray(targetPage);
                        let messages = isArray ? targetPage : targetPage.messages;

                        // Check duplicate
                        if (messages?.some((m: any) => m.id === newMessage.id)) return old;

                        // Add to beginning
                        const updatedMessages = [newMessage, ...(messages || [])];

                        if (isArray) {
                            newPages[0] = updatedMessages;
                        } else {
                            newPages[0] = { ...targetPage, messages: updatedMessages };
                        }

                        return { ...old, pages: newPages };
                    }
                }
                return old;
            });

            // Optimistically update conversations list cache (Last Message Preview)
            queryClient.setQueryData(['conversations'], (old: any) => {
                if (!old?.conversations) return old;

                let updatedConversations = old.conversations.map((c: any) => {
                    if (c.id === id) {
                        return {
                            ...c,
                            last_message: {
                                ...newMessage,
                                sent_at: new Date().toISOString()
                            },
                            updated_at: new Date().toISOString()
                        };
                    }
                    return c;
                });

                // Move updated conversation to top
                updatedConversations.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

                return { ...old, conversations: updatedConversations };
            });

            // Optimistically update chat-media query cache
            const isMedia = ['image', 'voice', 'video', 'file'].includes(newMessage.type) ||
                newMessage.content.includes('res.cloudinary.com');
            const isLink = newMessage.content.includes('http') && !newMessage.content.includes('res.cloudinary.com');

            if (isMedia || isLink) {
                queryClient.setQueryData(['chat-media', id], (oldMedia: any) => {
                    if (!oldMedia || !oldMedia.messages) return oldMedia;
                    if (oldMedia.messages.some((m: any) => m.id === newMessage.id)) return oldMedia;
                    return {
                        ...oldMedia,
                        messages: [newMessage, ...oldMedia.messages]
                    };
                });
            }
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
                media_metadata: type === 'voice' ? { duration } : undefined,
                reply_to_id: replyToMessage?.id
            };
            console.log(`[ChatDetail] Sending message with payload:`, JSON.stringify(payload, null, 2));

            sendMessageMutation.mutate(payload);
            setReplyToMessage(null);
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
                content: inputText.trim(),
                type: 'text',
                reply_to_id: replyToMessage?.id
            });
            setInputText('');
            setReplyToMessage(null);
            setIsEmojiOpen(false);
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

                const isInvalidName = (n?: string | null) => !n || (n.length > 30 && n.includes('-'));
                let displayName = 'User';

                if (!isInvalidName(conversation.name)) displayName = conversation.name!;
                else if (!isInvalidName(otherMember?.user_name)) displayName = otherMember!.user_name!;

                const displayImage = conversation.image_url || otherMember?.user_image || (displayName !== 'User' ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}` : undefined);

                return {
                    name: displayName,
                    avatar: displayImage,
                    role: otherMember?.user_role || 'STUDENT',
                };
            }
            const groupName = conversation.name || 'Group Chat';
            return {
                name: groupName,
                avatar: conversation.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}`,
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
                source={isDark ? undefined : { uri: 'https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg' }}
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

            {pinnedMessages.length > 0 && (
                <View style={[styles.pinnedBar, { backgroundColor: isDark ? 'rgba(9, 124, 70, 0.15)' : 'rgba(9, 124, 70, 0.05)', borderBottomColor: theme.divider }]}>
                    <TouchableOpacity
                        style={styles.pinnedContent}
                        onPress={() => scrollToMessage(pinnedMessages[0].message_id)}
                    >
                        <Image
                            source={{ uri: pinnedMessages[0].message?.sender_image || 'https://ui-avatars.com/api/?name=User' }}
                            style={styles.pinnedAvatar}
                        />
                        <View style={styles.pinnedTextContainer}>
                            <Text style={[styles.pinnedTitle, { color: theme.primary }]} numberOfLines={1}>
                                {pinnedMessages[0].message?.sender_name || 'User'}
                            </Text>
                            <View style={styles.pinnedSnippetContainer}>
                                {pinnedMessages[0].message?.type === 'image' ? (
                                    <View style={styles.mediaPreview}>
                                        <Ionicons name="image" size={14} color={theme.textSecondary} />
                                        <Text style={[styles.pinnedSnippet, { color: theme.textSecondary }]} numberOfLines={1}>Photo</Text>
                                    </View>
                                ) : pinnedMessages[0].message?.type === 'voice' ? (
                                    <View style={styles.mediaPreview}>
                                        <Ionicons name="mic" size={14} color={theme.textSecondary} />
                                        <Text style={[styles.pinnedSnippet, { color: theme.textSecondary }]} numberOfLines={1}>Voice Message</Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.pinnedSnippet, { color: theme.textSecondary }]} numberOfLines={1}>
                                        {pinnedMessages[0].message?.content}
                                    </Text>
                                )}
                            </View>
                        </View>
                        {pinnedMessages[0].message?.type === 'image' && pinnedMessages[0].message?.content && (
                            <Image
                                source={{ uri: pinnedMessages[0].message.content }}
                                style={styles.pinnedMediaThumbnail}
                                contentFit="cover"
                            />
                        )}
                        <Ionicons name="pin" size={16} color={theme.primary} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                    {pinnedMessages.length > 1 && (
                        <TouchableOpacity style={styles.pinnedCountContainer}>
                            <Text style={[styles.pinnedCount, { color: theme.textTertiary }]}>
                                +{pinnedMessages.length - 1}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <KeyboardAvoidingView
                style={[styles.keyboardView, pinnedMessages.length > 0 && { paddingTop: 0 }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={
                            ({ item, index }: { item: Message, index: number }) => {
                                // Find sender details from members list
                                const member = conversation?.members?.find(m => m.user_id === item.sender_id);

                                // Prioritize member name, then message sender name, avoiding UUIDs
                                let senderName = member?.user_name || item.sender_name || 'User';
                                if (senderName.includes('-') && senderName.length > 30) {
                                    // If top pick is UUID, try the fallback
                                    const fallback = item.sender_name;
                                    if (fallback && (!fallback.includes('-') || fallback.length <= 30)) {
                                        senderName = fallback;
                                    } else {
                                        senderName = 'User';
                                    }
                                }

                                // Special handling for current user
                                if (item.sender_id === currentUser?.id) {
                                    senderName = currentUser?.name || 'Me';
                                }

                                // Hide "User" if it's the generic placeholder, as per user request
                                if (senderName === 'User') {
                                    senderName = '';
                                }

                                const senderImage = member?.user_image || item.sender_image;

                                // Grouping Logic: Check if next message (visually below, so older) is from same sender
                                const nextMessage = messages[index + 1];
                                const isNewGroup = !nextMessage || nextMessage.sender_id !== item.sender_id || (new Date(item.created_at).getTime() - new Date(nextMessage.created_at).getTime() > 60000 * 5); // 5 min gap

                                return (
                                    <MessageBubble
                                        message={item}
                                        theme={theme}
                                        isDark={isDark}
                                        currentUserId={currentUser?.id}
                                        onImagePress={setViewerImage}
                                        senderName={senderName}
                                        senderImage={senderImage}
                                        showSenderInfo={isNewGroup}
                                        onLongPress={() => handleMessageLongPress(item)}
                                        onReplyPress={scrollToMessage}
                                    />
                                )
                            }}
                        keyExtractor={item => item.id}
                        inverted
                        contentContainerStyle={[
                            styles.messagesList,
                            { paddingBottom: 20, paddingTop: 20 }
                        ]}
                        showsVerticalScrollIndicator={false}
                        onEndReached={() => {
                            if (hasNextPage && !isFetchingNextPage) {
                                fetchNextPage();
                            }
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isFetchingNextPage ? (
                                <View style={{ paddingVertical: 20 }}>
                                    <ActivityIndicator size="small" color={theme.primary} />
                                </View>
                            ) : (
                                <View style={styles.dateDivider}>
                                    <View style={[styles.dateBadge, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                                        <Text style={[styles.dateText, { color: theme.textSecondary }]}>TODAY</Text>
                                    </View>
                                </View>
                            )
                        }
                    />
                )
                }

                {
                    getTypingMessage() && (
                        <View style={styles.typingIndicatorContainer}>
                            <AnimatedTypingDots theme={theme} />
                            <Text style={[styles.typingIndicatorText, { color: theme.textSecondary }]}>{getTypingMessage()}</Text>
                        </View>
                    )
                }

                {
                    selectedImages.length > 0 && (
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
                    )
                }
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

                            <View style={styles.inputFieldContainer}>
                                {replyToMessage && (
                                    <View style={[styles.replyPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderLeftColor: theme.primary }]}>
                                        <View style={styles.replyPreviewContent}>
                                            <Text style={[styles.replyPreviewName, { color: theme.primary }]}>{replyToMessage.sender_name}</Text>
                                            <Text style={[styles.replyPreviewText, { color: theme.textSecondary }]} numberOfLines={1}>{replyToMessage.content}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setReplyToMessage(null)}>
                                            <Ionicons name="close" size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
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

                {isActionSheetVisible && (
                    <MessageActionSheet
                        visible={isActionSheetVisible}
                        onClose={closeActionSheet}
                        onReply={handleReply}
                        onPin={handlePin}
                        onCopy={handleCopy}
                        onDelete={handleDelete}
                        isDark={isDark}
                        theme={theme}
                        message={selectedMessage}
                        canDelete={permissions.canDelete}
                        canPin={permissions.canPin}
                        canKick={permissions.canKick}
                        onKick={handleKick}
                        isPinned={selectedMessage ? pinnedMessages.some(m => m.message_id === selectedMessage.id) : false}
                    />
                )}
            </KeyboardAvoidingView>

            <CustomConfirmModal
                visible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
                onConfirm={confirmDelete}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete"
                isDestructive
                isDark={isDark}
                theme={theme}
            />

            <CustomConfirmModal
                visible={isKickModalVisible}
                onClose={() => setIsKickModalVisible(false)}
                onConfirm={confirmKick}
                title="Remove User"
                message={`Are you sure you want to remove ${selectedMessage?.sender_name || 'this user'} from the group?`}
                confirmText="Remove"
                isDestructive
                isDark={isDark}
                theme={theme}
            />

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
const AnimatedTypingDots = ({ theme }: { theme: any }) => {
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

const VoiceWaveform = ({ theme }: { theme: any }) => {
    const bars = useRef(Array.from({ length: 5 }).map(() => new Animated.Value(0))).current;

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
const MessageBubble = ({
    message,
    theme,
    isDark,
    currentUserId,
    onImagePress,
    senderName,
    senderImage,
    showSenderInfo = true,
    onLongPress,
    onReplyPress
}: {
    message: Message,
    theme: any,
    isDark: boolean,
    currentUserId?: string,
    onImagePress?: (uri: string) => void,
    senderName?: string,
    senderImage?: string | null,
    showSenderInfo?: boolean,
    onLongPress?: () => void,
    onReplyPress?: (messageId: string) => void
}) => {
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

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: message.content },
                { shouldPlay: true },
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
                                {Array.from({ length: 20 }).map((_, i) => { // Reduced to 20 to fit better
                                    const barProgress = i / 20;
                                    const isFilled = barProgress < progressRatio;
                                    const heightPattern = [12, 20, 32, 16, 24, 28, 12, 20, 32, 16, 24, 8, 14, 22, 18, 10, 26, 14, 18, 10];
                                    const barHeight = heightPattern[i % heightPattern.length];

                                    const barColor = isFilled
                                        ? (isSender ? '#FFFFFF' : theme.primary)
                                        : (isSender ? 'rgba(255,255,255,0.4)' : theme.icon);

                                    return (
                                        <View
                                            key={i}
                                            style={[
                                                styles.waveformBar,
                                                {
                                                    height: barHeight,
                                                    width: 3,
                                                    backgroundColor: barColor,
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
                        {`${Math.floor(currentSeconds / 60)}:${(currentSeconds % 60).toString().padStart(2, '0')} / ${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`}
                    </Text>
                </View>
            );
        } else if (message.type === 'image') {
            const imageUri = message.media_urls?.[0] || message.content;
            return (
                <TouchableOpacity onPress={() => onImagePress?.(imageUri)} style={styles.imageMessageContainer}>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.messageImage}
                        contentFit="cover"
                        transition={200}
                    />
                </TouchableOpacity>
            );
        } else if (message.type === 'video') {
            const thumbnailUri = message.media_urls?.[0] || message.content;
            return (
                <TouchableOpacity onPress={() => onImagePress?.(thumbnailUri)} style={styles.videoMessageContainer}>
                    <Image
                        source={{ uri: thumbnailUri }}
                        style={styles.messageImage}
                        contentFit="cover"
                        transition={200}
                    />
                    <View style={styles.videoPlayOverlay}>
                        <Ionicons name="play-circle" size={48} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
            );
        } else if (message.type === 'file') {
            return (
                <View style={styles.fileMessageContainer}>
                    <Ionicons name="document-text" size={32} color={isSender ? '#FFFFFF' : theme.primary} />
                    <View style={styles.fileInfo}>
                        <Text style={[styles.fileName, { color: isSender ? '#FFFFFF' : theme.text }]} numberOfLines={1}>
                            {message.content || 'Document'}
                        </Text>
                        <Text style={[styles.fileSize, { color: isSender ? 'rgba(255,255,255,0.7)' : theme.textTertiary }]}>
                            {message.media_metadata?.size ? (message.media_metadata.size / 1024).toFixed(1) + ' KB' : 'File'}
                        </Text>
                    </View>
                </View>
            );
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    if (message.type === 'system') {
        return (
            <View style={styles.systemMessageContainer}>
                <View style={[styles.systemMessageBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={[styles.systemMessageText, { color: theme.textSecondary }]}>
                        {message.content}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[
            styles.messageRow,
            isSender ? styles.messageRowSender : styles.messageRowReceiver,
            !showSenderInfo && !isSender && { marginTop: 2 }
        ]}>
            {!isSender && (
                showSenderInfo ? (
                    <Image
                        source={{ uri: senderImage || undefined }}
                        style={styles.messageAvatar}
                        contentFit="cover"
                    />
                ) : (
                    <View style={{ width: 32, height: 32, marginRight: 8 }} />
                )
            )}

            <View style={[styles.bubbleContainer, isSender ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                {!isSender && senderName && showSenderInfo && (
                    <Text style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        marginBottom: 4,
                        marginLeft: 4
                    }}>
                        {senderName}
                    </Text>
                )}
                {message.reply_to && (
                    <TouchableOpacity
                        style={[styles.replyBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderLeftColor: theme.primary }]}
                        onPress={() => onReplyPress?.(message.reply_to!.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.replyName, { color: theme.primary }]}>{message.reply_to.sender_name}</Text>
                        <Text style={[styles.replyText, { color: theme.textSecondary }]} numberOfLines={1}>{message.reply_to.content}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        styles.bubble,
                        isSender ? styles.bubbleSender : styles.bubbleReceiver,
                        { backgroundColor: isSender ? theme.primary : (isDark ? theme.surface : theme.surface) }
                    ]}
                    onLongPress={onLongPress}
                    activeOpacity={0.9}
                    delayLongPress={200}
                >
                    {renderContent()}
                </TouchableOpacity>

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
    replyBubble: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 4,
        borderLeftWidth: 3,
    },
    replyName: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        marginBottom: 2
    },
    replyText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    messageText: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 12,
        width: '100%',
    },
    systemMessageBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    systemMessageText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
    videoMessageContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    videoPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        gap: 12,
        minWidth: 150,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 2,
    },
    fileSize: {
        fontSize: 11,
        fontFamily: Fonts.regular,
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
        marginHorizontal: 8,
    },
    pinnedBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        marginTop: 100, // Same as keyboardView paddingTop to start below header
        zIndex: 5,
    },
    pinnedContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pinnedAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    pinnedTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    pinnedTitle: {
        fontSize: 13,
        fontFamily: Fonts.bold,
        marginBottom: 2,
    },
    pinnedSnippetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mediaPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pinnedSnippet: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    pinnedMediaThumbnail: {
        width: 36,
        height: 36,
        borderRadius: 4,
        marginLeft: 8,
    },
    pinnedCountContainer: {
        paddingLeft: 8,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.1)',
        marginLeft: 8,
    },
    pinnedCount: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 3,
    },
    replyPreviewContent: {
        flex: 1,
    },
    replyPreviewName: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        marginBottom: 2
    },
    replyPreviewText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
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
        shadowOffset: { width: 0, height: 2 },
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
