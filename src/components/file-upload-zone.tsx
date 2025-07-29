'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { TFileUploadState, ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '@/types/common-types';
import { TUploadResponse, useFileUploadSSE } from '@/hooks/api/file';
import { useQueryClient } from '@tanstack/react-query';

interface FileUploadZoneProps {
    onFilesSelected?: (files: TFileUploadState[]) => void;
    maxFiles?: number;
    className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    onFilesSelected,
    maxFiles = 5,
    className = ''
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<TFileUploadState[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileUploadMutation = useFileUploadSSE();
    const queryClient = useQueryClient();
    // Notify parent when files change to avoid React update errors
    useEffect(() => {
        onFilesSelected?.(selectedFiles);
    }, [selectedFiles, onFilesSelected]);

    const validateFile = (file: File): string | null => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return `File "${file.name}" is too large. Maximum size is 10MB.`;
        }

        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = Object.values(ALLOWED_FILE_EXTENSIONS)
            .flat()
            .includes(fileExtension);

        if (!isValidType) {
            return `File "${file.name}" is not supported. Supported formats: PDF, TXT, DOCX, MD.`;
        }

        return null;
    };

    const handleFiles = useCallback((files: FileList) => {
        const newErrors: string[] = [];
        const validFiles: TFileUploadState[] = [];

        // Check total file limit
        if (selectedFiles.length + files.length > maxFiles) {
            newErrors.push(`Cannot upload more than ${maxFiles} files at once.`);
            setErrors(newErrors);
            return;
        }

        Array.from(files).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                newErrors.push(error);
            } else {
                const fileUpload: TFileUploadState = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadProgress: 0,
                    uploadMessage: '',
                    uploadStatus: 'pending',
                    file
                };
                validFiles.push(fileUpload);
            }
        });

        if (newErrors.length > 0) {
            setErrors(newErrors);
        } else {
            setErrors([]);
        }

        if (validFiles.length > 0) {
            const updatedFiles = [...selectedFiles, ...validFiles];
            setSelectedFiles(updatedFiles);
        }
    }, [selectedFiles, maxFiles, onFilesSelected]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
    }, [handleFiles]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFiles]);

    const handleUploadFile = async (fileUpload: TFileUploadState) => {
        if (!fileUpload.file) return;

        // Generate upload ID for tracking
        const uploadId = crypto.randomUUID();

        // Update file status to uploading
        setSelectedFiles(prev => prev.map(f =>
            f.id === fileUpload.id
                ? {
                    ...f,
                    uploadStatus: 'uploading' as const,
                    uploadProgress: 0,
                    uploadMessage: 'Starting upload...'
                }
                : f
        ));

        try {
            await fileUploadMutation.mutateAsync({
                file: fileUpload.file,
                uploadId,
                onProgress: (progress: number, message?: string) => {
                    setSelectedFiles(prev => prev.map(f =>
                        f.id === fileUpload.id
                            ? {
                                ...f,
                                uploadProgress: progress,
                                uploadMessage: message || 'Processing...' + progress + '%'
                            }
                            : f
                    ));
                },
                onStart: (fileName: string, fileSize: number) => {
                    console.log(`Upload started: ${fileName} (${fileSize} bytes)`);
                },
                onComplete: (fileData: TUploadResponse) => {
                    setSelectedFiles(prev => prev.map(f =>
                        f.id === fileUpload.id
                            ? {
                                ...f,
                                uploadStatus: 'completed' as const,
                                uploadProgress: 100,
                                uploadMessage: `Upload completed successfully!`
                            }
                            : f
                    ));
                    queryClient.invalidateQueries({ queryKey: ['files'] });
                },
                onError: (error: string) => {
                    setSelectedFiles(prev => prev.map(f =>
                        f.id === fileUpload.id
                            ? {
                                ...f,
                                uploadStatus: 'error' as const,
                                uploadMessage: `Upload failed: ${error}`
                            }
                            : f
                    ));
                    console.error('Upload error:', error);
                }
            });
        } catch (error) {
            // Update file status to error if upload request fails
            setSelectedFiles(prev => prev.map(f =>
                f.id === fileUpload.id
                    ? {
                        ...f,
                        uploadStatus: 'error' as const,
                        uploadMessage: 'Upload request failed'
                    }
                    : f
            ));
        }
    };

    const removeFile = useCallback((fileId: string) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName: string) => {
        return <File className="w-4 h-4" />;
    };



    return (
        <div className={`w-full ${className}`}>
            {/* Upload Zone */}
            <div
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                    ${isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload files
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-400">
                    Supported formats: PDF, TXT, DOCX, MD (max 10MB each)
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.docx,.md,.markdown"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    {errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Selected Files ({selectedFiles.length})
                    </h4>
                    {selectedFiles.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getFileIcon(file.name)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            {/* Status and Actions */}
                            <div className="flex items-center gap-2">
                                {file.uploadStatus === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUploadFile(file)}
                                            disabled={fileUploadMutation.isPending}
                                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            Upload
                                        </button>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove file"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                )}

                                {file.uploadStatus === 'uploading' && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 transition-all duration-300"
                                                    style={{ width: `${file.uploadProgress || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">
                                                {file.uploadProgress || 0}%
                                            </span>
                                        </div>
                                        {file.uploadMessage && (
                                            <div className="text-xs text-gray-500 text-right max-w-48 truncate">
                                                {file.uploadMessage}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {file.uploadStatus === 'completed' && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="text-xs text-green-600 font-medium">
                                                Uploaded successfully
                                            </span>
                                        </div>
                                        {file.uploadMessage && (
                                            <div className="text-xs text-green-500 text-right max-w-48 truncate">
                                                {file.uploadMessage}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {file.uploadStatus === 'error' && (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                            <span className="text-xs text-red-600">
                                                Upload failed
                                            </span>
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-1"
                                                title="Remove failed upload"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {file.uploadMessage && (
                                            <div className="text-xs text-red-500 text-right max-w-48 truncate">
                                                {file.uploadMessage}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}; 