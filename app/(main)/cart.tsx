import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts, cskColors } from '@/constants/theme';

export default function CartScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { cart, isLoading, removeFromCart, isRemoving } = useCart();

    const handleRemove = async (courseId: string) => {
        try {
            await removeFromCart(courseId);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to remove item');
        }
    };

    const handleCheckout = () => {
        if (!cart || cart.items.length === 0) return;
        router.push('/checkout');
    };

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.cartItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Image
                source={item.courseImage ? { uri: item.courseImage } : require('@/assets/images/course-placeholder.png')}
                style={styles.courseImage}
            />
            <View style={styles.itemDetails}>
                <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                </Text>
                {item.teacherName && (
                    <Text style={[styles.teacherName, { color: theme.gray[500] }]}>
                        {item.teacherName}
                    </Text>
                )}
                <Text style={[styles.billingType, { color: theme.gray[500] }]}>
                    {item.billingType === 'MONTHLY' ? 'Monthly Subscription' : 'One-time Payment'}
                </Text>
                <Text style={[styles.price, { color: theme.primary }]}>
                    {item.priceCents / 100} {item.currency || 'EGP'}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleRemove(item.courseId)}
                style={styles.removeButton}
                disabled={isRemoving}
            >
                <Ionicons name="trash-outline" size={20} color={theme.error[500]} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('cart.title') || 'Your Cart'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {cart?.items && cart.items.length > 0 ? (
                <>
                    <FlatList
                        data={cart.items}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.courseId}
                        contentContainerStyle={styles.listContent}
                    />
                    <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: theme.gray[500] }]}>Total</Text>
                            <Text style={[styles.totalAmount, { color: theme.text }]}>
                                {cart.totalCents / 100} {cart.currency}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
                            onPress={handleCheckout}
                        >
                            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color={theme.gray[300]} />
                    <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                        Your cart is empty
                    </Text>
                    <TouchableOpacity
                        style={[styles.startShoppingBtn, { borderColor: theme.primary }]}
                        onPress={() => router.push('/courses')}
                    >
                        <Text style={[styles.startShoppingText, { color: theme.primary }]}>
                            Start Shopping
                        </Text>
                    </TouchableOpacity>
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
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    cartItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        alignItems: 'center',
    },
    courseImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    courseTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 2,
    },
    teacherName: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    billingType: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    price: {
        fontSize: 15,
        fontFamily: Fonts.bold,
    },
    removeButton: {
        padding: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
        paddingBottom: 34, // Safe area
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    totalAmount: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    checkoutButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    checkoutText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Fonts.bold,
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
        marginBottom: 24,
    },
    startShoppingBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
    },
    startShoppingText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
});
