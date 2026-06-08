import { apiClient } from './apiClient';
import { 
    ChatSession, 
    ChatMessage, 
    ChatHistoryResponse, 
    CreateChatSessionRequest,
    SendChatMessageRequest
} from '@/types/chatbot';
import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
import { Platform } from 'react-native';

const PREFIX = '/api/v1/chatbot';

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export const ChatbotService = {
    /**
     * Create a new chat session
     */
    async createSession(data?: CreateChatSessionRequest): Promise<ChatSession> {
        const res = await apiClient.post<ApiResponse<ChatSession>>(`${PREFIX}`, data || {});
        return res.data;
    },

    /**
     * Get all chat sessions for the current user
     */
    async getSessions(): Promise<ChatSession[]> {
        const res = await apiClient.get<ApiResponse<ChatSession[]>>(`${PREFIX}`);
        return res.data || [];
    },

    /**
     * Update a chat session (e.g., Rename)
     */
    async updateSession(id: string, title: string): Promise<ChatSession> {
        const res = await apiClient.patch<ApiResponse<ChatSession>>(`${PREFIX}/${id}`, { title });
        return res.data;
    },

    /**
     * Delete a chat session
     */
    async deleteSession(id: string): Promise<void> {
        await apiClient.delete(`${PREFIX}/${id}`);
    },

    /**
     * Get chat history
     */
    async getHistory(chatId: string, page = 1, limit = 20): Promise<ChatMessage[]> {
        const res = await apiClient.get<ChatHistoryResponse>(`${PREFIX}/${chatId}/messages`, {
            params: { page, limit }
        });
        
        // Smart Data Mapping: Ensure imageUrl is captured even if backend uses different naming
        const messages = (res.data || []).map(msg => ({
            ...msg,
            // Capture the URL from whichever field the backend provides it in
            imageUrl: msg.imageUrl || (msg as any).mediaUrl || (msg as any).image_url || (msg as any).file_url || (msg as any).media
        }));

        return messages;
    },

    /**
     * Send a text message with streaming support
     */
    async sendMessageStreaming(
        chatId: string, 
        message: string, 
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const token = await getValidAccessToken();
        const url = `${BASE_URL}${PREFIX}/${chatId}/messages`;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            let lastIndex = 0;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 3 || xhr.readyState === 4) {
                    const currentText = xhr.responseText;
                    const newText = currentText.substring(lastIndex);
                    
                    if (newText) {
                        const lines = newText.split(/\r?\n/);
                        lines.forEach(line => {
                            if (line.trim()) {
                                this.processChunk(line, onChunk);
                            }
                        });
                        lastIndex = currentText.length;
                    }
                }

                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`HTTP error! status: ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('Network request failed'));
            xhr.send(JSON.stringify({ message }));
        });
    },

    /**
     * Helper to process a potential JSON chunk from backend
     */
    processChunk(text: string, onChunk: (chunk: string) => void) {
        try {
            let cleanText = text.trim();
            if (!cleanText) return;

            if (/^event:\s*/i.test(cleanText)) {
                const eventName = cleanText.replace(/^event:\s*/i, '').trim().toLowerCase();
                if (eventName === 'chunk' || eventName === 'correction') {
                    return;
                }
                return;
            }

            if (/^data:\s*/i.test(cleanText)) {
                cleanText = cleanText.replace(/^data:\s*/i, '').trim();
                if (!cleanText) return;

                const parsed = JSON.parse(cleanText);
                const content = parsed.content || parsed.message || parsed.text;
                if (typeof content === 'string' && content.length > 0) {
                    onChunk(content);
                }
                return;
            }
        } catch (e) {
            // Ignore malformed/non-user-facing SSE fragments instead of leaking internals to chat UI.
            return;
        }
    },

    /**
     * Send message with binary attachment (Image) with streaming support
     */
    async sendBinaryMessageStreaming(
        chatId: string, 
        message: string, 
        fileUri: string, 
        mimeType: string,
        onChunk: (chunk: string) => void
    ): Promise<void> {
        const token = await getValidAccessToken();
        const url = `${BASE_URL}${PREFIX}/${chatId}/messages/binary`;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            // Note: Don't set Content-Type for FormData, browser sends boundary

            const formData = new FormData();
            formData.append('message', message);
            const filename = fileUri.split('/').pop() || 'image.jpg';
            
            formData.append('file', {
                uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
                name: filename,
                type: mimeType,
            } as any);

            let lastIndex = 0;
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 3 || xhr.readyState === 4) {
                    const currentText = xhr.responseText;
                    const newText = currentText.substring(lastIndex);
                    if (newText) {
                        const lines = newText.split(/\r?\n/);
                        lines.forEach(line => {
                            if (line.trim()) this.processChunk(line, onChunk);
                        });
                        lastIndex = currentText.length;
                    }
                }
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) resolve();
                    else reject(new Error(`Vision Error: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Vision network request failed'));
            xhr.timeout = 180000; // 3 minutes for heavy vision tasks
            xhr.ontimeout = () => reject(new Error('Vision request timed out after 3 minutes'));
            
            xhr.send(formData);
        });
    }
};
