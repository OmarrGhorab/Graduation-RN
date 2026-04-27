import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePayments } from '@/hooks/usePayments';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

export default function PaymentMethodsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { savedMethods, isLoadingMethods, deleteMethod, refetchMethods } = usePayments();

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Payment Method',
            'Are you sure you want to remove this card?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMethod(id);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete payment method');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.cardItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardIcon}>
                <Ionicons name="card" size={32} color={theme.primary} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={[styles.cardBrand, { color: theme.text }]}>
                    {item.CardBrand.toUpperCase()} {item.IsDefault && (
                        <Text style={[styles.defaultBadge, { color: theme.primary }]}> (Default)</Text>
                    )}
                </Text>
                <Text style={[styles.cardLast4, { color: theme.gray[500] }]}>
                    **** **** **** {item.LastFour}
                </Text>
            </View>
            <TouchableOpacity 
                onPress={() => handleDelete(item.ID)}
                style={styles.deleteButton}
            >
                <Ionicons name="trash-outline" size={24} color={theme.error[500]} />
            </TouchableOpacity>
        </View>
    );

    if (isLoadingMethods) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('account.paymentMethods') || 'Payment Methods'}
                </Text>
                <TouchableOpacity onPress={() => refetchMethods()} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {savedMethods && savedMethods.length > 0 ? (
                <FlatList
                    data={savedMethods}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.ID}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="card-outline" size={80} color={theme.gray[300]} />
                    <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                        No saved payment methods
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
    cardItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    cardIcon: {
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardBrand: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginBottom: 2,
    },
    cardLast4: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    defaultBadge: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    deleteButton: {
        padding: 8,
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
