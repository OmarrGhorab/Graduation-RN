import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ChatService } from '@/services/ChatService';
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

type TabType = 'photos' | 'voice' | 'links';

export default function MediaScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('photos');

    const { data: mediaCollection, isLoading } = useQuery({
        queryKey: ['media-collection', id],
        queryFn: () => ChatService.getMediaCollection(id!),
        enabled: !!id,
    });

    const currentData = mediaCollection?.[activeTab] || [];

    const handleItemPress = (messageId: string) => {
        // Navigate back to the conversation with the scrollTo param
        router.push({
            pathname: '/conversation/[id]',
            params: { id: id!, scrollTo: messageId }
        } as any);
    };

    const handleLinkPress = (url: string) => {
        // Extract URL from text content
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            Linking.openURL(urlMatch[0]);
        }
    };

    const renderMediaItem = ({ item }: { item: MediaItem }) => {
        if (activeTab === 'photos') {
            return (
                <TouchableOpacity
                    style={styles.mediaItem}
                    onPress={() => handleItemPress(item.message_id)}
                    activeOpacity={0.7}
                >
                    <Image
                        source={{ uri: item.url }}
                        style={styles.mediaThumbnail}
                        contentFit="cover"
                    />
                </TouchableOpacity>
            );
        }

        if (activeTab === 'voice') {
            return (
                <TouchableOpacity
                    style={[styles.listItem, { borderBottomColor: theme.divider }]}
                    onPress={() => handleItemPress(item.message_id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surfaceVariant : '#F3F4F6' }]}>
                        <Ionicons name="mic" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.listTextContent}>
                        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                            Voice Message
                        </Text>
                        <Text style={[styles.itemSubtitle, { color: theme.textTertiary }]}>
                            {item.sender.name} • {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <Image
                        source={{ uri: item.sender.image || `https://ui-avatars.com/api/?name=${item.sender.name}` }}
                        style={styles.senderAvatar}
                        contentFit="cover"
                    />
                </TouchableOpacity>
            );
        }

        // Links tab
        return (
            <TouchableOpacity
                style={[styles.listItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleLinkPress(item.url)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surfaceVariant : '#F3F4F6' }]}>
                    <Ionicons name="link" size={24} color={theme.primary} />
                </View>
                <View style={styles.listTextContent}>
                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
                        {item.url}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: theme.textTertiary }]}>
                        {item.sender.name} • {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Image
                    source={{ uri: item.sender.image || `https://ui-avatars.com/api/?name=${item.sender.name}` }}
                    style={styles.senderAvatar}
                    contentFit="cover"
                />
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Media & Links</Text>
                <View style={{ width: 44 }} />
            </BlurView>

            <View style={[styles.tabBar, { borderBottomColor: theme.divider }]}>
                {(['photos', 'voice', 'links'] as TabType[]).map(tab => (
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
                    data={currentData}
                    renderItem={renderMediaItem}
                    keyExtractor={item => item.message_id}
                    numColumns={activeTab === 'photos' ? COLUMN_COUNT : 1}
                    key={activeTab === 'photos' ? 'grid' : 'list'}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={activeTab === 'photos' ? "images-outline" : activeTab === 'voice' ? "mic-outline" : "link-outline"}
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
    senderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: 12,
        backgroundColor: '#E2E8F0',
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
