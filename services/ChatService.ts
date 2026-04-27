import { User } from '@/types/auth';
import {
    ChatMember,
    Conversation,
    ConversationDetail,
    CreateGroupRequest,
    DiscoveryResponse,
    MediaCollection,
    MediaPresignResponse,
    Message,
    PinnedMessage,
    SendMessageRequest,
    UserPresenceResponse
} from '@/types/chat';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

const PREFIX = '/api/v1';

export const ChatService = {
    /**
     * 1. CONVERSATIONS
     */

    // Create Group Chat
    async createGroupChat(data: CreateGroupRequest): Promise<Conversation> {
        return apiClient.post<Conversation>(`${PREFIX}/conversations`, data);
    },

    // Create Direct Chat
    async createDirectChat(peerId: string): Promise<Conversation> {
        return apiClient.post<Conversation>(`${PREFIX}/conversations/direct`, {
            peer_id: peerId
        });
    },

    // Get User Conversations (List)
    async getConversations(filters: { role?: string; type?: string; q?: string; limit?: number; offset?: number } = {}): Promise<Conversation[]> {
        return apiClient.get<Conversation[]>(`${PREFIX}/conversations`, {
            params: filters
        });
    },

    // Discover related contacts and groups
    async discoverContacts(): Promise<DiscoveryResponse> {
        return apiClient.get<DiscoveryResponse>(`${PREFIX}/conversations/discover`);
    },

    // Get Conversation Details
    async getConversationDetails(id: string): Promise<ConversationDetail> {
        return apiClient.get<ConversationDetail>(`${PREFIX}/conversations/${id}`);
    },

    // Delete Conversation (Admin only)
    async deleteConversation(id: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`${PREFIX}/conversations/${id}`);
    },

    // Update Group Image
    async updateGroupImage(id: string, imageUrl: string): Promise<{ message: string }> {
        return apiClient.put<{ message: string }>(`${PREFIX}/conversations/${id}/image`, {
            image_url: imageUrl
        });
    },

    // Leave Conversation
    async leaveConversation(id: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>(`${PREFIX}/conversations/${id}/leave`);
    },

    /**
     * 2. MEMBERS
     */

    // Get Members
    async getMembers(conversationId: string): Promise<ChatMember[]> {
        return apiClient.get<ChatMember[]>(`${PREFIX}/conversations/${conversationId}/members`);
    },

    // Add Member
    async addMember(conversationId: string, userId: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>(`${PREFIX}/conversations/${conversationId}/members`, {
            user_id: userId
        });
    },

    // Remove Member
    async removeMember(conversationId: string, userId: string): Promise<{ message: string }> {
        // Note: DELETE with body - apiClient handles this via RequestOptions
        return apiClient.delete<{ message: string }>(`${PREFIX}/conversations/${conversationId}/members`, {
            body: { user_id: userId }
        } as any);
    },

    // Update Member Role
    async updateMemberRole(conversationId: string, userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER'): Promise<{ message: string }> {
        return apiClient.put<{ message: string }>(`${PREFIX}/conversations/${conversationId}/members/role`, {
            user_id: userId,
            role
        });
    },

    /**
     * 3. MESSAGES
     */

    // Send Message
    async sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
        return apiClient.post<Message>(`${PREFIX}/conversations/${conversationId}/messages`, data);
    },

    // Get Messages (History)
    async getMessages(conversationId: string, query: { limit?: number; offset?: number; search?: string } = {}): Promise<Message[]> {
        return apiClient.get<Message[]>(`${PREFIX}/conversations/${conversationId}/messages`, {
            params: query
        });
    },

    // Delete Message
    async deleteMessage(conversationId: string, messageId: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`${PREFIX}/conversations/${conversationId}/messages/${messageId}`);
    },

    // Pin Message
    async pinMessage(conversationId: string, messageId: string): Promise<void> {
        await apiClient.post(`${PREFIX}/conversations/${conversationId}/messages/${messageId}/pin`);
    },

    // Unpin Message
    async unpinMessage(conversationId: string, messageId: string): Promise<void> {
        await apiClient.delete(`${PREFIX}/conversations/${conversationId}/messages/${messageId}/pin`);
    },

    // Get Pinned Messages
    async getPinnedMessages(conversationId: string): Promise<PinnedMessage[]> {
        const data = await apiClient.get<PinnedMessage[]>(`${PREFIX}/conversations/${conversationId}/messages/pinned`);
        return Array.isArray(data) ? data : [];
    },

    /**
     * 4. MEDIA
     */

    // Get Presigned URL for media upload
    async getPresignedUrl(folder: string): Promise<MediaPresignResponse> {
        return apiClient.post<MediaPresignResponse>(`${PREFIX}/media/presign`, {
            folder
        });
    },

    // Get Media Collection (photos, voice, links)
    async getMediaCollection(conversationId: string): Promise<MediaCollection> {
        return apiClient.get<MediaCollection>(`${PREFIX}/conversations/${conversationId}/media`);
    },

    /**
     * 5. TYPING INDICATORS
     */

    // Send Typing Indicator
    async sendTyping(conversationId: string, isTyping: boolean): Promise<void> {
        try {
            await apiClient.post(`${PREFIX}/typing`, {
                conversation_id: conversationId,
                is_typing: isTyping
            });
        } catch (error) {
            // Typing status is usually non-critical
            console.warn('[ChatService] Failed to send typing indicator:', error);
        }
    },

    /**
     * 6. USER SEARCH
     */
    async searchUsers(query: string): Promise<{ users: User[] }> {
        return apiClient.get<{ users: User[] }>(`${PREFIX}/users/search`, {
            params: { q: query }
        });
    },

    /**
     * 7. USER PRESENCE
     */
    async checkUserPresence(userIds: string[]): Promise<UserPresenceResponse> {
        return apiClient.post<UserPresenceResponse>(`/api/presence`, {
            user_ids: userIds
        });
    },

    /**
     * 8. READ RECEIPTS & NOTIFICATIONS
     */

    // Mark conversation as read
    async markConversationAsRead(conversationId: string): Promise<{ message: string }> {
        try {
            return await apiClient.post<{ message: string }>(`${PREFIX}/conversations/${conversationId}/read`);
        } catch (error) {
            console.warn('[ChatService] Mark as read endpoint not available yet:', error);
            // Return success to not block UI
            return { message: 'Endpoint not implemented yet' };
        }
    },

    // Get unread count for a conversation
    async getUnreadCount(conversationId: string): Promise<{ unread_count: number }> {
        try {
            return await apiClient.get<{ unread_count: number }>(`${PREFIX}/conversations/${conversationId}/unread`);
        } catch (error) {
            console.warn('[ChatService] Unread count endpoint not available yet:', error);
            return { unread_count: 0 };
        }
    },

    // Mark specific message as read
    async markMessageAsRead(conversationId: string, messageId: string): Promise<{ message: string }> {
        try {
            return await apiClient.post<{ message: string }>(`${PREFIX}/conversations/${conversationId}/messages/${messageId}/read`);
        } catch (error) {
            console.warn('[ChatService] Mark message as read endpoint not available yet:', error);
            return { message: 'Endpoint not implemented yet' };
        }
    },

    // Get total unread count across all conversations
    async getTotalUnreadCount(): Promise<{ total_unread: number }> {
        try {
            const conversations = await this.getConversations();
            const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
            return { total_unread: totalUnread };
        } catch (error) {
            console.error('[ChatService] Failed to get total unread count:', error);
            return { total_unread: 0 };
        }
    },

    /**
     * 9. MEDIA HELPERS
     */
    async uploadMedia(fileUri: string, type: 'image' | 'voice'): Promise<string> {
        try {
            console.log(`[ChatService] Starting media upload - Type: ${type}, URI: ${fileUri}`);

            // 1. Get presigned URL from backend
            const folder = type === 'image' ? 'chat/images' : 'chat/voice';
            console.log(`[ChatService] Requesting presigned URL for folder: ${folder}`);

            const presignData = await this.getPresignedUrl(folder);

            // Fix: Backend might return image/upload URL for voice, but Cloudinary needs video/upload for audio
            let uploadUrl = presignData.url;
            if (type === 'voice' && uploadUrl.includes('/image/upload')) {
                uploadUrl = uploadUrl.replace('/image/upload', '/video/upload');
                console.log(`[ChatService] Fixed URL for voice upload: ${uploadUrl}`);
            }

            console.log(`[ChatService] Received presign data:`, {
                url: uploadUrl,
                folder: presignData.folder,
                timestamp: presignData.timestamp
            });

            // 2. Prepare file for upload
            const fileData = {
                uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
                type: type === 'image' ? 'image/jpeg' : 'audio/m4a',
                name: type === 'image' ? 'photo.jpg' : 'audio.m4a'
            };

            // 3. Build FormData with Cloudinary credentials
            const formData = new FormData();
            formData.append('file', fileData as any);
            formData.append('api_key', presignData.api_key);
            formData.append('timestamp', presignData.timestamp.toString());
            formData.append('signature', presignData.signature);
            formData.append('folder', presignData.folder);

            // For voice, add resource_type parameter
            if (type === 'voice') {
                formData.append('resource_type', 'video');
            }

            console.log(`[ChatService] Uploading to Cloudinary...`);

            // 4. Upload to Cloudinary (don't set Content-Type header - FormData handles it)
            const uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });

            // 5. Handle upload response
            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText };
                }

                console.error(`[ChatService] Cloudinary upload failed:`, {
                    status: uploadRes.status,
                    statusText: uploadRes.statusText,
                    error: errorData
                });

                const errorMessage = errorData?.error?.message ||
                    errorData?.message ||
                    `Upload failed with status ${uploadRes.status}`;
                throw new Error(`Media upload failed: ${errorMessage}`);
            }

            const uploadData = await uploadRes.json();

            if (!uploadData.secure_url) {
                console.error(`[ChatService] No secure_url in response:`, uploadData);
                throw new Error('Upload succeeded but no URL returned from Cloudinary');
            }

            console.log(`[ChatService] Upload successful - URL: ${uploadData.secure_url}`);
            return uploadData.secure_url;

        } catch (error) {
            console.error(`[ChatService] Media upload error:`, error);

            // Provide user-friendly error messages
            if (error instanceof Error) {
                if (error.message.includes('Network request failed')) {
                    throw new Error('Network error: Please check your internet connection');
                }
                if (error.message.includes('presign')) {
                    throw new Error('Failed to get upload credentials. Please try again.');
                }
                throw error;
            }

            throw new Error('Failed to upload media. Please try again.');
        }
    },
};
