import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/libs/theme';
import { useTranslation } from '@/hooks/useTranslation';
import BottomSheetModal from '@/components/BottomSheetModal';

interface ImageOptionsSheetProps {
    visible: boolean;
    onClose: () => void;
    hasImage: boolean;
    onTakePhoto: () => void;
    onPickImage: () => void;
    onDeleteImage: () => void;
}

export const ImageOptionsSheet = ({
    visible,
    onClose,
    hasImage,
    onTakePhoto,
    onPickImage,
    onDeleteImage,
}: ImageOptionsSheetProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    const { t } = useTranslation();
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    return (
        <BottomSheetModal 
            visible={visible} 
            onClose={onClose} 
            height={hasImage ? 300 : 250}
        >
            <View style={[styles.header, { borderBottomColor: isDark ? theme.border : '#E5E5E5' }]}>
                <Text style={[styles.title, { 
                    color: isDark ? theme.text : '#11181C',
                    fontFamily: Fonts?.semiBold 
                }]}>
                    {t('onboarding.profilePhoto')}
                </Text>
            </View>
            
            <TouchableOpacity style={[styles.optionButton, { borderBottomColor: isDark ? theme.border : '#F5F5F5' }]} onPress={onTakePhoto}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surface : '#F7F8F9' }]}>
                    <Ionicons name="camera-outline" size={22} color={theme.primary} />
                </View>
                <Text style={[styles.optionText, { 
                    color: isDark ? theme.text : '#11181C',
                    fontFamily: Fonts?.medium 
                }]}>
                    {t('onboarding.takePhoto')}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.optionButton, { borderBottomColor: isDark ? theme.border : '#F5F5F5' }]} onPress={onPickImage}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surface : '#F7F8F9' }]}>
                    <Ionicons name="images-outline" size={22} color={theme.primary} />
                </View>
                <Text style={[styles.optionText, { 
                    color: isDark ? theme.text : '#11181C',
                    fontFamily: Fonts?.medium 
                }]}>
                    {t('onboarding.chooseFromGallery')}
                </Text>
            </TouchableOpacity>
            
            {hasImage && (
                <TouchableOpacity style={[styles.optionButton, { borderBottomColor: isDark ? theme.border : '#F5F5F5' }]} onPress={onDeleteImage}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surface : '#F7F8F9' }]}>
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.optionText, { 
                        color: '#EF4444',
                        fontFamily: Fonts?.medium 
                    }]}>
                        {t('onboarding.deletePhoto')}
                    </Text>
                </TouchableOpacity>
            )}
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
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
    },
});
