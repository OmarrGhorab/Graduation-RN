import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { SkeletonBox } from './SkeletonBox';

export const SkeletonLocationCard = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    
    return (
        <View style={[styles.locationCard, { 
            backgroundColor: theme.background,
            borderColor: theme.border,
        }]}>
            <View style={styles.cardHeader}>
                <SkeletonBox width={44} height={44} style={{ borderRadius: 22 }} />
                <View style={styles.cardInfo}>
                    <SkeletonBox width={120} height={16} style={{ marginBottom: 6 }} />
                    <SkeletonBox width={80} height={12} />
                </View>
                <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
            </View>
            <View style={[styles.locationDetails, { backgroundColor: theme.surface }]}>
                <SkeletonBox width="100%" height={120} style={{ borderRadius: 0 }} />
                <View style={styles.addressContainer}>
                    <SkeletonBox width={16} height={16} style={{ borderRadius: 4 }} />
                    <SkeletonBox width="80%" height={14} style={{ marginLeft: 8 }} />
                </View>
                <View style={styles.accuracyContainer}>
                    <SkeletonBox width={14} height={14} style={{ borderRadius: 4 }} />
                    <SkeletonBox width={150} height={12} style={{ marginLeft: 6 }} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    locationCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    locationDetails: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        paddingBottom: 8,
    },
    accuracyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
});
