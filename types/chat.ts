import { z } from 'zod';

export const ChatMemberSchema = z.object({
    conversation_id: z.string(),
    user_id: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
    joined_at: z.string(),
    last_read_at: z.string().nullable(),
    profile: z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
    }),
    is_online: z.boolean().optional(),
});

export type ChatMember = z.infer<typeof ChatMemberSchema>;

export const MessageSchema = z.object({
    id: z.string(),
    conversation_id: z.string(),
    sender_id: z.string(),
    content: z.string(),
    type: z.enum(['text', 'image', 'voice']),
    media_urls: z.array(z.string()).default([]),
    created_at: z.string(),
    sender: z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
    }),
    reply_to_id: z.string().nullable().optional(),
    reply_to: z.object({
        id: z.string(),
        content: z.string(),
        sender: z.object({
            id: z.string(),
            name: z.string(),
            image: z.string(),
        })
    }).optional(),
    media_metadata: z.record(z.string(), z.any()).optional(),
    is_deleted: z.boolean().default(false),
    updated_at: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
    id: z.string(),
    type: z.enum(['GROUP', 'DIRECT']),
    name: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    created_by: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    last_message: z.object({
        id: z.string(),
        conversation_id: z.string(),
        sender_id: z.string(),
        content: z.string(),
        type: z.enum(['text', 'image', 'voice']),
        media_urls: z.array(z.string()),
        created_at: z.string(),
        sender: z.object({
            id: z.string(),
            name: z.string(),
            image: z.string(),
        }),
    }).nullable().optional(),
    peer_profile: z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
    }).optional(),
    peer_online: z.boolean().optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// ConversationDetail includes members array (returned by GET /api/chat/conversations/:id)
export const ConversationDetailSchema = z.object({
    id: z.string(),
    type: z.enum(['GROUP', 'DIRECT']),
    name: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    created_by: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    members: z.array(ChatMemberSchema),
    peer_profile: z.object({
        id: z.string(),
        name: z.string(),
        image: z.string(),
    }).optional(),
    peer_online: z.boolean().optional(),
});

export type ConversationDetail = z.infer<typeof ConversationDetailSchema>;

export const PinnedMessageSchema = z.object({
    id: z.string(),
    message_id: z.string(),
    conversation_id: z.string(),
    pinned_by: z.string(),
    pinned_at: z.string(),
    message: MessageSchema
});

export type PinnedMessage = z.infer<typeof PinnedMessageSchema>;

// Request Types
export interface CreateGroupRequest {
    name: string;
    description?: string;
    member_ids: string[];
}

export interface CreateDirectChatRequest {
    peer_id: string;
}

export interface SendMessageRequest {
    type: 'text' | 'image' | 'voice';
    content: string;
    media_urls?: string[];
    reply_to_id?: string;
    media_metadata?: Record<string, any>;
}

export interface MediaPresignRequest {
    folder: string;
}

export interface MediaPresignResponse {
    url: string;
    timestamp: number;
    signature: string;
    api_key: string;
    folder: string;
}

// Typing indicator types
export interface TypingUser {
    id: string;
    name: string;
}

// Presence types
export interface UserPresenceRequest {
    user_ids: string[];
}

export interface UserPresenceResponse {
    presence: Record<string, boolean>;
}

export interface UserPresenceEvent {
    user_id: string;
    is_online: boolean;
    timestamp: string;
}
