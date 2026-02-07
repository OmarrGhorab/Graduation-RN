import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { PinnedMessage } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PinnedMessagesScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['pinned-messages', id],
        queryFn: () => ChatService.getPinnedMessages(id!),
        enabled: !!id,
    });

    const unpinMutation = useMutation({
        mutationFn: (messageId: string) => ChatService.unpinMessage(id!, messageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pinned-messages', id] });
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to unpin message');
        }
    });

    const { data: conversation } = useQuery({
        queryKey: ['conversation', id],
        queryFn: () => ChatService.getConversationDetails(id!),
        enabled: !!id,
    });

    const canUnpin = () => {
        if (!currentUser || !conversation) return false;
        const member = conversation.members?.find(m => m.user_id === currentUser.id);
        const myLocalRole = member?.role;
        return myLocalRole === 'OWNER' || myLocalRole === 'ADMIN';
    };

    const renderPinnedMessage = ({ item }: { item: PinnedMessage }) => {
        const message = item.message;
        if (!message) return null;

        const renderContent = () => {
            const mediaUri = message.media_urls?.[0] || (message.content?.startsWith('http') ? message.content : null);
            const isCloudinary = mediaUri?.includes('res.cloudinary.com');
            const isVoice = isCloudinary && (mediaUri?.endsWith('.mp3') || mediaUri?.endsWith('.m4a') || message.type === 'voice');
            const isImage = isCloudinary && !isVoice;

            // Handle cases where type is 'text' but content is a Cloudinary media link
            if (message.type === 'text' && isCloudinary) {
                if (isVoice) {
                    return (
                        <View style={[styles.voicePreview, { backgroundColor: isDark ? 'rgba(9, 125, 70, 0.1)' : 'rgba(9, 125, 70, 0.05)' }]}>
                            <Ionicons name="mic" size={20} color={theme.primary} />
                            <Text style={[styles.voiceText, { color: theme.primary }]}>Voice Message</Text>
                        </View>
                    );
                }
                return (
                    <View style={styles.mediaContainer}>
                        <Image
                            source={{ uri: mediaUri || undefined }}
                            style={styles.imagePreview}
                            contentFit="cover"
                        />
                    </View>
                );
            }

            switch (message.type) {
                case 'image':
                    return (
                        <View style={styles.mediaContainer}>
                            <Image
                                source={{ uri: mediaUri || undefined }}
                                style={styles.imagePreview}
                                contentFit="cover"
                            />
                            {message.content && !isCloudinary && (
                                <Text style={[styles.messageContent, { color: theme.text, marginTop: 8 }]} numberOfLines={2}>
                                    {message.content}
                                </Text>
                            )}
                        </View>
                    );
                case 'voice':
                    return (
                        <View style={[styles.voicePreview, { backgroundColor: isDark ? 'rgba(9, 125, 70, 0.1)' : 'rgba(9, 125, 70, 0.05)' }]}>
                            <Ionicons name="mic" size={20} color={theme.primary} />
                            <Text style={[styles.voiceText, { color: theme.primary }]}>Voice Message</Text>
                        </View>
                    );
                default:
                    return (
                        <Text style={[styles.messageContent, { color: theme.text }]} numberOfLines={3}>
                            {message.content}
                        </Text>
                    );
            }
        };

        return (
            <View style={[styles.messageCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderBottomColor: theme.divider }]}>
                <View style={styles.messageHeader}>
                    <View style={styles.senderInfo}>
                        <Image
                            source={{ uri: message.sender?.image || `https://ui-avatars.com/api/?name=${message.sender?.name}` }}
                            style={styles.senderAvatar}
                            contentFit="cover"
                        />
                        <View>
                            <Text style={[styles.senderName, { color: theme.primary }]}>{message.sender?.name}</Text>
                            <Text style={[styles.timestamp, { color: theme.textTertiary }]}>
                                {new Date(message.created_at || new Date()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                    {item.pinner && (
                        <View style={styles.pinnerInfo}>
                            <Ionicons name="bookmark" size={14} color={theme.textTertiary} />
                            <Text style={[styles.pinnerText, { color: theme.textTertiary }]}>
                                Pinned by {item.pinner.name}
                            </Text>
                        </View>
                    )}
                </View>

                {renderContent()}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.goToButton}
                        onPress={() => router.push({
                            pathname: "/conversation/[id]",
                            params: { id: id!, messageId: message.id }
                        } as any)}
                    >
                        <Text style={[styles.goToText, { color: theme.primary }]}>Go to message</Text>
                    </TouchableOpacity>

                    {canUnpin() && (
                        <TouchableOpacity
                            onPress={() => unpinMutation.mutate(message.id!)}
                            disabled={unpinMutation.isPending}
                        >
                            <Ionicons name="bookmark" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <BlurView
                intensity={Platform.OS === 'android' ? 50 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.header, { paddingTop: insets.top, borderBottomColor: theme.divider }]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name={textAlign === 'right' ? "chevron-forward" : "chevron-back"} size={28} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Pinned Messages</Text>
                <View style={{ width: 44 }} />
            </BlurView>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={data || []}
                    renderItem={renderPinnedMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="bookmark-outline" size={64} color={theme.divider} />
                            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No pinned messages</Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 8,
        height: Platform.OS === 'ios' ? 100 : 90,
        zIndex: 10,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingTop: Platform.OS === 'ios' ? 100 : 90,
    },
    messageCard: {
        padding: 16,
        borderBottomWidth: 1,
    },
    messageHeader: {
        marginBottom: 12,
    },
    senderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    senderAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#E2E8F0',
    },
    senderName: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    timestamp: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    pinnerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    pinnerText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
    },
    messageContent: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        lineHeight: 20,
    },
    mediaContainer: {
        marginBottom: 12,
    },
    imagePreview: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    voicePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    voiceText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    goToButton: {
        paddingVertical: 4,
    },
    goToText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginTop: 16,
    },
});
