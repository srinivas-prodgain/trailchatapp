'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FileUploadZone } from '@/components/file-upload-zone';
import { TFileUploadState } from '@/types/common-types';

type FileUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onFilesUploaded?: (files: TFileUploadState[]) => void;
};

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
    isOpen,
    onClose,
    onFilesUploaded,
}) => {
    const [uploadedFiles, setUploadedFiles] = useState<TFileUploadState[]>([]);

    if (!isOpen) return null;

    const handleFilesSelected = (files: TFileUploadState[]) => {
        setUploadedFiles(files);
        onFilesUploaded?.(files);
    };

    const handleDone = () => {
        const completedFiles = uploadedFiles.filter(f => f.uploadStatus === 'completed');
        onFilesUploaded?.(completedFiles);
        onClose();
        setUploadedFiles([]);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Upload Files
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <FileUploadZone onFilesSelected={handleFilesSelected} />
                </div>

                {/* Footer */}
                {uploadedFiles.length > 0 && (
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex-1">
                            {(() => {
                                const completed = uploadedFiles.filter(f => f.uploadStatus === 'completed').length;
                                const uploading = uploadedFiles.filter(f => f.uploadStatus === 'uploading').length;
                                const pending = uploadedFiles.filter(f => f.uploadStatus === 'pending').length;
                                const failed = uploadedFiles.filter(f => f.uploadStatus === 'error').length;
                                const total = uploadedFiles.length;

                                if (uploading > 0) {
                                    return (
                                        <div className="text-sm">
                                            <div className="text-blue-600 font-medium">
                                                Uploading {uploading} of {total} files...
                                            </div>
                                            {completed > 0 && (
                                                <div className="text-green-600 text-xs mt-1">
                                                    {completed} completed
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else if (completed === total) {
                                    return (
                                        <div className="text-sm text-green-600 font-medium">
                                            ✅ All {total} files uploaded successfully
                                        </div>
                                    );
                                } else if (completed > 0) {
                                    return (
                                        <div className="text-sm">
                                            <div className="text-green-600 font-medium">
                                                {completed} of {total} files uploaded successfully
                                            </div>
                                            {failed > 0 && (
                                                <div className="text-red-600 text-xs mt-1">
                                                    {failed} failed
                                                </div>
                                            )}
                                            {pending > 0 && (
                                                <div className="text-gray-600 text-xs mt-1">
                                                    {pending} pending
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else if (pending > 0) {
                                    return (
                                        <div className="text-sm text-gray-600">
                                            {pending} files ready to upload
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="text-sm text-red-600">
                                            Upload failed for all files
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                        <div>
                            <button
                                onClick={handleDone}
                                disabled={uploadedFiles.filter(f => f.uploadStatus === 'completed').length === 0}
                                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}; 
