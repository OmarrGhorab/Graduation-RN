import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, grayColors } from '@/constants/theme';

export default function MainLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: cskColors[500],
                tabBarInactiveTintColor: grayColors[500],
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="course"
                options={{
                    title: 'Course',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="qr"
                options={{
                    title: 'QR',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="qr-code-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: grayColors[100],
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
});
