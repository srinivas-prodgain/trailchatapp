// Shared types used across frontend and backend

// File-related types

export const allowedFileTypes = ['pdf', 'txt', 'docx', 'md'] as const;
export type TAllowedFileTypes = (typeof allowedFileTypes)[number];


// File extension types

export const ALLOWED_FILE_EXTENSIONS: Record<TAllowedFileTypes, string[]> = {
    pdf: ['.pdf'],
    txt: ['.txt'],
    docx: ['.docx'],
    md: ['.md', '.markdown']
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Base message type (includes system role for backend streaming)

const allowedRoles = ['user', 'assistant', 'system'] as const;
export type TAllowedRoles = (typeof allowedRoles)[number];


export type TBaseMessage = {
    role: TAllowedRoles;
    content: string;
};

// Base conversation type
export type TBaseConversation = {
    _id: string;
    title: string;
    user_id?: string;
    createdAt: string;
    updatedAt: string;
};

// Streaming chat types
export type TStreamChatRequest = {
    message: string;
    user_id: string;
    model: string;
    selected_file_ids?: string[];
};

export type TStreamChatChunk = {
    content: string;
    conversationId: string;
};

export type TStreamChatResponse = Response;

// API response types
export type TApiSuccess<TData = undefined> = {
    message: string;
    data?: TData;
    pagination?: TPaginationResponse;
};

export type TApiError = {
    message: string;
    status_code: number;
};

export type TApiPromise<TData = undefined> = Promise<TApiSuccess<TData>> | Promise<TApiError>;

// Pagination types
export type TPaginationQParams = {
    page: number;
    limit: number;
};

export type TPaginationResponse = {
    page: number;
    limit: number;
    total_pages: number;
    total_items: number;
};


export type TToolStatus = {
    tool: string;
    status: 'started' | 'completed';
    details?: {
        resultCount?: number;
        error?: string;
    };
};