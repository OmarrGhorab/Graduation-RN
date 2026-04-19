import CustomConfirmModal from '@/components/CustomConfirmModal';
import { MessageActionSheet } from '@/components/MessageActionSheet';
import { useToast } from '@/components/toast';
import { Fonts } from '@/constants/theme';
import { useConversationPresence } from '@/hooks/useConversationPresence';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { ChatMember, Conversation, Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
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
    textAlign,
    isOnline
}: {
    headerInfo: any,
    insets: any,
    theme: any,
    isDark: boolean,
    router: any,
    id: string,
    textAlign: 'left' | 'right',
    isOnline?: boolean
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
                    <View style={{ position: 'relative' }}>
                        <Image
                            key={headerInfo.avatar}
                            source={{ uri: headerInfo.avatar || 'https://ui-avatars.com/api/?name=User' }}
                            style={[styles.headerAvatar, { borderColor: theme.border }]}
                            contentFit="cover"
                            transition={200}
                        />
                        {/* Show online indicator only if user is online */}
                        {isOnline && (
                            <View style={[styles.onlineDot, { borderColor: theme.background }]} />
                        )}
                    </View>
                    <View>
                        <Text style={[styles.headerName, { color: theme.text }]}>{headerInfo.name}</Text>
                        {/* Show "Online" text if user is online, otherwise show role */}
                        {isOnline ? (
                            <Text style={{ fontSize: 12, color: '#10B981', fontFamily: Fonts.medium, marginTop: 2 }}>
                                Online
                            </Text>
                        ) : (
                            <View style={[styles.roleTag, { backgroundColor: isDark ? 'rgba(9, 125, 70, 0.2)' : 'rgba(9, 125, 70, 0.1)' }]}>
                                <Text style={[styles.roleText, { color: theme.primary }]}>{headerInfo.role}</Text>
                            </View>
                        )}
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
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const isFocused = useIsFocused();
    const lastTypingReport = useRef<number>(0);
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    // Real-time updates
    const { subscribe, send } = useWebSocket();

    // Typing indicator hook
    const { sendTypingIndicator } = useTypingIndicator(id!);

    // Fetch Conversation Details
    const { data: conversation } = useQuery({
        queryKey: ['conversation', id],
        queryFn: () => ChatService.getConversationDetails(id!),
        enabled: !!id,
        initialData: () => {
            // Seed from conversations list cache
            const allConvQueries = queryClient.getQueriesData<InfiniteData<Conversation[]>>({ queryKey: ['conversations'] });
            for (const [_, data] of allConvQueries) {
                if (data?.pages) {
                    const found = data.pages.flat().find((c: Conversation) => c.id === id);
                    if (found) return found as any;
                }
            }
            return undefined;
        }
    });

    // Add real-time presence tracking
    const conversationWithPresence = useConversationPresence(conversation || null);

    // Real-time updates
    useEffect(() => {
        // Track this conversation as "active" in the cache
        if (isFocused && id) {
            queryClient.setQueryData(['active-conversation-id'], id);
        }

        // Message Listener
        const unsubMessage = subscribe('message.created', (payload: any) => {
            const message = payload.data || payload;

            // Ensure sender object is populated from new payload fields if needed
            const senderName = message.sender_name || message.sender?.name || 'Someone';
            const senderImage = (message.sender_image && message.sender_image !== "") ? message.sender_image : (message.sender?.image || "");
            
            if (!message.sender || !message.sender.image || message.sender.image === "") {
                message.sender = {
                    id: message.sender_id,
                    name: senderName,
                    image: senderImage !== "" ? senderImage : `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}`
                };
            }

            if (message.conversation_id === id) {
                // If we are focused on this chat, mark it as read immediately to keep backend in sync
                if (isFocused) {
                    ChatService.markConversationAsRead(id).catch(console.warn);
                }

                // Skip if this is our own message (already handled optimistically)
                if (message.sender_id === currentUser?.id) {
                    console.log('[ChatDetail] Skipping own message from WebSocket (already optimistic)');
                    return;
                }

                queryClient.setQueryData(['messages', id], (old: any) => {
                    if (!old) return old;

                    // If message is missing reply_to but has reply_to_id, try to find it in cache
                    if (!message.reply_to && message.reply_to_id) {
                        const allMessages: Message[] = [];
                        if (old.pages) {
                            old.pages.forEach((page: any) => {
                                const msgs = Array.isArray(page) ? page : page.messages;
                                if (msgs) allMessages.push(...msgs);
                            });
                        }

                        const parentMsg = allMessages.find(m => m.id === message.reply_to_id);
                        if (parentMsg) {
                            message.reply_to = {
                                id: parentMsg.id,
                                content: parentMsg.content,
                                sender: parentMsg.sender
                            };
                        }
                    }

                    if (old.pages) {
                        const newPages = [...old.pages];
                        if (newPages.length > 0) {
                            let targetPage = newPages[0];
                            let isArray = Array.isArray(targetPage);
                            let messages = isArray ? targetPage : targetPage.messages;

                            if (messages?.some((m: any) => m.id === message.id)) return old;

                            const updatedMessages = [message, ...(messages || [])];

                            if (isArray) {
                                newPages[0] = updatedMessages;
                            } else {
                                newPages[0] = { ...targetPage, messages: updatedMessages };
                            }

                            // If message has media or links, invalidate media collection
                            if (message.type === 'image' || message.type === 'voice' ||
                                (message.content && (message.content.includes('http://') || message.content.includes('https://')))) {
                                console.log('[ChatDetail] Received media message, invalidating media collection');
                                queryClient.invalidateQueries({ queryKey: ['media-collection', id] });
                            }

                            return { ...old, pages: newPages };
                        }
                    }
                    return old;
                });
            }
        });

        return () => {
            unsubMessage();
            if (isFocused) {
                queryClient.setQueryData(['active-conversation-id'], null);
            }
        };
    }, [id, isFocused, queryClient, subscribe, currentUser?.id]);



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
            const messages = Array.isArray(lastPage) ? lastPage : lastPage?.messages;
            if (!messages || messages.length < 20) return undefined;
            return (allPages?.length || 0) * 20;
        },
        enabled: !!id,
        initialData: () => {
            // Try to find the conversation in any of the conversation query caches
            const allQueries = queryClient.getQueriesData<InfiniteData<Conversation[]>>({ queryKey: ['conversations'] });
            
            for (const [_, data] of allQueries) {
                if (data?.pages) {
                    const conv = data.pages.flat().find((c: Conversation) => c.id === id);
                    if (conv?.last_message) {
                        console.log('[ChatDetail] Seeding initial data with last_message from cache');
                        return {
                            pages: [[conv.last_message]],
                            pageParams: [0]
                        };
                    }
                }
            }
            return undefined;
        }
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
    // Handle array response (API returns array directly)
    const pinnedMessages = pinnedData || [];



    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    const [permissions, setPermissions] = useState({ canDelete: false, canPin: false, canKick: false });
    const [isKickModalVisible, setIsKickModalVisible] = useState(false);

    // Determine Permissions
    const checkPermissions = (message: Message) => {
        const user = currentUser;
        const member = conversation?.members?.find((m: ChatMember) => m.user_id === user?.id);
        const globalRole = user?.role;

        // Delete: Only own messages (for now)
        const canDelete = message.sender_id === user?.id;

        // Pin: Only Owner/Admin in Group (Ignore global roles per doc update)
        const canPin = member?.role === 'OWNER' || member?.role === 'ADMIN';

        // Kick: Strictly local roles. Owner can kick anyone, Admin can kick Members.
        let canKick = false;
        if (message.sender_id !== user?.id && member) {
            const targetMember = conversation?.members?.find((m: ChatMember) => m.user_id === message.sender_id);
            const targetRole = targetMember?.role;

            if (member.role === 'OWNER') canKick = true;
            else if (member.role === 'ADMIN') canKick = targetRole === 'MEMBER';
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
        const userToKickName = selectedMessage.sender?.name || 'this user';
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

        // Start delete animation
        setDeletingMessageId(messageToDelete.id);
        setIsDeleteModalVisible(false);

        // Wait for animation to complete
        setTimeout(async () => {
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
            setDeletingMessageId(null);
        }, 600); // Animation duration
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

                // Mark conversation as read when user opens it
                ChatService.markConversationAsRead(id)
                    .then(() => {
                        console.log('[ChatDetail] Marked conversation as read:', id);
                        // Update unread count in cache
                        queryClient.setQueryData(['unread-count', id], { unread_count: 0 });
                        // Invalidate conversations list to update unread badge
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                        queryClient.invalidateQueries({ queryKey: ['total-unread-count'] });
                    })
                    .catch(err => {
                        console.error('[ChatDetail] Failed to mark as read:', err);
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

    // Typing indicator data (managed by useTypingIndicator hook)
    const { data: typingData } = useQuery({
        queryKey: ['typing', id],
        queryFn: () => ({ typing_users: [] as { user_id: string; user_name: string; user_image?: string }[] }),
        staleTime: Infinity,
        enabled: !!id,
    });

    const currentTypingUsers = typingData?.typing_users || [];

    // Debug typing data
    useEffect(() => {
        console.log('[ChatDetail] Typing data updated:', {
            typingData,
            currentTypingUsers,
            currentUserId: currentUser?.id,
            othersTyping: currentTypingUsers.filter(u => u.user_id !== currentUser?.id)
        });
    }, [typingData, currentTypingUsers, currentUser?.id]);


    const handleInputChange = (text: string) => {
        setInputText(text);
        if (text.length > 0) {
            sendTypingIndicator();
        } else {
            // Stop typing indicator when input is cleared
            ChatService.sendTyping(id!, false).catch(err =>
                console.log('[ChatDetail] Failed to stop typing:', err)
            );
        }
    };

    const getTypingMessage = () => {
        // Filter out current user
        const othersTyping = currentTypingUsers.filter(u => u.user_id !== currentUser?.id);

        console.log('[ChatDetail] getTypingMessage called:', {
            currentTypingUsers,
            othersTyping,
            currentUserId: currentUser?.id
        });

        if (othersTyping.length === 0) return null;

        if (othersTyping.length === 1) {
            // Try to get the actual name from conversation members if "Someone" is used
            let displayName = othersTyping[0].user_name;
            if (displayName === 'Someone' && conversation?.members) {
                const member = conversation.members.find((m: ChatMember) => m.user_id === othersTyping[0].user_id);
                if (member?.profile?.name) {
                    displayName = member.profile.name;
                }
            }
            return `${displayName} is typing...`;
        }

        return `${othersTyping.length} people are typing...`;
    };

    // Send Message via HTTP API (WebSocket will broadcast the created message)
    const sendMessage = async (payload: { content: string, type: 'text' | 'image' | 'voice', reply_to_id?: string | null, media_urls?: string[], media_metadata?: any }) => {
        const localId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Build reply_to object if replying
        let replyToObject = undefined;
        if (payload.reply_to_id && replyToMessage) {
            replyToObject = {
                id: replyToMessage.id,
                content: replyToMessage.content,
                sender: replyToMessage.sender || {
                    id: replyToMessage.sender_id,
                    name: 'User',
                    image: ''
                }
            };
        }

        const newMessage: Message = {
            id: localId,
            conversation_id: id!,
            content: payload.content,
            type: payload.type as any,
            sender_id: currentUser?.id || 'unknown',
            media_urls: payload.media_urls || [],
            // Use new sender object structure
            sender: {
                id: currentUser?.id || 'unknown',
                name: currentUser?.name || 'Unknown',
                image: currentUser?.profileImg || ''
            },
            created_at: new Date().toISOString(),
            is_deleted: false,
            reply_to_id: payload.reply_to_id || undefined,
            reply_to: replyToObject,
            media_metadata: payload.media_metadata
        };

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
        queryClient.setQueriesData({ queryKey: ['conversations'] }, (old: any) => {
            if (!old || !old.pages) return old;

            const newPages = old.pages.map((page: Conversation[]) => [...page]);
            let foundIndex = -1;
            let foundPageIndex = -1;

            for (let i = 0; i < newPages.length; i++) {
                const idx = newPages[i].findIndex((c: Conversation) => c.id === id);
                if (idx !== -1) {
                    foundPageIndex = i;
                    foundIndex = idx;
                    break;
                }
            }

            if (foundPageIndex !== -1) {
                const existingConv = newPages[foundPageIndex][foundIndex];
                const updatedConv = {
                    ...existingConv,
                    last_message: newMessage,
                    updated_at: new Date().toISOString()
                };

                newPages[foundPageIndex].splice(foundIndex, 1);
                newPages[0].unshift(updatedConv);

                return { ...old, pages: newPages };
            }
            return old;
        });

        // Send via HTTP API
        try {
            console.log('[ChatDetail] Sending message via HTTP API:', payload);
            const sentMessage = await ChatService.sendMessage(id!, {
                ...payload,
                reply_to_id: payload.reply_to_id || undefined // Convert null to undefined
            });
            console.log('[ChatDetail] Message sent successfully:', sentMessage);

            // Replace optimistic message with real message from server
            queryClient.setQueryData(['messages', id], (old: any) => {
                if (!old || !old.pages) return old;

                const newPages = old.pages.map((page: any) => {
                    const isArray = Array.isArray(page);
                    const messages = isArray ? page : page.messages;

                    if (!Array.isArray(messages)) return page;

                    const updatedMessages = messages.map((m: any) =>
                        m.id === localId ? sentMessage : m
                    );

                    return isArray ? updatedMessages : { ...page, messages: updatedMessages };
                });

                return { ...old, pages: newPages };
            });

            // Update conversations list with real message
            queryClient.setQueriesData({ queryKey: ['conversations'] }, (old: any) => {
                if (!old || !old.pages) return old;

                const newPages = old.pages.map((page: Conversation[]) => [...page]);
                let foundIndex = -1;
                let foundPageIndex = -1;

                for (let i = 0; i < newPages.length; i++) {
                    const idx = newPages[i].findIndex((c: Conversation) => c.id === id);
                    if (idx !== -1) {
                        foundPageIndex = i;
                        foundIndex = idx;
                        break;
                    }
                }

                if (foundPageIndex !== -1) {
                    const existingConv = newPages[foundPageIndex][foundIndex];
                    const updatedConv = {
                        ...existingConv,
                        last_message: sentMessage,
                        updated_at: sentMessage.created_at
                    };

                    newPages[foundPageIndex].splice(foundIndex, 1);
                    newPages[0].unshift(updatedConv);

                    return { ...old, pages: newPages };
                }
                return old;
            });

            // Invalidate media collection if message contains media
            if (sentMessage.type === 'image' || sentMessage.type === 'voice' ||
                (sentMessage.type === 'text' && sentMessage.content?.includes('http'))) {
                queryClient.invalidateQueries({ queryKey: ['media-collection', id] });
            }

        } catch (error) {
            console.error('[ChatDetail] Failed to send message:', error);

            // Remove optimistic message on error
            queryClient.setQueryData(['messages', id], (old: any) => {
                if (!old || !old.pages) return old;

                const newPages = old.pages.map((page: any) => {
                    const isArray = Array.isArray(page);
                    const messages = isArray ? page : page.messages;

                    if (!Array.isArray(messages)) return page;

                    const filteredMessages = messages.filter((m: any) => m.id !== localId);

                    return isArray ? filteredMessages : { ...page, messages: filteredMessages };
                });

                return { ...old, pages: newPages };
            });

            toast.error('Error', 'Failed to send message. Please try again.');
        }
    };

    const uploadAndSendMessage = async (uri: string, type: 'image' | 'voice', duration: number = 0) => {
        setUploadingMedia(true);
        try {
            console.log(`[ChatDetail] Starting upload for ${type}. URI:`, uri, 'Duration:', duration);
            const mediaUrl = await ChatService.uploadMedia(uri, type);
            console.log(`[ChatDetail] Upload success. Media URL:`, mediaUrl);

            const payload = {
                type,
                content: type === 'image' ? 'Image' : 'Voice message',  // Text description
                media_urls: [mediaUrl],  // URL in media_urls array
                media_metadata: type === 'voice' ? { duration } : undefined,
                reply_to_id: replyToMessage?.id
            };
            console.log(`[ChatDetail] Sending message with payload:`, JSON.stringify(payload, null, 2));

            sendMessage(payload);
            setReplyToMessage(null);
        } catch (error: any) {
            console.error(`[ChatDetail] Upload/Send Error:`, error);
            Alert.alert('Process Failed', `Error: ${error.message}\n\nPlease check console for full data.`);
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleSend = async () => {
        if ((!inputText.trim() && selectedImages.length === 0) || uploadingMedia) return;

        // Stop typing indicator immediately when sending (fire and forget)
        ChatService.sendTyping(id!, false).catch(err =>
            console.log('[ChatDetail] Failed to stop typing indicator:', err)
        );

        // Upload all images first if any
        if (selectedImages.length > 0) {
            setUploadingMedia(true);
            try {
                const uploadedUrls: string[] = [];

                // Upload all images
                for (const uri of selectedImages) {
                    console.log(`[ChatDetail] Uploading image:`, uri);
                    const mediaUrl = await ChatService.uploadMedia(uri, 'image');
                    uploadedUrls.push(mediaUrl);
                }

                console.log(`[ChatDetail] All images uploaded:`, uploadedUrls);

                // Send one message with all images and optional text
                sendMessage({
                    content: inputText.trim() || 'Image',  // Use text or default to "Image"
                    type: 'image',
                    media_urls: uploadedUrls,
                    reply_to_id: replyToMessage?.id
                });

                setSelectedImages([]);
                setInputText('');
                setReplyToMessage(null);
                setIsEmojiOpen(false);
            } catch (error) {
                console.error('[ChatDetail] Failed to upload images:', error);
                toast.error('Error', 'Failed to upload images. Please try again.');
            } finally {
                setUploadingMedia(false);
            }
        } else if (inputText.trim()) {
            const textToSend = inputText.trim();
            // Clear input INSTANTLY for better UX
            setInputText('');
            setReplyToMessage(null);
            setIsEmojiOpen(false);

            // Send text-only message
            sendMessage({
                content: textToSend,
                type: 'text',
                reply_to_id: replyToMessage?.id
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

        // Use conversationWithPresence instead of conversation
        const conv = conversationWithPresence || conversation;

        if (conv) {
            if (conv.type === 'DIRECT') {
                const otherMember = conv.members?.find((m: ChatMember) => m.user_id !== currentUser?.id);

                const isInvalidName = (n?: string | null) => !n || (n.length > 30 && n.includes('-'));
                let displayName = 'User';

                // Use new profile structure
                if (!isInvalidName(conv.name)) displayName = conv.name!;
                else if (!isInvalidName(otherMember?.profile?.name)) displayName = otherMember!.profile!.name!;

                const displayImage = conv.image_url || otherMember?.profile?.image || (displayName !== 'User' ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}` : undefined);

                // Prefer member's is_online status if available, otherwise use peer_online
                const isOnline = otherMember?.is_online ?? conv.peer_online ?? false;

                return {
                    name: displayName,
                    avatar: displayImage,
                    role: otherMember?.role || 'STUDENT',
                    isOnline: isOnline,
                };
            }
            const groupName = conv.name || 'Group Chat';
            return {
                name: groupName,
                avatar: conv.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}`,
                role: 'GROUP',
                isOnline: false, // Groups don't have online status
            };
        }

        // Fallback to params if conversation not loaded yet
        if (paramInfo.name) {
            return {
                name: paramInfo.name,
                avatar: paramInfo.avatar || 'https://ui-avatars.com/api/?name=User',
                role: paramInfo.role || 'STUDENT',
                isOnline: false,
            };
        }

        return { name: '...', avatar: undefined, role: '', isOnline: false };
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
                isOnline={headerInfo.isOnline}
            />

            {pinnedMessages.length > 0 && (
                <View style={[styles.pinnedBar, { backgroundColor: isDark ? 'rgba(9, 124, 70, 0.15)' : 'rgba(9, 124, 70, 0.05)', borderBottomColor: theme.divider }]}>
                    <TouchableOpacity
                        style={styles.pinnedContent}
                        onPress={() => scrollToMessage(pinnedMessages[0].message_id)}
                    >
                        <Image
                            source={{ uri: pinnedMessages[0].message?.sender?.image || 'https://ui-avatars.com/api/?name=User' }}
                            style={styles.pinnedAvatar}
                        />
                        <View style={styles.pinnedTextContainer}>
                            <Text style={[styles.pinnedTitle, { color: theme.primary }]} numberOfLines={1}>
                                {pinnedMessages[0].message?.sender?.name || 'User'}
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
                                // Use sender data directly from message (no member lookup needed)
                                let senderName = item.sender?.name || '';

                                // Special handling for current user
                                if (item.sender_id === currentUser?.id) {
                                    senderName = currentUser?.name || 'Me';
                                }

                                const senderImage = item.sender?.image;

                                // Grouping Logic: Check if next message (visually below, so older) is from same sender
                                const nextMessage = messages[index + 1];
                                const isNewGroup = !nextMessage ||
                                    nextMessage.sender_id !== item.sender_id ||
                                    (new Date(item.created_at).getTime() - new Date(nextMessage.created_at).getTime() > 60000); // 1 min gap

                                return (
                                    <MessageBubble
                                        message={item}
                                        theme={theme}
                                        isDark={isDark}
                                        currentUserId={currentUser?.id}
                                        onImagePress={setViewerImage}
                                        showSenderInfo={isNewGroup}
                                        onLongPress={() => handleMessageLongPress(item)}
                                        onReplyPress={scrollToMessage}
                                        isDeleting={deletingMessageId === item.id}
                                        isGroup={conversation?.type === 'GROUP'}
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
                            <View style={styles.typingAvatarsRow}>
                                {currentTypingUsers.filter(u => u.user_id !== currentUser?.id).slice(0, 3).map((u, i) => (
                                    <Image 
                                        key={u.user_id}
                                        source={{ uri: u.user_image || `https://ui-avatars.com/api/?name=${u.user_name}&background=random` }} 
                                        style={[
                                            styles.senderThumbSmall,
                                            i > 0 && { marginLeft: -8, borderWidth: 2, borderColor: theme.background }
                                        ]}
                                    />
                                ))}
                            </View>
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
                                onPress={handlePickImage}
                                disabled={uploadingMedia}
                            >
                                <Ionicons
                                    name="add"
                                    size={28}
                                    color={theme.icon}
                                />
                            </TouchableOpacity>

                            <View style={styles.inputFieldContainer}>
                                {replyToMessage && (
                                    <View style={[styles.replyPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderLeftColor: theme.primary }]}>
                                        <View style={styles.replyPreviewContent}>
                                            <Text style={[styles.replyPreviewName, { color: theme.primary }]}>{replyToMessage.sender?.name || ''}</Text>
                                            <Text style={[styles.replyPreviewText, { color: theme.textSecondary }]} numberOfLines={1}>{replyToMessage.content}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setReplyToMessage(null)}>
                                            <Ionicons name="close" size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <View style={[styles.inputWrapper, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                                    <TouchableOpacity
                                        style={[styles.smileyButton, isEmojiOpen && { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EBF4FF', borderRadius: 20 }]}
                                        onPress={() => setIsEmojiOpen(!isEmojiOpen)}
                                    >
                                        <Ionicons name={isEmojiOpen ? "happy" : "happy-outline"} size={24} color={isEmojiOpen ? theme.primary : theme.icon} />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, textAlign }]}
                                        placeholder="Type a message..."
                                        placeholderTextColor={theme.textTertiary}
                                        value={inputText}
                                        onChangeText={handleInputChange}
                                        multiline
                                        editable={!uploadingMedia}
                                    />
                                </View>
                            </View>

                            {inputText.trim() || selectedImages.length > 0 ? (
                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: theme.primary, opacity: uploadingMedia ? 0.7 : 1 }]}
                                    onPress={handleSend}
                                    disabled={uploadingMedia}
                                >
                                    {uploadingMedia ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.micButton, isRecording && { backgroundColor: theme.primary, borderRadius: 20 }]}
                                    onPressIn={startRecording}
                                    onPressOut={stopRecording}
                                    disabled={uploadingMedia}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="mic" size={24} color={isRecording ? "#FFFFFF" : theme.icon} />
                                </TouchableOpacity>
                            )}
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
                message={`Are you sure you want to remove ${selectedMessage?.sender?.name || 'this user'} from the group?`}
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
    showSenderInfo = true,
    onLongPress,
    onReplyPress,
    isDeleting = false,
    isGroup = false
}: {
    message: Message,
    theme: any,
    isDark: boolean,
    currentUserId?: string,
    onImagePress?: (uri: string) => void,
    showSenderInfo?: boolean,
    onLongPress?: () => void,
    onReplyPress?: (messageId: string) => void,
    isDeleting?: boolean,
    isGroup?: boolean
}) => {
    // Curated vibrant colors for group participants
    const SENDER_COLORS = [
        '#FF5B5B', '#4FBF8A', '#4299E1', '#F6AD55',
        '#9F7AEA', '#ED64A6', '#48BB78', '#ECC94B'
    ];

    const getSenderColor = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
    };

    const isSender = message.sender_id === currentUserId;
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [progress, setProgress] = useState(0);

    // Delete animation
    const deleteAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isDeleting) {
            Animated.parallel([
                Animated.timing(deleteAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        }
    }, [isDeleting]);

    const [duration, setDuration] = useState((message.media_metadata?.duration || 0) * 1000);

    // Prepare sender metadata with robust fallback
    const senderName = message.sender?.name || '';
    const senderImage = (message.sender?.image && message.sender.image !== "") ? message.sender.image : `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'U')}&background=random`;


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

            // Get audio URL from media_urls or fallback to content
            const audioUri = message.media_urls?.[0] || message.content;

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
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
            const imageUrls = message.media_urls && message.media_urls.length > 0
                ? message.media_urls
                : [message.content];

            const imageCount = imageUrls.length;

            return (
                <View>
                    {/* Show text if it's not just "Image" */}
                    {message.content && message.content !== 'Image' && (
                        <Text style={[
                            styles.messageText,
                            { color: isSender ? '#FFFFFF' : theme.text, marginBottom: 8 }
                        ]}>
                            {message.content}
                        </Text>
                    )}

                    {/* Image Grid */}
                    {imageCount === 1 ? (
                        // Single image
                        <TouchableOpacity onPress={() => onImagePress?.(imageUrls[0])}>
                            <Image
                                source={{ uri: imageUrls[0] }}
                                style={styles.singleImage}
                                contentFit="cover"
                                transition={200}
                            />
                        </TouchableOpacity>
                    ) : imageCount === 2 ? (
                        // Two images side by side
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {imageUrls.slice(0, 2).map((imageUri, index) => (
                                <TouchableOpacity key={index} onPress={() => onImagePress?.(imageUri)}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.doubleImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : imageCount === 3 ? (
                        // Three images: 1 large on top, 2 small below
                        <View style={{ gap: 4 }}>
                            <TouchableOpacity onPress={() => onImagePress?.(imageUrls[0])}>
                                <Image
                                    source={{ uri: imageUrls[0] }}
                                    style={styles.tripleImageLarge}
                                    contentFit="cover"
                                    transition={200}
                                />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                                {imageUrls.slice(1, 3).map((imageUri, index) => (
                                    <TouchableOpacity key={index} onPress={() => onImagePress?.(imageUri)}>
                                        <Image
                                            source={{ uri: imageUri }}
                                            style={styles.tripleImageSmall}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        // 4+ images: 2x2 grid, show +N on 3rd image
                        <View style={{ gap: 4 }}>
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                                {imageUrls.slice(0, 2).map((imageUri, index) => (
                                    <TouchableOpacity key={index} onPress={() => onImagePress?.(imageUri)}>
                                        <Image
                                            source={{ uri: imageUri }}
                                            style={styles.gridImage}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                                <TouchableOpacity onPress={() => onImagePress?.(imageUrls[2])}>
                                    <Image
                                        source={{ uri: imageUrls[2] }}
                                        style={styles.gridImage}
                                        contentFit="cover"
                                        transition={200}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onImagePress?.(imageUrls[3] || imageUrls[2])}>
                                    <View>
                                        <Image
                                            source={{ uri: imageUrls[3] || imageUrls[2] }}
                                            style={styles.gridImage}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                        {imageCount > 4 && (
                                            <View style={styles.moreImagesOverlay}>
                                                <Text style={styles.moreImagesText}>+{imageCount - 4}</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
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

    if (message.type === 'text' && message.content.startsWith('[SYSTEM]')) {
        return (
            <View style={styles.systemMessageContainer}>
                <View style={[styles.systemMessageBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={[styles.systemMessageText, { color: theme.textSecondary }]}>
                        {message.content.replace('[SYSTEM]', '').trim()}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <Animated.View style={[
            styles.messageRow,
            isSender ? styles.messageRowSender : styles.messageRowReceiver,
            !showSenderInfo && { marginTop: 2 },  // Tighter spacing for grouped messages
            {
                opacity: deleteAnim,
                transform: [{ scale: scaleAnim }],
            }
        ]}>
            {!isSender && (
                showSenderInfo ? (
                    <Image
                        source={{ uri: senderImage }}
                        style={styles.messageAvatar}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={{ width: 32, height: 32, marginRight: 8 }} />  // Spacer to align grouped messages
                )
            )}

            <View style={[styles.bubbleContainer, isSender ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                {!isSender && isGroup && senderName && showSenderInfo && (
                    <Text style={{
                        fontSize: 13,
                        fontFamily: Fonts.bold,
                        color: getSenderColor(message.sender_id),
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
                        <Text style={[styles.replyName, { color: theme.primary }]}>{message.reply_to.sender?.name || ''}</Text>
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
        </Animated.View>
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
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxWidth: 280,
    },
    messageImage: {
        width: 240,
        height: 180,
        borderRadius: 16,
    },
    singleImage: {
        width: 240,
        height: 180,
        borderRadius: 16,
    },
    doubleImage: {
        width: 136,
        height: 136,
        borderRadius: 12,
    },
    tripleImageLarge: {
        width: 276,
        height: 180,
        borderRadius: 12,
        marginBottom: 4,
    },
    tripleImageSmall: {
        width: 136,
        height: 136,
        borderRadius: 12,
    },
    gridImage: {
        width: 136,
        height: 136,
        borderRadius: 12,
    },
    moreImagesOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    moreImagesText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
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
        gap: 8,
        borderTopWidth: 1,
    },
    attachButton: {
        padding: 4,
    },
    inputFieldContainer: {
        flex: 1,
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
        paddingHorizontal: 4,
        paddingVertical: 4,
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
        paddingHorizontal: 12,
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
    micButton: {
        padding: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
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
    senderThumbSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    typingAvatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
});
