import { useMutation } from "@tanstack/react-query";
import { TMessage } from "../../types/common-types";
import { TStreamChatRequest, TStreamChatResponse } from "../../types/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Helper function to get auth token from cookie
const getAuthToken = (): string | null => {
    if (typeof document === 'undefined') return null;

    const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('auth='))
        ?.split('=')[1];

    return token || null;
};

//APIs



// Stream chat with proper typing
const streamChat = async (
    id: string,
    messages: TMessage[],
    user_id?: string,
    model?: string,
    selected_file_ids?: string[],
    abortSignal?: AbortSignal
): Promise<TStreamChatResponse> => {
    // Get the latest message (last message in the array)
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage) {
        throw new Error('No messages provided');
    }

    const requestBody: TStreamChatRequest = {
        message: latestMessage.content,
        user_id: user_id || '',
        model: model || 'claude-3-5-sonnet-20241022',
        selected_file_ids
    };

    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/stream/${id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortSignal,
    });

    return response;
};

//Hooks

export const useStreamChat = (id: string, messages: TMessage[], user_id: string, model: string, selected_file_ids?: string[]) => {
    return useMutation({
        mutationFn: ({ id, messages, user_id, model, selected_file_ids, abortSignal }: {
            id: string;
            messages: TMessage[];
            user_id: string;
            model: string;
            selected_file_ids?: string[];
            abortSignal?: AbortSignal;
        }) => streamChat(id, messages, user_id, model, selected_file_ids, abortSignal),
    });
};




