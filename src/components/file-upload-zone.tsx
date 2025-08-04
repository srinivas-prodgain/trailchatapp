'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { TFileUploadState } from '@/types/common-types';
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '@/types/shared';
import { TUploadResponse, useFileUploadSSE } from '@/hooks/api/file';
import { useQueryClient } from '@tanstack/react-query';


type TFileUploadZoneProps = {
    onFilesSelected?: (files: TFileUploadState[]) => void;
    maxFiles?: number;
    className?: string;
}

export const FileUploadZone: React.FC<TFileUploadZoneProps> = ({
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
                    setSelectedFiles(prev => prev.map(f => {
                        // Don't update progress if file is already in error state
                        if (f.id === fileUpload.id && f.uploadStatus !== 'error') {
                            return {
                                ...f,
                                uploadProgress: progress,
                                uploadMessage: message || 'Processing...' + progress + '%'
                            };
                        }
                        return f;
                    }));
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
                    // Make error messages more user-friendly
                    let userFriendlyError = error;
                    if (error.includes('empty') || error.includes('no readable text') || error.includes('No text content')) {
                        userFriendlyError = 'This file appears to be empty or unreadable. Please check that your file contains text content.';
                    } else if (error.includes('File processing failed:')) {
                        // Remove the technical prefix for other errors
                        userFriendlyError = error.replace('File processing failed: ', '');
                    }

                    setSelectedFiles(prev => prev.map(f =>
                        f.id === fileUpload.id
                            ? {
                                ...f,
                                uploadStatus: 'error' as const,
                                uploadProgress: 0, // Reset progress on error
                                uploadMessage: userFriendlyError
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
                        uploadProgress: 0, // Reset progress on error
                        uploadMessage: 'Upload request failed'
                    }
                    : f
            ));
        }
    };

    const removeFile = useCallback((file_id: string) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== file_id));
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
                <div className="mt-6 space-y-3">
                    <h4 className="text-base font-medium text-gray-800 mb-3">
                        Selected Files ({selectedFiles.length})
                    </h4>
                    {selectedFiles.map((file) => (
                        <div
                            key={file.id}
                            className={`p-4 bg-white border rounded-lg shadow-sm transition-all duration-200 ${file.uploadStatus === 'uploading'
                                ? 'border-blue-300 bg-blue-50'
                                : file.uploadStatus === 'completed'
                                    ? 'border-green-300 bg-green-50'
                                    : file.uploadStatus === 'error'
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200 hover:shadow-md'
                                }`}
                        >
                            {/* File Info Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {getFileIcon(file.name)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                            {file.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>

                                {/* Status and Actions - Only for pending state */}
                                <div className="flex items-center gap-2">
                                    {file.uploadStatus === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUploadFile(file)}
                                                disabled={fileUploadMutation.isPending}
                                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {fileUploadMutation.isPending ? 'Uploading...' : 'Upload'}
                                            </button>
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                title="Remove file"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status Section - Below file info */}
                            <div className="mt-3">

                                {file.uploadStatus === 'uploading' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-700 font-medium">
                                                Uploading...
                                            </span>
                                            <span className="text-sm text-blue-700 font-medium">
                                                {file.uploadProgress || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                                style={{ width: `${file.uploadProgress || 0}%` }}
                                            />
                                        </div>
                                        {file.uploadMessage && (
                                            <div className="text-sm text-blue-600 leading-tight">
                                                {file.uploadMessage}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {file.uploadStatus === 'completed' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="text-sm text-green-700 font-medium">
                                                Upload completed successfully
                                            </span>
                                        </div>
                                        {file.uploadMessage && (
                                            <div className="text-sm text-green-600 leading-tight">
                                                {file.uploadMessage}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {file.uploadStatus === 'error' && (
                                    <div className="space-y-3">
                                        {/* Error Progress Bar */}
                                        <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 w-full"></div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                                <span className="text-sm text-red-700 font-medium">
                                                    Upload failed
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUploadFile(file)}
                                                    disabled={fileUploadMutation.isPending}
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Retry upload"
                                                >
                                                    Retry
                                                </button>
                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                                    title="Remove failed upload"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {file.uploadMessage && (
                                            <div className="text-sm text-red-600 leading-tight bg-red-100 p-3 rounded-md border-l-4 border-red-500">
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