import { TabBarIcon, useTabBarStyles } from '@/components/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Tabs } from 'expo-router';

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
                    lazy: true,
                    title: t('tabs.home'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="course"
                options={{
                    lazy: true,
                    title: t('tabs.course'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="book-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    lazy: true,
                    title: t('tabs.chat'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="chatbubbles-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    lazy: true,
                    title: t('tabs.account'),
                    tabBarIcon: ({ color, size }) => (
                        <TabBarIcon name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
