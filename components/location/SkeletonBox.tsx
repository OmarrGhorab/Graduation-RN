import { useTheme } from '@/hooks/useTheme';
import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface SkeletonBoxProps {
    width: number | string;
    height: number;
    style?: ViewStyle;
}

export const SkeletonBox = ({ width, height, style }: SkeletonBoxProps) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const { theme } = useTheme();

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    backgroundColor: theme.gray[200],
                    borderRadius: 8,
                    opacity
                } as any,
                style
            ]}
        />
    );
};
