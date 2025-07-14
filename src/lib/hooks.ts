import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUserConversations,
    getConversation,
    updateConversationTitle,
    deleteConversation,
    Conversation,
    ChatMessage,
    Message
} from './api';

// Query keys
export const queryKeys = {
    conversations: ['conversations'] as const,
    conversation: (uid: string) => ['conversation', uid] as const,
    userConversations: (userId: string) => ['userConversations', userId] as const,
};

// Hook to get all conversations for a user
export function useUserConversations(userId: string) {
    return useQuery({
        queryKey: queryKeys.userConversations(userId),
        queryFn: () => getUserConversations(userId),
        enabled: !!userId,
    });
}

// Hook to get a specific conversation with messages
export function useConversation(uid: string) {
    return useQuery({
        queryKey: queryKeys.conversation(uid),
        queryFn: () => getConversation(uid),
        enabled: !!uid,
    });
}

// Hook to update conversation title



// export function useUpdateConversationTitle() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: ({ uid, title }: { uid: string; title: string }) =>
//             updateConversationTitle(uid, title),
//         onSuccess: (updatedConversation, { uid }) => {
//             // Invalidate and refetch conversations list
//             queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
//             queryClient.invalidateQueries({ queryKey: queryKeys.userConversations(updatedConversation.userId) });

//             // Update the specific conversation in cache
//             queryClient.setQueryData(queryKeys.conversation(uid), (oldData: any) => {
//                 if (oldData) {
//                     return {
//                         ...oldData,
//                         conversation: updatedConversation,
//                     };
//                 }
//                 return oldData;
//             });
//         },
//     });
// }

// Hook to delete conversation


export function useDeleteConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteConversation(id),
        onSuccess: (_, deletedId) => {
            // Remove the deleted conversation from cache
            queryClient.removeQueries({ queryKey: queryKeys.conversation(deletedId) });

            // Invalidate conversations list to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
            queryClient.invalidateQueries({ queryKey: queryKeys.userConversations('123') });
        },
    });
}

// Hook for streaming chat (this will be used differently since it's a stream)
export function useStreamChat() {
    return useMutation({
        mutationFn: ({ uid, messages, userId, abortSignal }: {
            uid: string;
            messages: Message[];
            userId?: string;
            abortSignal?: AbortSignal;
        }) =>
            // Note: This returns a Response object, not JSON
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/v1/stream/${uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages, userId }),
                signal: abortSignal,
            }),
    });
} 