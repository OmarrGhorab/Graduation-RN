export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    chatId: string;
    role: 'user' | 'assistant';
    content: string;
    imageUrl?: string;
    createdAt: string;
}

export interface CreateChatSessionRequest {
    title?: string;
}

export interface SendChatMessageRequest {
    message: string;
}

export interface ChatHistoryResponse {
    success: boolean;
    data: ChatMessage[];
    total: number;
    page: number;
    limit: number;
}
