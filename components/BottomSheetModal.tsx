import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

interface BottomSheetModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    height?: number;
}

export default function BottomSheetModal({
    visible,
    onClose,
    children,
    height = SCREEN_HEIGHT * 0.6,
}: BottomSheetModalProps) {
    const { theme, isDark } = useTheme();
    
    const translateY = useRef(new Animated.Value(height)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > SWIPE_THRESHOLD || gestureState.vy > 0.5) {
                    closeModal();
                } else {
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            openModal();
        } else {
            translateY.setValue(height);
            opacity.setValue(0);
        }
    }, [visible]);

    const openModal = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: height,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={closeModal}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={closeModal}>
                    <Animated.View
                        style={[
                            styles.backdrop,
                            { opacity },
                        ]}
                    />
                </TouchableWithoutFeedback>

                {/* Bottom Sheet */}
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        {
                            height,
                            backgroundColor: isDark ? theme.background : '#FFFFFF',
                            transform: [{ translateY }],
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    {/* Drag Handle */}
                    <View style={styles.dragHandleContainer}>
                        <View style={[
                            styles.dragHandle, 
                            { backgroundColor: isDark ? theme.gray[600] : '#D1D5DB' }
                        ]} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>{children}</View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
});
