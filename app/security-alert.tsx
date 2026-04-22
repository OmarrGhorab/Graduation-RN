import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SecurityAlertScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();

    // Parse the data from params
    // Data might be passed as a JSON string or as individual params depending on how we navigate
    const deviceName = params.deviceName as string || 'Unknown Device';
    const platform = params.platform as string || 'Unknown Platform';
    const ipAddress = params.ipAddress as string || 'Unknown IP';
    const timestamp = params.timestamp as string || new Date().toISOString();
    const securityTip = params.securityTip as string || 'Secure your account immediately.';

    const formattedDate = new Date(timestamp).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0d0d0d' : '#f8f9fa' }]}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient
                colors={['#dc2626', '#991b1b']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('security.alertTitle') || 'Security Alert'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.shieldContainer}>
                    <View style={styles.pulseContainer}>
                        <Animated.View entering={FadeInUp.delay(400)} style={styles.pulseInner} />
                        <MaterialCommunityIcons name="shield-alert" size={80} color="#FFF" />
                    </View>
                </Animated.View>
            </LinearGradient>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(300)} style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#FFF' }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#000' }]}>
                        {t('security.loginAttempt') || 'New Login Attempt Blocked'}
                    </Text>
                    <Text style={[styles.cardDescription, { color: theme.gray[500] }]}>
                        {t('security.description') || 'A login attempt from an unrecognized device was detected and blocked for your safety.'}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: theme.gray[400] }]}>{t('security.device') || 'Device'}</Text>
                            <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#000' }]}>{deviceName} ({platform})</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="globe-outline" size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: theme.gray[400] }]}>{t('security.ipAddress') || 'IP Address'}</Text>
                            <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#000' }]}>{ipAddress}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="time-outline" size={20} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.detailLabel, { color: theme.gray[400] }]}>{t('security.time') || 'Time'}</Text>
                            <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#000' }]}>{formattedDate}</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View 
                    entering={FadeInDown.delay(500)} 
                    style={[
                        styles.tipCard, 
                        { 
                            backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : '#fef2f2', 
                            borderColor: isDark ? 'rgba(220, 38, 38, 0.3)' : '#fecaca' 
                        }
                    ]}
                >
                    <Ionicons name="bulb-outline" size={24} color="#dc2626" />
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>{t('security.recommendation') || 'Security Recommendation'}</Text>
                        <Text style={[styles.tipText, { color: isDark ? '#fca5a5' : '#7f1d1d' }]}>{securityTip}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(700)} style={styles.actions}>
                    <TouchableOpacity 
                        style={[styles.primaryButton, { backgroundColor: '#dc2626' }]}
                        onPress={() => router.push('/edit-profile')}
                    >
                        <Text style={styles.primaryButtonText}>{t('security.changePassword') || 'Change Password'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.gray[500] }]}>
                            {t('security.itWasMe') || 'It was me, ignore'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 280,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: '#FFF',
    },
    shieldContainer: {
        marginTop: 20,
    },
    pulseContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseInner: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    content: {
        flex: 1,
        marginTop: -40,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 20,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    tipCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 20,
        gap: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        color: '#dc2626',
        marginBottom: 4,
    },
    tipText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#7f1d1d',
        lineHeight: 18,
    },
    actions: {
        marginTop: 32,
        gap: 12,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    secondaryButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
});
