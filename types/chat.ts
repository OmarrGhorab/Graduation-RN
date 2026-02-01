import { z } from 'zod';

export const ChatMemberSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    user_role: z.string(),
    member_role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
    joined_at: z.string(),
    last_read_at: z.string().nullable(),
    user_name: z.string().optional(),
    user_image: z.string().optional(),
});

export type ChatMember = z.infer<typeof ChatMemberSchema>;

export const ConversationSchema = z.object({
    id: z.string(),
    type: z.enum(['GROUP', 'DIRECT']),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    created_by: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    members: z.array(ChatMemberSchema).optional(),
    unread_count: z.number().default(0),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const MessageSchema = z.object({
    id: z.string(),
    content: z.string(),
    type: z.enum(['text', 'image', 'voice']),
    sender_id: z.string(),
    sender_role: z.string(),
    sender_name: z.string(),
    sender_image: z.string().nullable().optional(),
    reply_to_id: z.string().nullable().optional(),
    media_urls: z.array(z.string()).optional(),
    media_metadata: z.record(z.string(), z.any()).optional(),
    is_deleted: z.boolean().default(false),
    created_at: z.string(),
    updated_at: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Request Types
export interface CreateGroupRequest {
    name: string;
    description?: string;
    member_ids: string[];
}

export interface CreateDirectChatRequest {
    recipient_id: string;
}

export interface SendMessageRequest {
    type: 'text' | 'image' | 'voice';
    content: string;
    media_urls?: string[];
    reply_to_id?: string;
    media_metadata?: Record<string, any>;
}

export interface MediaPresignRequest {
    files: {
        type: 'image' | 'voice';
        content_type: string;
        file_size: number;
    }[];
}

export interface MediaPresignResponse {
    files: {
        upload_url: string;
        public_id: string;
        folder?: string;
        key: string;
        signature: string;
        api_key: string;
        timestamp: number;
    }[];
}
