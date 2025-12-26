import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ImageOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onPickImage: () => void;
}

export function ImageOptionsModal({ 
    visible, 
    onClose, 
    onTakePhoto, 
    onPickImage 
}: ImageOptionsModalProps) {
    const { theme, isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            Change Profile Picture
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.optionButton, { backgroundColor: theme.surface }]}
                            onPress={onTakePhoto}
                        >
                            <Ionicons name="camera-outline" size={24} color={theme.gray[700]} />
                            <Text style={[styles.optionText, { color: theme.gray[700] }]}>
                                Take Photo
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionButton, { backgroundColor: theme.surface }]}
                            onPress={onPickImage}
                        >
                            <Ionicons name="images-outline" size={24} color={theme.gray[700]} />
                            <Text style={[styles.optionText, { color: theme.gray[700] }]}>
                                Choose from Gallery
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.optionButton, 
                                styles.cancelButton,
                                { backgroundColor: isDark ? theme.error[50] : '#FEF2F2' }
                            ]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelText, { color: theme.error[500] }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        marginBottom: 20,
        textAlign: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
    },
    optionText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginLeft: 16,
    },
    cancelButton: {
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        textAlign: 'center',
    },
});
