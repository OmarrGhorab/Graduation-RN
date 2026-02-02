
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface MessageActionSheetProps {
    visible: boolean;
    onClose: () => void;
    onReply: () => void;
    onPin: () => void;
    onCopy: () => void;
    onDelete: () => void;
    isDark: boolean;
    theme: any;
    message?: Message | null;
    canDelete?: boolean;
    canPin?: boolean;
    canKick?: boolean;
    isPinned?: boolean;
}

export function MessageActionSheet({
    visible,
    onClose,
    onReply,
    onPin,
    onCopy,
    onDelete,
    onKick,
    isDark,
    theme,
    message,
    canDelete,
    canPin,
    canKick,
    isPinned
}: MessageActionSheetProps & { onKick: () => void }) {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.backdrop} />

                    <View style={[
                        styles.sheetContainer,
                        { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }
                    ]}>
                        {/* Drag Handle */}
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: isDark ? '#2a3e35' : '#cfe8dc' }]} />
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsContainer}>
                            <ActionItem
                                icon="arrow-undo-outline"
                                label="Reply"
                                onPress={onReply}
                                theme={theme}
                                isDark={isDark}
                            />

                            {canPin && (
                                <ActionItem
                                    icon={isPinned ? "star" : "star-outline"}
                                    label={isPinned ? "Unpin Message" : "Pin Message"}
                                    onPress={onPin}
                                    theme={theme}
                                    isDark={isDark}
                                />
                            )}

                            <ActionItem
                                icon="copy-outline"
                                label="Copy Text"
                                onPress={onCopy}
                                theme={theme}
                                isDark={isDark}
                            />

                            {(canDelete || canKick) && (
                                <View style={[styles.divider, { backgroundColor: isDark ? '#2a3e35' : '#e2e8e5' }]} />
                            )}

                            {canDelete && (
                                <ActionItem
                                    icon="trash-outline"
                                    label="Delete Message"
                                    onPress={onDelete}
                                    theme={theme}
                                    isDark={isDark}
                                    isDestructive
                                />
                            )}

                            {canKick && (
                                <ActionItem
                                    icon="person-remove-outline"
                                    label="Remove User"
                                    onPress={onKick}
                                    theme={theme}
                                    isDark={isDark}
                                    isDestructive
                                />
                            )}
                        </View>

                        <View style={{ height: 20 }} />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

function ActionItem({ icon, label, onPress, theme, isDark, isDestructive }: any) {
    const textColor = isDestructive ? '#DF0909' : (isDark ? '#e7f3ee' : '#0d1c15');
    const iconColor = isDestructive ? '#DF0909' : theme.primary; // Using primary for icon based on design, or gray? Design shows different background.

    // Design has icon wrapped in a square
    const iconBg = isDestructive ? 'rgba(223, 9, 9, 0.1)' : 'rgba(9, 124, 70, 0.1)';

    return (
        <TouchableOpacity
            style={styles.actionButton}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={isDestructive ? 'rgba(223, 9, 9, 0.4)' : '#9ca3af'} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheetContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 6,
        borderRadius: 3,
    },
    controlsLabelContainer: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        marginBottom: 8,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionsContainer: {
        flexDirection: 'column',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 16,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginHorizontal: 24,
        marginVertical: 8,
    }
});
