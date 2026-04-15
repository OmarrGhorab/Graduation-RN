import { TabBarIcon, useTabBarStyles } from '@/components/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useTotalUnreadCount } from '@/hooks/useUnreadCount';
import { Tabs } from 'expo-router';

export default function MainLayout() {
    const { tabBarStyle, tabBarLabelStyle, activeTintColor, inactiveTintColor } = useTabBarStyles();
    const { t } = useTranslation();
    const { totalUnread } = useTotalUnreadCount();

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
                name="courses"
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
                        <TabBarIcon name="chatbubbles-outline" size={size} color={color} badge={totalUnread} />
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
            <Tabs.Screen
                name="cart"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="payment-history"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="payment-methods"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="teachers"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
