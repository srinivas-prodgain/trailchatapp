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
const getUserConversations = async (user_id: string, pagination: TPaginationQParams = { page: 1, limit: 15 }): Promise<TApiSuccess<TConversation[]>> => {
    const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
    });

    const response = await axiosInstance.get(`/conversations/user/${user_id}?${queryParams}`);
    return response.data;
}

//Get a conversation by id
const getConversation = async (uid: string): Promise<TApiSuccess<TConversationWithMessages>> => {
    const response = await axiosInstance.get(`/conversations/${uid}`);
    return response.data;
}

//Update a conversation title
const updateConversationTitle = async (uid: string, title: string): Promise<TApiSuccess<string>> => {
    const response = await axiosInstance.put(`/conversations/${uid}`, { title });
    return response.data.message;
}

//Delete a conversation
const deleteConversation = async (uid: string): Promise<TApiSuccess<string>> => {
    const response = await axiosInstance.delete(`/conversations/${uid}`);
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
        queryFn: () => getUserConversations(user_id, pagination),
        enabled: !!user_id,
        ...options
    });
}


export const useConversation = (
    uid: string,
    options?: TQueryOpts<TApiSuccess<TConversationWithMessages>>
) => {
    return useQuery({
        queryKey: queryKeys.conversation(uid),
        queryFn: () => getConversation(uid),
        enabled: !!uid,
        ...options
    });
}

export const useUpdateConversationTitle = (uid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (title: string) => updateConversationTitle(uid, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversation', uid] });
            queryClient.invalidateQueries({ queryKey: ['userConversations', uid] });
        },
    });

}

export const useDeleteConversation = (uid: string) => {
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
            return getUserConversations(user_id, { page: pageParam, limit: pageSize });
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
};