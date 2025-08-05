import { useMutation, useQuery } from "@tanstack/react-query";
import { TFileUpload } from "@/types/common-types";
import { queryClient } from "@/lib/query-client";
import { TQueryOpts } from "@/types/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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

    const response = await fetch(`${BACKEND_URL}/api/v1/files/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
};

// Note: getFileStatus function removed for now - will implement status checking later

const get_all_files_meta_data = async (): Promise<TUploadedFile[]> => {
    const response = await fetch(`${BACKEND_URL}/api/v1/files`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
}

const delete_file_from_vector_db = async (file_id: string) => {
    const response = await fetch(`${BACKEND_URL}/api/v1/files/delete/${file_id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
    }

    return response.json();
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

// Note: useFileStatus hook removed for now - will implement status checking later



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