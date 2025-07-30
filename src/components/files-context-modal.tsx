'use client';

import React, { useState, useMemo } from 'react';
import { X, FileText, Calendar, HardDrive, Search, Check, FileSearch, Zap, Trash2 } from 'lucide-react';
import { useGetAllFilesMetaData, useDeleteFileFromVectorDb, TUploadedFile } from '@/hooks/api/file';
import { useChatContext } from '@/contexts/chat-context';
import { DeleteConfirmationModal } from './delete-confirmation-modal';

type TFilesContextModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('text')) return '📝';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('markdown')) return '📋';
    return '📄';
};

const getFileTypeName = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('text/plain')) return 'TXT';
    if (mimeType.includes('word')) return 'DOCX';
    if (mimeType.includes('markdown')) return 'MD';
    return 'Unknown';
};

export const FilesContextModal: React.FC<TFilesContextModalProps> = ({
    isOpen,
    onClose
}) => {
    const { data: files, isLoading, error, refetch } = useGetAllFilesMetaData();
    const { selectedFileIds, toggleFileSelection, clearFileSelection, setSelectedFileIds } = useChatContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        file: TUploadedFile | null;
    }>({ isOpen: false, file: null });

    const deleteFileMutation = useDeleteFileFromVectorDb();

    const filteredFiles = useMemo(() => {
        if (!files) return [];
        if (!searchTerm.trim()) return files;

        return files.filter(file =>
            file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getFileTypeName(file.file_type).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [files, searchTerm]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSelectAll = () => {
        if (!filteredFiles) return;
        const allFilteredIds = filteredFiles.map(file => file.file_id);
        const isAllSelected = allFilteredIds.every(id => selectedFileIds.includes(id));

        if (isAllSelected) {
            setSelectedFileIds(selectedFileIds.filter(id => !allFilteredIds.includes(id)));
        } else {
            const newSelection = [...new Set([...selectedFileIds, ...allFilteredIds])];
            setSelectedFileIds(newSelection);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, file: TUploadedFile) => {
        e.stopPropagation(); // Prevent file selection
        setDeleteConfirmation({ isOpen: true, file });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmation.file) return;

        try {
            await deleteFileMutation.mutateAsync(deleteConfirmation.file.file_id);

            // Remove from selected files if it was selected
            const updatedFileIds = selectedFileIds.filter(id => id !== deleteConfirmation.file!.file_id);
            setSelectedFileIds(updatedFileIds);

            // Manually refetch the files list
            await refetch();

            // Close confirmation dialog
            setDeleteConfirmation({ isOpen: false, file: null });
        } catch (error) {
            console.error('Failed to delete file:', error);
            // You could add a toast notification here for better UX
        }
    };

    const handleDeleteCancel = () => {
        if (!deleteFileMutation.isPending) {
            setDeleteConfirmation({ isOpen: false, file: null });
        }
    };

    const isAllSelected = filteredFiles?.length > 0 &&
        filteredFiles.every(file => selectedFileIds.includes(file.file_id));

    const isSomeSelected = filteredFiles?.some(file => selectedFileIds.includes(file.file_id)) && !isAllSelected;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50"
                onClick={handleBackdropClick}
            >
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <FileSearch className="w-6 h-6 text-blue-600" />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Files & AI Search
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedFileIds.length > 0
                                        ? `${selectedFileIds.length} of ${files?.length || 0} files selected for AI search`
                                        : `${files?.length || 0} files available • AI will search all documents`
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search and Controls */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search files by name or type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-gray-500 placeholder:text-gray-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleSelectAll}
                                disabled={!filteredFiles || filteredFiles.length === 0}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isAllSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : isSomeSelected
                                        ? 'bg-blue-100 border-blue-600'
                                        : 'border-gray-300'
                                    }`}>
                                    {isAllSelected && <Check className="w-3 h-3 text-white" />}
                                    {isSomeSelected && <div className="w-2 h-2 bg-blue-600 rounded-sm" />}
                                </div>
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>

                            <div className="flex items-center gap-3">
                                {selectedFileIds.length > 0 && (
                                    <button
                                        onClick={clearFileSelection}
                                        className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md px-2 py-1"
                                    >
                                        Clear Selection
                                    </button>
                                )}
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Zap className="w-4 h-4" />
                                    {selectedFileIds.length === 0 ? 'Search All' : 'Targeted Search'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="overflow-y-auto max-h-[50vh]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-gray-600">Loading files...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 px-6">
                                <div className="text-red-500 mb-2">Failed to load files</div>
                                <button
                                    onClick={() => refetch()}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : !filteredFiles || filteredFiles.length === 0 ? (
                            <div className="text-center py-8 px-6">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {searchTerm ? 'No files match your search' : 'No files uploaded'}
                                </h3>
                                <p className="text-gray-500">
                                    {searchTerm
                                        ? 'Try adjusting your search terms'
                                        : 'Upload some files to enable document search'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredFiles.map((file) => {
                                    const isSelected = selectedFileIds.includes(file.file_id);
                                    return (
                                        <div
                                            key={file.file_id}
                                            className={`group p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Checkbox */}
                                                <div
                                                    className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-300 hover:border-blue-400'
                                                        }`}
                                                    onClick={() => toggleFileSelection(file.file_id)}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>

                                                {/* File Icon */}
                                                <div className="text-xl">
                                                    {getFileTypeIcon(file.file_type)}
                                                </div>

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleFileSelection(file.file_id)}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                            {file.file_name}
                                                        </h3>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isSelected
                                                            ? 'bg-blue-200 text-blue-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {getFileTypeName(file.file_type)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <HardDrive className="w-3 h-3" />
                                                            {formatFileSize(file.file_size)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(file.upload_date)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            {file.chunk_count} chunks
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, file)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    title={`Delete ${file.file_name}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {selectedFileIds.length === 0 ? (
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-4 h-4 text-blue-500" />
                                        AI will search across all uploaded documents
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <FileSearch className="w-4 h-4 text-blue-500" />
                                        AI will search only in {selectedFileIds.length} selected file{selectedFileIds.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                            {files && files.length > 0 && (
                                <div className="text-xs text-gray-500">
                                    {files.length} files • {formatFileSize(
                                        files.reduce((acc, file) => acc + file.file_size, 0)
                                    )} • {files.reduce((acc, file) => acc + file.chunk_count, 0)} chunks
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                file={deleteConfirmation.file}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                isDeleting={deleteFileMutation.isPending}
            />
        </>
    );
}; 