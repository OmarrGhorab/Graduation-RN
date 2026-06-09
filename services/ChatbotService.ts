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

type ParsedSseEvent = {
    event?: string;
    data?: any;
};

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
            let sseBuffer = '';
            let sawUserFacingChunk = false;

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 3 || xhr.readyState === 4) {
                    const currentText = xhr.responseText;
                    const newText = currentText.substring(lastIndex);
                    
                    if (newText) {
                        sseBuffer += newText;
                        const parsed = this.processSseBuffer(sseBuffer);
                        sseBuffer = parsed.remainingBuffer;
                        parsed.events.forEach(event => {
                            const emitted = this.processChunk(event, onChunk);
                            sawUserFacingChunk = sawUserFacingChunk || emitted;
                        });
                        lastIndex = currentText.length;
                    }
                }

                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const parsed = this.processSseBuffer(`${sseBuffer}\n\n`);
                        parsed.events.forEach(event => {
                            const emitted = this.processChunk(event, onChunk);
                            sawUserFacingChunk = sawUserFacingChunk || emitted;
                        });
                        if (!sawUserFacingChunk) {
                            reject(new Error('Empty streamed response'));
                            return;
                        }
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
    processChunk(event: ParsedSseEvent, onChunk: (chunk: string) => void): boolean {
        try {
            const eventName = event.event?.toLowerCase();
            const payload = event.data;

            if (!payload || typeof payload !== 'object') {
                return false;
            }

            if (eventName === 'error' || payload.type === 'server_error') {
                return false;
            }

            const content = payload.content || payload.message || payload.text;
            if ((eventName === 'chunk' || eventName === 'correction' || !eventName) && typeof content === 'string' && content.length > 0) {
                onChunk(content);
                return true;
            }

            return false;
        } catch (e) {
            // Ignore malformed/non-user-facing SSE fragments instead of leaking internals to chat UI.
            return false;
        }
    },

    processSseBuffer(buffer: string): { events: ParsedSseEvent[]; remainingBuffer: string } {
        const normalized = buffer.replace(/\r\n/g, '\n');
        const frames = normalized.split('\n\n');
        const remainingBuffer = frames.pop() ?? '';
        const events: ParsedSseEvent[] = [];

        frames.forEach(frame => {
            const parsed = this.parseSseFrame(frame);
            if (parsed) {
                events.push(parsed);
            }
        });

        return { events, remainingBuffer };
    },

    parseSseFrame(frame: string): ParsedSseEvent | null {
        if (!frame.trim()) {
            return null;
        }

        let eventName: string | undefined;
        const dataLines: string[] = [];

        frame.split('\n').forEach(rawLine => {
            const line = rawLine.trimEnd();
            if (!line || line.startsWith(':')) {
                return;
            }
            if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
                return;
            }
            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim());
            }
        });

        if (dataLines.length === 0) {
            return null;
        }

        const payloadText = dataLines.join('\n').trim();
        if (!payloadText || payloadText === '[DONE]') {
            return null;
        }

        try {
            return {
                event: eventName,
                data: JSON.parse(payloadText),
            };
        } catch {
            return null;
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
            let sseBuffer = '';
            let sawUserFacingChunk = false;
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 3 || xhr.readyState === 4) {
                    const currentText = xhr.responseText;
                    const newText = currentText.substring(lastIndex);
                    if (newText) {
                        sseBuffer += newText;
                        const parsed = this.processSseBuffer(sseBuffer);
                        sseBuffer = parsed.remainingBuffer;
                        parsed.events.forEach(event => {
                            const emitted = this.processChunk(event, onChunk);
                            sawUserFacingChunk = sawUserFacingChunk || emitted;
                        });
                        lastIndex = currentText.length;
                    }
                }
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const parsed = this.processSseBuffer(`${sseBuffer}\n\n`);
                        parsed.events.forEach(event => {
                            const emitted = this.processChunk(event, onChunk);
                            sawUserFacingChunk = sawUserFacingChunk || emitted;
                        });
                        if (!sawUserFacingChunk) {
                            reject(new Error('Empty streamed response'));
                            return;
                        }
                        resolve();
                    }
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
