import React from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, 
    ScrollView, Image, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ParentUser } from '@/services/ParentLinkService';

interface SearchParentModalProps {
    visible: boolean;
    searchQuery: string;
    searchResults: ParentUser[];
    isSearching: boolean;
    processingId: string | null;
    onClose: () => void;
    onSearchChange: (query: string) => void;
    onSendRequest: (parentId: string) => void;
}

export function SearchParentModal({
    visible,
    searchQuery,
    searchResults,
    isSearching,
    processingId,
    onClose,
    onSearchChange,
    onSendRequest,
}: SearchParentModalProps) {
    const { theme } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.text }]}>Find Parent</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.gray[600]} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                        <Ionicons name="search" size={20} color={theme.gray[400]} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search by name or username"
                            placeholderTextColor={theme.gray[400]}
                            value={searchQuery}
                            onChangeText={onSearchChange}
                            autoFocus
                        />
                        {searchQuery.length > 0 && !isSearching && (
                            <TouchableOpacity onPress={() => onSearchChange('')}>
                                <Ionicons name="close-circle" size={20} color={theme.gray[400]} />
                            </TouchableOpacity>
                        )}
                        {isSearching && <ActivityIndicator size="small" color={theme.primary} />}
                    </View>

                    <ScrollView style={styles.results}>
                        {isSearching ? (
                            <View style={styles.emptyContainer}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={[styles.emptyText, { color: theme.gray[500] }]}>Searching...</Text>
                            </View>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((parent) => (
                                <View key={parent.id} style={[styles.resultItem, { backgroundColor: theme.surface }]}>
                                    {parent.profileImg ? (
                                        <Image source={{ uri: parent.profileImg }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.csk[100] }]}>
                                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                                                {parent.name?.charAt(0) || '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.info}>
                                        <Text style={[styles.name, { color: theme.text }]}>{parent.name}</Text>
                                        <Text style={[styles.username, { color: theme.gray[500] }]}>@{parent.username}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.linkButton, { backgroundColor: theme.primary }]}
                                        onPress={() => onSendRequest(parent.id)}
                                        disabled={processingId === parent.id}
                                    >
                                        {processingId === parent.id ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.linkButtonText}>Link</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : searchQuery.trim() ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={48} color={theme.gray[300]} />
                                <Text style={[styles.emptyTitle, { color: theme.gray[600] }]}>No parents found</Text>
                                <Text style={[styles.emptySubtext, { color: theme.gray[400] }]}>
                                    Try a different name or username
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={48} color={theme.gray[300]} />
                                <Text style={[styles.emptyTitle, { color: theme.gray[600] }]}>Search for a parent</Text>
                                <Text style={[styles.emptySubtext, { color: theme.gray[400] }]}>
                                    Enter a name or username to find parents
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    content: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingBottom: 40, height: '70%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
    title: { fontSize: 18, fontFamily: Fonts.bold },
    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8 },
    searchInput: { flex: 1, fontSize: 16, fontFamily: Fonts.regular },
    results: { flex: 1, paddingHorizontal: 16 },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontFamily: Fonts.bold },
    info: { flex: 1, marginLeft: 12 },
    name: { fontSize: 15, fontFamily: Fonts.semiBold },
    username: { fontSize: 13, fontFamily: Fonts.regular },
    linkButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    linkButtonText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#FFFFFF' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, fontFamily: Fonts.regular, marginTop: 12 },
    emptyTitle: { fontSize: 16, fontFamily: Fonts.semiBold, marginTop: 12 },
    emptySubtext: { fontSize: 14, fontFamily: Fonts.regular, marginTop: 4 },
});
