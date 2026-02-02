import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ChatService } from '@/services/ChatService';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

type TabType = 'media' | 'links' | 'docs';

export default function MediaScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('media');

    const { data: mediaData, isLoading } = useQuery({
        queryKey: ['chat-media', id],
        queryFn: () => ChatService.getChatMedia(id!),
        enabled: !!id,
    });

    const filteredData = (mediaData?.messages || []).filter(msg => {
        const type = msg.type as string;
        if (activeTab === 'media') return type === 'image' || type === 'video' || type === 'voice';
        if (activeTab === 'docs') return type === 'file';
        if (activeTab === 'links') {
            const hasLink = msg.content?.includes('http');
            const isMediaLink = msg.content?.includes('res.cloudinary.com');
            return hasLink && !isMediaLink;
        }
        return false;
    });

    const handleItemPress = (messageId: string) => {
        // Navigate back to the conversation with the scrollTo param
        router.push({
            pathname: '/conversation/[id]',
            params: { id: id!, scrollTo: messageId }
        } as any);
    };

    const renderMediaItem = ({ item }: { item: Message }) => {
        if (activeTab === 'media') {
            const displayUri = item.media_urls?.[0] || (item.content?.startsWith('http') ? item.content : null);
            return (
                <TouchableOpacity
                    style={styles.mediaItem}
                    onPress={() => handleItemPress(item.id)}
                    activeOpacity={0.7}
                >
                    <Image
                        source={{ uri: displayUri || undefined }}
                        style={styles.mediaThumbnail}
                        contentFit="cover"
                    />
                    {item.type === 'voice' && (
                        <View style={styles.voiceOverlay}>
                            <Ionicons name="mic" size={20} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.listItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surfaceVariant : '#F3F4F6' }]}>
                    <Ionicons
                        name={activeTab === 'docs' ? "document-text" : "link"}
                        size={24}
                        color={theme.primary}
                    />
                </View>
                <View style={styles.listTextContent}>
                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                        {activeTab === 'docs' ? (item.content || 'Document') : item.content}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: theme.textTertiary }]}>
                        {item.sender_name} • {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </TouchableOpacity>
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Media, Links, and Docs</Text>
                <View style={{ width: 44 }} />
            </BlurView>

            <View style={[styles.tabBar, { borderBottomColor: theme.divider }]}>
                {(['media', 'links', 'docs'] as TabType[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabItem, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabLabel, { color: activeTab === tab ? theme.primary : theme.textSecondary }]}>
                            {tab.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    renderItem={renderMediaItem}
                    keyExtractor={item => item.id}
                    numColumns={activeTab === 'media' ? COLUMN_COUNT : 1}
                    key={activeTab === 'media' ? 'grid' : 'list'}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={activeTab === 'media' ? "images-outline" : activeTab === 'links' ? "link-outline" : "document-outline"}
                                size={64}
                                color={theme.divider}
                            />
                            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                                No {activeTab} shared yet
                            </Text>
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
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginTop: Platform.OS === 'ios' ? 100 : 90,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
    },
    mediaItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        padding: 1,
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
    },
    voiceOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listTextContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
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
