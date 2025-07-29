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
}

export type TUploadResponse = {
    fileId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    chunksCreated: number;
}

//API

const uploadFileWithSSE = async (
    file: File,
    uploadId: string,
    onProgress?: (progress: number, message?: string) => void,
    onStart?: (fileName: string, fileSize: number) => void,
    onComplete?: (fileData: TUploadResponse) => void,
    onError?: (error: string) => void
): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    // console.log("file", file);
    // console.log("formData", formData);

    const response = await fetch(`${BACKEND_URL}/api/v1/files/upload/${uploadId}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
    }

    if (!response.body) {
        throw new Error('No response body for SSE stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'start':
                                if (data.fileName && data.fileSize) {
                                    onStart?.(data.fileName, data.fileSize);
                                    console.log("data.fileName", data.fileName);
                                    console.log("data.fileSize", data.fileSize);
                                }
                                break;
                            case 'progress':
                                if (data.progress !== undefined) {
                                    onProgress?.(data.progress, data.message);
                                    console.log("data.progress", data.progress);
                                    console.log("data.message", data.message);
                                }
                                break;
                            case 'complete':
                                if (data.data) {
                                    onComplete?.(data.data);
                                    console.log("data.data", data.data);
                                }
                                return; // Upload completed successfully
                            case 'error':
                                if (data.error) {
                                    onError?.(data.error);
                                    console.log("data.error", data.error);
                                }
                                return; // Upload failed
                        }
                    } catch (parseError) {
                        console.error('Error parsing SSE data:', parseError);
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
};

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

const delete_file_from_vector_db = async (fileId: string) => {
    const response = await fetch(`${BACKEND_URL}/api/v1/files/delete/${fileId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
    }

    return response.json();
}



// Hook

export const useFileUploadSSE = () => {
    return useMutation({
        mutationFn: ({
            file,
            uploadId,
            onProgress,
            onStart,
            onComplete,
            onError
        }: {
            file: File;
            uploadId: string;
            onProgress?: (progress: number, message?: string) => void;
            onStart?: (fileName: string, fileSize: number) => void;
            onComplete?: (fileData: TUploadResponse) => void;
            onError?: (error: string) => void;
        }) =>
            uploadFileWithSSE(file, uploadId, onProgress, onStart, onComplete, onError),
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
        mutationFn: (fileId: string) => delete_file_from_vector_db(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });
}