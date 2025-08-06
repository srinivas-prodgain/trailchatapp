import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { TQueryOpts } from "@/types/api";

import axiosInstance from '../../lib/axios-instance';

// Types
export type TUploadedFile = {
    file_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    upload_date: string;
    chunk_count: number;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export type TUploadResponse = {
    file_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message: string;
}

//API

const uploadFile = async (file: File): Promise<TUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(`/files/upload`, formData);
    return response.data;
};

const get_all_files_meta_data = async (): Promise<TUploadedFile[]> => {
    const response = await axiosInstance.get(`/files`);
    return response.data.data || [];
}

const delete_file_from_vector_db = async (file_id: string) => {
    const response = await axiosInstance.delete(`/files/delete/${file_id}`);
    return response.data.message;
}



// Hooks

export const useFileUpload = () => {
    return useMutation({
        mutationFn: (file: File) =>
            uploadFile(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
};

export const useGetAllFilesMetaData = (
    options?: TQueryOpts<TUploadedFile[]>
) => {
    return useQuery<TUploadedFile[]>({
        queryKey: ['files'],
        queryFn: get_all_files_meta_data,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options
    });
}

export const useDeleteFileFromVectorDb = () => {
    return useMutation({
        mutationFn: (file_id: string) => delete_file_from_vector_db(file_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
}