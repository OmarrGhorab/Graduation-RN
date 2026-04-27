import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

export default function SubscriptionsScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { subscriptions, isLoading, refetch } = useSubscriptions();

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return theme.csk[600];
            case 'CANCELLED': return theme.error[500];
            case 'EXPIRED': return theme.gray[500];
            case 'PAST_DUE': return '#FF9800';
            default: return theme.gray[500];
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.subItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push({
                pathname: '/subscription-details',
                params: { id: item.id }
            })}
        >
            <View style={styles.subIcon}>
                <Ionicons 
                    name="calendar" 
                    size={32} 
                    color={theme.primary} 
                />
            </View>
            <View style={styles.subInfo}>
                <Text style={[styles.subTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.courseTitle || 'Course Subscription'}
                </Text>
                <Text style={[styles.subDate, { color: theme.gray[500] }]}>
                    Next: {item.nextBillingDate}
                </Text>
            </View>
            <View style={styles.subDetails}>
                <Text style={[styles.amountText, { color: theme.text }]}>
                    {item.priceCents / 100} {item.currency}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('account.subscriptions') || 'My Subscriptions'}
                </Text>
                <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {subscriptions && subscriptions.length > 0 ? (
                <FlatList
                    data={subscriptions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={80} color={theme.gray[300]} />
                    <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                        {t('subscriptions.noSubscriptions') || 'No active subscriptions found'}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    refreshButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    listContent: {
        padding: 16,
    },
    subItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    subIcon: {
        marginRight: 12,
    },
    subInfo: {
        flex: 1,
    },
    subTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    subDate: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    subDetails: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 15,
        fontFamily: Fonts.bold,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
    },
    statusText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: Fonts.medium,
        marginTop: 16,
    },
});
