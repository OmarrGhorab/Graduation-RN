import { Tabs } from 'expo-router';
import { TabBarIcon, useTabBarStyles } from '@/components/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function MainLayout() {
    const { tabBarStyle, tabBarLabelStyle, activeTintColor, inactiveTintColor } = useTabBarStyles();
    const { t } = useTranslation();

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
                    title: t('tabs.home'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="course"
                options={{
                    title: t('tabs.course'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="book-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="qr"
                options={{
                    title: t('tabs.qr'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="qr-code-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: t('tabs.account'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
