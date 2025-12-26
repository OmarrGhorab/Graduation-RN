import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

type Parent = { 
    id: string; 
    username: string; 
    name: string; 
    profileImg?: string;
};

interface ParentSearchSectionProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchResults: Parent[];
    selectedParents: Parent[];
    isSearching: boolean;
    onSelectParent: (parent: Parent) => void;
    onRemoveParent: (parentId: string) => void;
}

export const ParentSearchSection = ({
    searchQuery,
    onSearchChange,
    searchResults,
    selectedParents,
    isSearching,
    onSelectParent,
    onRemoveParent,
}: ParentSearchSectionProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    // Filter out already selected parents from results
    const selectedIds = new Set(selectedParents.map(p => p.id));
    const filteredResults = searchResults.filter(user => !selectedIds.has(user.id));

    const renderAvatar = (profileImg?: string, size: number = 40) => {
        if (profileImg) {
            return (
                <Image 
                    source={{ uri: profileImg }} 
                    style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} 
                />
            );
        }
        return (
            <View 
                style={[
                    styles.avatar, 
                    styles.avatarPlaceholder,
                    { 
                        width: size, 
                        height: size, 
                        borderRadius: size / 2,
                        backgroundColor: theme.gray[100],
                    }
                ]}
            >
                <Ionicons name="person" size={size / 2} color={theme.gray[400]} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>{t('onboarding.searchParent')}</Text>
            <Text style={[styles.subtitle, { color: theme.gray[500] }]}>
                {t('onboarding.searchParentSubtitle')}
            </Text>

            {/* Search Input with floating label */}
            <View style={styles.inputWrapper}>
                <View style={[styles.labelContainer, { backgroundColor: theme.background }]}>
                    <Text style={[styles.label, { color: theme.icon }]}>{t('onboarding.parentNameUsername')}</Text>
                </View>
                <View style={[styles.searchInputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder={t('onboarding.searchPlaceholder')}
                        placeholderTextColor={theme.icon}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => onSearchChange('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color={theme.gray[400]} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Selected Parents */}
            {selectedParents.length > 0 && (
                <View style={[styles.selectedContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.selectedLabel, { color: theme.gray[500] }]}>
                        {t('onboarding.selectedParents')} ({selectedParents.length}):
                    </Text>
                    {selectedParents.map((parent) => (
                        <View 
                            key={parent.id} 
                            style={[styles.selectedItem, { backgroundColor: theme.background }]}
                        >
                            {renderAvatar(parent.profileImg)}
                            <View style={styles.parentDetails}>
                                <Text style={[styles.parentName, { color: theme.text }]}>
                                    {parent.name}
                                </Text>
                                <Text style={[styles.parentUsername, { color: theme.gray[500] }]}>
                                    @{parent.username}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => onRemoveParent(parent.id)}
                            >
                                <Ionicons name="close-circle" size={22} color={theme.gray[400]} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Search Results / Loading / Empty State */}
            {isSearching ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.gray[500] }]}>
                        {t('onboarding.searching')}
                    </Text>
                </View>
            ) : (
                <>
                    {filteredResults.length > 0 ? (
                        <View style={styles.resultsContainer}>
                            {filteredResults.map((user) => (
                                <View 
                                    key={user.id} 
                                    style={[styles.resultItem, { borderBottomColor: theme.divider }]}
                                >
                                    {renderAvatar(user.profileImg)}
                                    <View style={styles.parentDetails}>
                                        <Text style={[styles.parentName, { color: theme.text }]}>
                                            {user.name}
                                        </Text>
                                        <Text style={[styles.parentUsername, { color: theme.gray[500] }]}>
                                            @{user.username}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.selectButton, { backgroundColor: theme.primary }]}
                                        onPress={() => onSelectParent(user)}
                                    >
                                        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                                        <Text style={styles.selectButtonText}>{t('onboarding.select')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        searchQuery.trim().length > 0 && searchResults.length === 0 && (
                            <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
                                <Ionicons name="search-outline" size={40} color={theme.gray[300]} />
                                <Text style={[styles.emptyText, { color: theme.gray[400] }]}>
                                    {t('onboarding.noUsersFound')} "{searchQuery}"
                                </Text>
                            </View>
                        )
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginBottom: 16,
    },
    inputWrapper: {
        marginBottom: 16,
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
        fontFamily: Fonts.medium,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
        height: '100%',
    },
    clearButton: {
        padding: 4,
    },
    selectedContainer: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    selectedLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    selectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        padding: 8,
    },
    avatar: {
        marginRight: 12,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    parentDetails: {
        flex: 1,
    },
    parentName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    parentUsername: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    removeButton: {
        padding: 4,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    resultsContainer: {
        marginTop: 8,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    selectButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        borderRadius: 12,
        marginTop: 10,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
});
