import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import BottomSheetModal from '@/components/BottomSheetModal';

export interface RoleOption {
    id: string;
    label: string;
    description: string;
}

interface RolePickerModalProps {
    visible: boolean;
    onClose: () => void;
    roles: RoleOption[];
    selectedRole: string;
    onSelectRole: (roleId: string) => void;
}

export const RolePickerModal = ({ 
    visible, 
    onClose, 
    roles, 
    selectedRole, 
    onSelectRole 
}: RolePickerModalProps) => {
    const { theme } = useTheme();
    
    const handleSelect = (roleId: string) => {
        onSelectRole(roleId);
        onClose();
    };
    
    return (
        <BottomSheetModal
            visible={visible}
            onClose={onClose}
            height={450}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.semiBold }]}>
                    Select Role
                </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={[styles.option, { borderBottomColor: theme.divider }]}
                        onPress={() => handleSelect(role.id)}
                    >
                        <View style={styles.optionContent}>
                            <Text style={[styles.optionText, { 
                                color: theme.text, 
                                fontFamily: Fonts.regular 
                            }]}>
                                {role.label}
                            </Text>
                            <Text style={[styles.optionDescription, { 
                                color: theme.gray[500], 
                                fontFamily: Fonts.regular 
                            }]}>
                                {role.description}
                            </Text>
                        </View>
                        {selectedRole === role.id && (
                            <Ionicons name="checkmark" size={20} color={theme.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    optionContent: {
        flex: 1,
    },
    optionText: {
        fontSize: 16,
    },
    optionDescription: {
        fontSize: 14,
        marginTop: 2,
    },
});
