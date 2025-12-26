import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';
import { RoleOption } from './RolePickerModal';

interface RoleSelectorProps {
    roles: RoleOption[];
    selectedRole: string;
    onPress: () => void;
}

export const RoleSelector = ({ roles, selectedRole, onPress }: RoleSelectorProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const selectedRoleLabel = roles.find(r => r.id === selectedRole)?.label;
    
    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <View style={[styles.labelContainer, { backgroundColor: theme.background }]}>
                    <Text style={[styles.label, { color: theme.icon, fontFamily: Fonts.medium }]}>
                        {t('onboarding.role')}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.input, { 
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                    }]}
                    onPress={onPress}
                >
                    <Text style={[
                        styles.inputText, 
                        { 
                            color: selectedRole ? theme.text : theme.icon,
                            fontFamily: Fonts.regular,
                        }
                    ]}>
                        {selectedRoleLabel || t('onboarding.selectYourRole')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.icon} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    inputWrapper: {
        position: 'relative',
        paddingTop: 8,
    },
    labelContainer: {
        position: 'absolute',
        top: 0,
        left: 12,
        zIndex: 1,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 12,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
    },
    inputText: {
        fontSize: 16,
        flex: 1,
    },
});
