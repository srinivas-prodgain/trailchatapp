import { TBaseMessage, TBaseConversation, TAllowedFileTypes, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from './shared';

// Frontend-specific message type (excludes 'system' role for UI)
export type TMessage = Omit<TBaseMessage, 'role'> & {
    role: 'user' | 'assistant';
};

// Frontend-specific conversation type (extends base)
export type TConversation = TBaseConversation & {
    _id: string;
};

// Updated to match the populated format from backend
export type TConversationWithMessages = TConversation & {
    messages: TChatMessage[];
};

export type TChatMessage = {
    _id: string;
    message: string;
    sender: 'user' | 'ai';
    timestamp: string;
    conversationId: string;
};

// Backend file response from API
export type TFileBackendResponse = {
    file_id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    chunksCreated: number;
};

// Frontend file upload state for UI tracking
export type TFileUploadState = {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
    file: File;
};

// Combined type for cases where we need both (like completed uploads)
export type TFileComplete = TFileBackendResponse & {
    uploadStatus: 'completed';
};

// Legacy type for gradual migration - will be removed
export type TFileUpload = TFileBackendResponse | TFileUploadState;

export type TFileUploadResponse = {
    message: string;
    data: {
        file_id: string;
        fileName: string;
        fileSize: number;
        fileType: string;
        uploadUrl?: string;
    };
};

// Re-export shared types for convenience
export type { TAllowedFileTypes };
export { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE };
