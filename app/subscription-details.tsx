import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionDetails, useSubscriptions } from '@/hooks/useSubscriptions';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

export default function SubscriptionDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { data: subscription, isLoading } = useSubscriptionDetails(id as string);
    const { cancelSubscription, isCancelling } = useSubscriptions();

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!subscription) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Subscription not found</Text>
            </View>
        );
    }

    const handleCancel = () => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel this subscription? You will still have access until the end of the current billing period.',
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes, Cancel', 
                    style: 'destructive',
                    onPress: () => cancelSubscription(subscription.id)
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return theme.csk[600];
            case 'CANCELLED': return theme.error[500];
            case 'EXPIRED': return theme.gray[500];
            case 'PAST_DUE': return '#FF9800';
            default: return theme.gray[500];
        }
    };

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Subscription Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar-outline" size={48} color={theme.primary} />
                        <View style={styles.cardHeaderInfo}>
                            <Text style={[styles.courseTitle, { color: theme.text }]}>
                                {subscription.courseTitle || 'Course Subscription'}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(subscription.status) }]}>
                                    {subscription.status}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={[styles.label, { color: theme.gray[500] }]}>Subscription ID</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{subscription.id}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.label, { color: theme.gray[500] }]}>Price</Text>
                        <Text style={[styles.value, { color: theme.text }]}>
                            {subscription.priceCents / 100} {subscription.currency} / {subscription.billingCycle}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.label, { color: theme.gray[500] }]}>Started On</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{subscription.startedAt}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.label, { color: theme.gray[500] }]}>Next Billing Date</Text>
                        <Text style={[styles.value, { color: theme.text }]}>{subscription.nextBillingDate}</Text>
                    </View>

                    {subscription.cancelledAt && (
                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: theme.gray[500] }]}>Cancelled On</Text>
                            <Text style={[styles.value, { color: theme.text }]}>{subscription.cancelledAt}</Text>
                        </View>
                    )}
                </View>

                {subscription.status === 'ACTIVE' && (
                    <TouchableOpacity 
                        style={[styles.cancelButton, { backgroundColor: theme.error[50] }]} 
                        onPress={handleCancel}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color={theme.error[600]} />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={20} color={theme.error[600]} />
                                <Text style={[styles.cancelButtonText, { color: theme.error[600] }]}>
                                    Cancel Subscription
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
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
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardHeaderInfo: {
        marginLeft: 16,
        flex: 1,
    },
    courseTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 20,
    },
    detailRow: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
});
