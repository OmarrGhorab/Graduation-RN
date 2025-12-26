import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export const EmptyChildrenState = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    
    return (
        <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
            <Ionicons 
                name="people-outline" 
                size={48} 
                color={theme.gray[300]} 
            />
            <Text style={[styles.emptyText, { 
                color: theme.gray[500],
                fontFamily: Fonts?.semiBold 
            }]}>
                No linked children
            </Text>
            <Text style={[styles.emptySubtext, { 
                color: theme.gray[400],
                fontFamily: Fonts?.regular 
            }]}>
                Link with your children to track their location
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 16,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
