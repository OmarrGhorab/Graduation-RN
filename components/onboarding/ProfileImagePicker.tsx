import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/libs/theme';

interface ProfileImagePickerProps {
    profileImg: string;
    isLoading: boolean;
    onPress: () => void;
}

export const ProfileImagePicker = ({ 
    profileImg, 
    isLoading, 
    onPress 
}: ProfileImagePickerProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.imageWrapper, { borderColor: theme.primary }]}
                onPress={onPress}
                disabled={isLoading}
            >
                {isLoading ? (
                    <View style={[styles.placeholder, { backgroundColor: isDark ? theme.surface : '#F7F8F9' }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : profileImg ? (
                    <Image source={{ uri: profileImg }} style={styles.image} />
                ) : (
                    <View style={[styles.placeholder, { backgroundColor: isDark ? theme.surface : '#F7F8F9' }]}>
                        <Ionicons name="person-add" size={40} color={theme.primary} />
                        <Text style={[styles.placeholderText, { 
                            color: theme.primary,
                            fontFamily: Fonts?.semiBold 
                        }]}>
                            Add Photo
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
            <Text style={[styles.sizeLabel, { 
                color: isDark ? theme.gray[500] : '#696F77',
                fontFamily: Fonts?.regular 
            }]}>
                74x74 (Optional)
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 30,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 4,
        fontSize: 12,
    },
    sizeLabel: {
        fontSize: 12,
    },
});
