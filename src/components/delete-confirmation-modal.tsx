'use client';

import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { TUploadedFile } from '@/hooks/api/file';

type TDeleteConfirmationModalProps = {
    isOpen: boolean;
    file: TUploadedFile | null;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}

export const DeleteConfirmationModal: React.FC<TDeleteConfirmationModalProps> = ({
    isOpen,
    file,
    onConfirm,
    onCancel,
    isDeleting
}) => {
    if (!isOpen || !file) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isDeleting) {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Delete File</h3>
                        <p className="text-sm text-gray-500">This action cannot be undone</p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 mb-2">
                        Are you sure you want to delete <span className="font-medium">"{file.file_name}"</span>?
                    </p>
                    <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-red-800">
                            • This will permanently remove the file and all its {file.chunk_count} chunks from the AI search
                        </p>
                        <p className="text-sm text-red-800">
                            • Any ongoing conversations referencing this file may be affected
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete File
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}; 