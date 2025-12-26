import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from './SkeletonBox';

export const SkeletonHistoryItem = () => {
    const { theme } = useTheme();
    
    return (
        <View style={styles.historyItem}>
            <View style={styles.timeline}>
                <SkeletonBox width={10} height={10} style={{ borderRadius: 5, marginTop: 4 }} />
                <View style={[styles.timelineLine, { backgroundColor: theme.gray[200] }]} />
            </View>
            <View style={[styles.historyContent, { backgroundColor: theme.surface }]}>
                <View style={styles.historyHeader}>
                    <SkeletonBox width={60} height={14} />
                    <SkeletonBox width={80} height={12} />
                </View>
                <SkeletonBox width="100%" height={80} style={{ borderRadius: 8, marginBottom: 8 }} />
                <View style={styles.historyLocation}>
                    <SkeletonBox width={14} height={14} style={{ borderRadius: 4 }} />
                    <SkeletonBox width="70%" height={13} style={{ marginLeft: 6 }} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    historyItem: { 
        flexDirection: 'row', 
        marginBottom: 4 
    },
    timeline: { 
        width: 24, 
        alignItems: 'center' 
    },
    timelineLine: { 
        flex: 1, 
        width: 2, 
        marginVertical: 4 
    },
    historyContent: { 
        flex: 1, 
        borderRadius: 12, 
        padding: 12, 
        marginLeft: 8, 
        marginBottom: 8 
    },
    historyHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    historyLocation: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 4 
    },
});
