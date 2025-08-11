//Types 
import { TConversation, TConversationWithMessages } from '../../types/common-types';
import { TPaginationQParams } from '../../types/pagination';

import { TApiSuccess, TQueryOpts } from '../../types/api';

//Hooks
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-client';
import axiosInstance from '../../lib/axios-instance';


//APIs
//Get all conversations for a user
const getUserConversations = async (_user_id: string, pagination: TPaginationQParams = { page: 1, limit: 15 }): Promise<TApiSuccess<TConversation[]>> => {
    const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
    });

    const response = await axiosInstance.get(`/conversations/user?${queryParams}`);
    return response.data;
}

//Get a conversation by id
const getConversation = async (id: string): Promise<TApiSuccess<TConversationWithMessages>> => {
    const response = await axiosInstance.get(`/conversations/${id}`);
    return response.data;
}

//Update a conversation title
const updateConversationTitle = async (id: string, title: string): Promise<TApiSuccess<string>> => {
    const response = await axiosInstance.put(`/conversations/${id}`, { title });
    return response.data.message;
}

//Create a new conversation
const createConversation = async (title?: string): Promise<TApiSuccess<TConversation>> => {
    const response = await axiosInstance.post('/conversations', { title });
    return response.data;
}

//Delete a conversation
const deleteConversation = async (id: string): Promise<TApiSuccess<string>> => {
    const response = await axiosInstance.delete(`/conversations/${id}`);
    return response.data.message;
}



//Hooks

export const useUserConversations = (
    user_id: string,
    pagination: TPaginationQParams = { page: 1, limit: 10 },
    options?: TQueryOpts<TApiSuccess<TConversation[]>>
) => {
    return useQuery({
        queryKey: [...queryKeys.userConversations(user_id), pagination],
        queryFn: () => getUserConversations('', pagination),
        enabled: !!user_id,
        ...options
    });
}


export const useConversation = (
    id: string,
    options?: TQueryOpts<TApiSuccess<TConversationWithMessages>>
) => {
    return useQuery({
        queryKey: queryKeys.conversation(id),
        queryFn: () => getConversation(id),
        enabled: !!id,
        ...options
    });
}

export const useUpdateConversationTitle = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (title: string) => updateConversationTitle(id, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversation', id] });
            queryClient.invalidateQueries({ queryKey: ['userConversations', id] });
        },
    });

}

export const useDeleteConversation = () => {
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

// Infinite scroll hook for conversations
export const useInfiniteConversations = (
    user_id: string,
    pageSize: number = 15,
    options?: { enabled?: boolean; staleTime?: number; cacheTime?: number }
) => {
    return useInfiniteQuery({
        queryKey: [...queryKeys.userConversations(user_id), 'infinite'],
        queryFn: ({ pageParam = 1 }) => {
            return getUserConversations('', { page: pageParam, limit: pageSize });
        },
        getNextPageParam: (lastPage: TApiSuccess<TConversation[]>) => {
            if (lastPage.pagination && lastPage.pagination.page < lastPage.pagination.total_pages) {
                const nextPage = lastPage.pagination.page + 1;
                return nextPage;
            }
            return undefined;
        },
        enabled: !!user_id,
        initialPageParam: 1,
        ...options
    });
}

export const useCreateConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ title }: { title?: string }) => createConversation(title),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.userConversations(data?.data?.user_id || '') });
        },
    });
};