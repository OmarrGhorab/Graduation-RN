import { User } from '@/types/auth';
import {
    ChatMember,
    Conversation,
    CreateGroupRequest,
    MediaPresignRequest,
    MediaPresignResponse,
    Message,
    PinnedMessage,
    SendMessageRequest
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
    async createDirectChat(recipientId: string): Promise<Conversation> {
        return apiClient.post<Conversation>(`${PREFIX}/conversations/direct`, {
            recipient_id: recipientId
        });
    },

    // Get User Conversations (List)
    async getConversations(filters: { role?: string; type?: string; q?: string; limit?: number; offset?: number } = {}): Promise<{ conversations: Conversation[] }> {
        return apiClient.get<{ conversations: Conversation[] }>(`${PREFIX}/conversations`, {
            params: filters
        });
    },

    // Get Conversation Details
    async getConversationDetails(id: string): Promise<Conversation> {
        return apiClient.get<Conversation>(`${PREFIX}/conversations/${id}`);
    },

    // Mark as Read
    async markAsRead(id: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>(`${PREFIX}/conversations/${id}/read`);
    },

    /**
     * 2. MEMBERS
     */

    // Get Members
    async getMembers(conversationId: string): Promise<ChatMember[]> {
        // The API might return { members: [] } or just []
        const data = await apiClient.get<any>(`${PREFIX}/conversations/${conversationId}/members`);
        return data.members || data;
    },

    // Add Member
    async addMember(conversationId: string, data: { user_id: string; member_role?: string }): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>(`${PREFIX}/conversations/${conversationId}/members`, data);
    },

    // Remove Member / Leave Group
    async removeMember(conversationId: string, memberId: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`${PREFIX}/conversations/${conversationId}/members/${memberId}`);
    },

    // Update Member Role
    async updateMemberRole(conversationId: string, memberId: string, role: string): Promise<{ message: string }> {
        return apiClient.patch<{ message: string }>(`${PREFIX}/conversations/${conversationId}/members/${memberId}/role`, {
            member_role: role
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

    // Long Polling for Messages
    async pollMessages(conversationId: string, afterId: string): Promise<{ messages: Message[] }> {
        return apiClient.get<{ messages: Message[] }>(`${PREFIX}/conversations/${conversationId}/poll`, {
            params: { after: afterId },
            timeout: 60000 // Increase timeout for long polling (60s)
        });
    },

    // Delete Message
    async deleteMessage(conversationId: string, messageId: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`${PREFIX}/conversations/${conversationId}/messages/${messageId}`);
    },

    // Pin Message
    async pinMessage(conversationId: string, messageId: string): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>(`${PREFIX}/conversations/${conversationId}/messages/${messageId}/pin`);
    },

    // Unpin Message
    async unpinMessage(conversationId: string, messageId: string): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`${PREFIX}/conversations/${conversationId}/messages/${messageId}/pin`);
    },

    // Edit Message
    async editMessage(conversationId: string, messageId: string, content: string): Promise<{ message: string }> {
        return apiClient.patch<{ message: string }>(`${PREFIX}/conversations/${conversationId}/messages/${messageId}`, {
            content
        });
    },

    // Get Pinned Messages
    async getPinnedMessages(conversationId: string): Promise<{ pinned_messages: PinnedMessage[] }> {
        return apiClient.get<{ pinned_messages: PinnedMessage[] }>(`${PREFIX}/conversations/${conversationId}/pinned`);
    },

    /**
     * 4. MEDIA
     */

    // Batch Presign
    async batchPresign(data: MediaPresignRequest): Promise<MediaPresignResponse> {
        return apiClient.post<MediaPresignResponse>(`${PREFIX}/media/batch-presign`, data);
    },

    /**
     * 5. TYPING INDICATORS
     */

    // Set Typing Status (Report I am typing)
    async setTypingStatus(conversationId: string): Promise<void> {
        try {
            await apiClient.post(`${PREFIX}/typing`, {
                conversation_id: conversationId
            });
        } catch (error) {
            // Typing status is usually non-critical
        }
    },

    // Get Typing Users (Who is typing?)
    async getTypingUsers(conversationId: string): Promise<{ typing_users: { user_id: string; user_role: string }[] }> {
        return apiClient.get<{ typing_users: { user_id: string; user_role: string }[] }>(`${PREFIX}/typing`, {
            params: { conversation_id: conversationId }
        });
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
     * 7. MEDIA HELPERS
     */
    async uploadMedia(fileUri: string, type: 'image' | 'voice'): Promise<string> {
        console.log(`[ChatService] Starting uploadMedia. Type: ${type}, URI: ${fileUri}`);
        // 1. Get Presigned URL
        const presignRes = await this.batchPresign({
            files: [{
                type,
                content_type: type === 'image' ? 'image/jpeg' : 'audio/m4a',
                file_size: 1000000 // Approximate size limit or metadata based
            }]
        });
        console.log(`[ChatService] Presign response:`, JSON.stringify(presignRes, null, 2));

        const fileInfo = presignRes.files[0];

        // 2. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
            type: type === 'image' ? 'image/jpeg' : 'audio/m4a',
            name: type === 'image' ? 'photo.jpg' : 'audio.m4a'
        } as any);
        formData.append('api_key', fileInfo.api_key);
        formData.append('timestamp', fileInfo.timestamp.toString());
        formData.append('signature', fileInfo.signature);

        // Optional: Stay organized if backend provides folder/public_id
        if (fileInfo.folder) {
            formData.append('folder', fileInfo.folder);
        }
        if (fileInfo.public_id) {
            formData.append('public_id', fileInfo.public_id);
        }

        console.log(`[ChatService] Uploading to Cloudinary URL:`, fileInfo.upload_url);
        const uploadRes = await fetch(fileInfo.upload_url, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}));
            console.error(`[ChatService] Cloudinary Upload Failed:`, errorData);
            throw new Error(errorData.error?.message || `Cloudinary upload failed with status ${uploadRes.status}`);
        }

        const uploadData = await uploadRes.json();
        console.log(`[ChatService] Cloudinary Upload Success:`, uploadData.secure_url);
        return uploadData.secure_url;
    },
};
