import { useMutation } from "@tanstack/react-query";
import { TMessage } from "../../types/common-types";
import { TStreamChatRequest, TStreamChatResponse } from "../../types/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

//APIs

// Stream chat with proper typing
const streamChat = async (
    uid: string,
    messages: TMessage[],
    userId?: string,
    model?: string,
    selectedFileIds?: string[],
    abortSignal?: AbortSignal
): Promise<TStreamChatResponse> => {
    // Get the latest message (last message in the array)
    const latestMessage = messages[messages.length - 1];

    if (!latestMessage) {
        throw new Error('No messages provided');
    }

    const requestBody: TStreamChatRequest = {
        message: latestMessage.content,
        userId: userId || '',
        model: model || 'claude-3-5-sonnet-20241022',
        selectedFileIds
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/stream/${uid}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
    });

    return response;
};

//Hooks

export const useStreamChat = (uid: string, messages: TMessage[], userId: string, model: string, selectedFileIds?: string[]) => {
    return useMutation({
        mutationFn: ({ uid, messages, userId, model, selectedFileIds, abortSignal }: {
            uid: string;
            messages: TMessage[];
            userId: string;
            model: string;
            selectedFileIds?: string[];
            abortSignal?: AbortSignal;
        }) => streamChat(uid, messages, userId, model, selectedFileIds, abortSignal),
    });
};




