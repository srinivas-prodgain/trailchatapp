import { useMutation } from "@tanstack/react-query";
import { TMessage } from "../../types/common-types";
import { TStreamChatRequest, TStreamChatResponse } from "../../types/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

//APIs



// Stream chat with proper typing
const streamChat = async (
    uid: string,
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

export const useStreamChat = (uid: string, messages: TMessage[], user_id: string, model: string, selected_file_ids?: string[]) => {
    return useMutation({
        mutationFn: ({ uid, messages, user_id, model, selected_file_ids, abortSignal }: {
            uid: string;
            messages: TMessage[];
            user_id: string;
            model: string;
            selected_file_ids?: string[];
            abortSignal?: AbortSignal;
        }) => streamChat(uid, messages, user_id, model, selected_file_ids, abortSignal),
    });
};




