import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ScrollView,
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useCart } from '@/hooks/useCart';
import { usePayments } from '@/hooks/usePayments';
import { useAuthStore } from '@/libs/auth';
import { Fonts, cskColors } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();
    const { theme, isDark } = useTheme();
    const { user } = useAuthStore();
    const { cart, checkout, isCheckingOut } = useCart();
    const { savedMethods, isLoadingMethods, directEnroll, isEnrolling } = usePayments();

    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
    const [paymentType, setPaymentType] = useState<'CARD' | 'WALLET'>('CARD');
    const [isProcessing, setIsProcessing] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [saveCard, setSaveCard] = useState(true);

    // If direct buy from course details
    const courseId = params.courseId as string;

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            if (!phoneNumber || phoneNumber.length < 5) {
                Alert.alert(t('checkout.missingInfo'), t('checkout.enterPhone'));
                setIsProcessing(false);
                return;
            }

            let response;
            if (courseId) {
                // Direct Enroll
                response = await directEnroll({
                    courseId,
                    paymentMethod: selectedMethodId ? 'TOKEN' : paymentType,
                    paymentMethodId: selectedMethodId || undefined,
                    saveCard: selectedMethodId ? false : (paymentType === 'CARD' ? saveCard : false),
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                });
            } else {
                // Checkout Cart
                response = await checkout({
                    paymentMethod: selectedMethodId ? 'TOKEN' : paymentType,
                    paymentMethodId: selectedMethodId || undefined,
                    saveCard: selectedMethodId ? false : (paymentType === 'CARD' ? saveCard : false),
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                });
            }

            if (response.success && response.data.paymentUrl) {
                setPaymentUrl(response.data.paymentUrl);
            } else if (response.success && response.data.status === 'SUCCESS') {
                handleSuccess();
            } else {
                Alert.alert(t('checkout.paymentInitialized'), t('checkout.waitingConfirmation'));
            }
        } catch (error: any) {
            // Edge case: Handle status 400 but valid success payload (contains paymentUrl)
            if (error.data?.success && error.data?.data?.paymentUrl) {
                setPaymentUrl(error.data.data.paymentUrl);
                return;
            }
            
            Alert.alert(t('checkout.paymentError'), error.message || t('checkout.paymentError'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSuccess = () => {
        setPaymentUrl(null);
        Alert.alert(t('common.success'), t('checkout.paymentSuccess'), [
            { text: t('common.ok'), onPress: () => router.replace('/(main)/home') }
        ]);
    };

    const handleNavigationStateChange = (navState: any) => {
        const { url } = navState;
        console.log('[Checkout] WebView Navigation:', url);

        // Paymob success patterns: check for success=true or specific callback keywords
        // We check for these keywords even if the domain is localhost and fails to load
        if (url.includes('success=true') || url.includes('payment_success') || url.includes('txn_response_code=0')) {
            console.log('[Checkout] Success detected in URL');
            handleSuccess();
        } else if (url.includes('success=false') || url.includes('payment_failed') || url.includes('error_occured=true')) {
            console.log('[Checkout] Failure detected in URL');
            setPaymentUrl(null);
            Alert.alert(t('checkout.paymentFailed'), t('checkout.paymentFailedMessage'));
        }
    };

    if (paymentUrl) {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.header, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity onPress={() => setPaymentUrl(null)} style={styles.backButton}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{t('checkout.securePayment')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <WebView
                    source={{ uri: paymentUrl }}
                    onNavigationStateChange={handleNavigationStateChange}
                    domStorageEnabled={true}
                    javaScriptEnabled={true}
                    originWhitelist={['*']}
                    mixedContentMode="always"
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('[Checkout] WebView Error:', nativeEvent);
                        handleNavigationStateChange(nativeEvent);
                    }}
                    onHttpError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('[Checkout] WebView HTTP Error:', nativeEvent);
                        handleNavigationStateChange(nativeEvent);
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={[StyleSheet.absoluteFill, styles.center]}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    )}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('checkout.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Summary Section */}
                <View style={[styles.section, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('checkout.totalAmount')}</Text>
                    <Text style={[styles.amountText, { color: theme.primary }]}>
                        {courseId ? t('courseDetails.priceLabel') : `${(cart?.totalCents || 0) / 100} ${cart?.currency || 'EGP'}`}
                    </Text>
                </View>

                {/* Payment Method Selection */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>{t('checkout.paymentMethod')}</Text>
                    <View style={styles.methodSelector}>
                        <TouchableOpacity
                            style={[
                                styles.methodToggle,
                                { 
                                    backgroundColor: paymentType === 'CARD' && !selectedMethodId ? theme.primary : theme.surface,
                                    borderColor: theme.border 
                                }
                            ]}
                            onPress={() => {
                                setPaymentType('CARD');
                                setSelectedMethodId(null);
                            }}
                        >
                            <Ionicons 
                                name="card" 
                                size={20} 
                                color={paymentType === 'CARD' && !selectedMethodId ? '#FFF' : theme.text} 
                            />
                            <Text style={[
                                styles.methodToggleText, 
                                { color: paymentType === 'CARD' && !selectedMethodId ? '#FFF' : theme.text }
                            ]}>{t('checkout.card')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.methodToggle,
                                { 
                                    backgroundColor: paymentType === 'WALLET' && !selectedMethodId ? theme.primary : theme.surface,
                                    borderColor: theme.border 
                                }
                            ]}
                            onPress={() => {
                                setPaymentType('WALLET');
                                setSelectedMethodId(null);
                            }}
                        >
                            <Ionicons 
                                name="wallet" 
                                size={20} 
                                color={paymentType === 'WALLET' && !selectedMethodId ? '#FFF' : theme.text} 
                            />
                            <Text style={[
                                styles.methodToggleText, 
                                { color: paymentType === 'WALLET' && !selectedMethodId ? '#FFF' : theme.text }
                            ]}>{t('checkout.wallet')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Saved Cards Section - Only show if Card is selected or we have saved methods */}
                {paymentType === 'CARD' && savedMethods.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>{t('checkout.savedCards')}</Text>
                        {savedMethods.map((method) => (
                            <TouchableOpacity
                                key={method.ID}
                                style={[
                                    styles.cardItem,
                                    { 
                                        backgroundColor: theme.surface, 
                                        borderColor: selectedMethodId === method.ID ? theme.primary : theme.border,
                                        borderWidth: selectedMethodId === method.ID ? 2 : 1
                                    }
                                ]}
                                onPress={() => {
                                    setSelectedMethodId(selectedMethodId === method.ID ? null : method.ID);
                                    if (selectedMethodId !== method.ID) setPaymentType('CARD');
                                }}
                            >
                                <Ionicons name="card-outline" size={24} color={theme.primary} />
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.cardBrand, { color: theme.text }]}>{method.CardBrand.toUpperCase()}</Text>
                                    <Text style={[styles.cardLast4, { color: theme.gray[500] }]}>**** **** **** {method.LastFour}</Text>
                                </View>
                                {selectedMethodId === method.ID && (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Billing Info */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>{t('checkout.billingInformation')}</Text>
                    <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TextInput
                            placeholder={t('checkout.firstName')}
                            placeholderTextColor={theme.gray[400]}
                            style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                        <TextInput
                            placeholder={t('checkout.lastName')}
                            placeholderTextColor={theme.gray[400]}
                            style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                        <TextInput
                            placeholder={t('checkout.email')}
                            placeholderTextColor={theme.gray[400]}
                            style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />
                        <TextInput
                            placeholder={t('checkout.phone')}
                            placeholderTextColor={theme.gray[400]}
                            style={[styles.input, { color: theme.text, borderBottomWidth: 0 }]}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                    </View>
                    
                    {(!selectedMethodId && paymentType === 'CARD') && (
                        <TouchableOpacity 
                            style={styles.checkboxContainer} 
                            onPress={() => setSaveCard(!saveCard)}
                        >
                            <Ionicons 
                                name={saveCard ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={theme.primary} 
                            />
                            <Text style={[styles.checkboxLabel, { color: theme.text }]}>{t('checkout.saveCard')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: theme.primary }]}
                    onPress={handlePayment}
                    disabled={isProcessing || isEnrolling || isCheckingOut || (!firstName || !lastName || !email || !phoneNumber)}
                >
                    {isProcessing || isEnrolling || isCheckingOut ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>
                                {selectedMethodId ? t('checkout.payWithSaved') : t('checkout.payVia', { method: paymentType === 'CARD' ? t('checkout.card') : t('checkout.wallet') })}
                            </Text>
                            <Ionicons name="lock-closed" size={18} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 60,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    methodSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    methodToggle: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
    },
    methodToggleText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    amountText: {
        fontSize: 32,
        fontFamily: Fonts.bold,
        marginTop: 8,
    },
    cardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    cardBrand: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    cardLast4: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    form: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    input: {
        height: 56,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        fontFamily: Fonts.medium,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 10,
    },
    checkboxLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        borderTopWidth: 1,
        paddingBottom: 34,
    },
    payButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    payButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
});
