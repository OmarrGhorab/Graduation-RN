import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePayments } from '@/hooks/usePayments';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, cskColors } from '@/constants/theme';

export default function PaymentHistoryScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { paymentHistory, isLoadingHistory, refetchHistory } = usePayments();

    const goBackToAccount = () => {
        router.replace('/(main)/account');
    };

    if (isLoadingHistory) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.historyItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.historyIcon}>
                <Ionicons 
                    name={item.status === 'PAID' ? "checkmark-circle" : "alert-circle"} 
                    size={32} 
                    color={item.status === 'PAID' ? theme.primary : theme.error[500]} 
                />
            </View>
            <View style={styles.historyInfo}>
                <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.items[0]?.title || item.orderType || 'Course Enrollment'}
                </Text>
                <Text style={[styles.historyDate, { color: theme.gray[500] }]}>
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <View style={styles.historyAmount}>
                <Text style={[styles.amountText, { color: theme.text }]}>
                    {item.amountCents / 100} {item.currency}
                </Text>
                <Text style={[
                    styles.statusText, 
                    { color: item.status === 'PAID' ? theme.csk[600] : theme.error[600] }
                ]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBackToAccount} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Payment History</Text>
                <TouchableOpacity onPress={() => refetchHistory()} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {paymentHistory && paymentHistory.length > 0 ? (
                <FlatList
                    data={paymentHistory}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.orderId}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={80} color={theme.gray[300]} />
                    <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                        No payment history found
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
    historyItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    historyIcon: {
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    historyAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 15,
        fontFamily: Fonts.bold,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        marginTop: 2,
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
