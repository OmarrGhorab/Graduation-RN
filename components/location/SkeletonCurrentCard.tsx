import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from './SkeletonBox';

export const SkeletonCurrentCard = () => {
    const { theme } = useTheme();
    
    return (
        <View style={[styles.currentCard, { 
            backgroundColor: theme.csk[50], 
            borderColor: theme.csk[200] 
        }]}>
            <View style={styles.currentHeader}>
                <SkeletonBox width={120} height={24} style={{ borderRadius: 12 }} />
                <SkeletonBox width={80} height={16} />
            </View>
            <SkeletonBox width="100%" height={150} style={{ borderRadius: 12, marginBottom: 12 }} />
            <View style={styles.currentLocation}>
                <SkeletonBox width={20} height={20} style={{ borderRadius: 4 }} />
                <SkeletonBox width="80%" height={16} style={{ marginLeft: 8 }} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    currentCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    currentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    currentLocation: { 
        flexDirection: 'row', 
        alignItems: 'flex-start' 
    },
});
