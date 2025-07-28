import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

export const queryKeys = {
    conversations: ['conversations'] as const,
    conversation: (uid: string) => ['conversation', uid] as const,
    userConversations: (userId: string) => ['userConversations', userId] as const,
};