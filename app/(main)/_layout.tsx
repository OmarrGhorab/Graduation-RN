import { Tabs } from 'expo-router';
import { TabBarIcon, useTabBarStyles } from '@/components/navigation';

export default function MainLayout() {
    const { tabBarStyle, tabBarLabelStyle, activeTintColor, inactiveTintColor } = useTabBarStyles();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle,
                tabBarActiveTintColor: activeTintColor,
                tabBarInactiveTintColor: inactiveTintColor,
                tabBarLabelStyle,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="course"
                options={{
                    title: 'Course',
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="book-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="qr"
                options={{
                    title: 'QR',
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="qr-code-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
