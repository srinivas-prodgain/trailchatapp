'use client'

import { FolderOpen } from "lucide-react";
import { TUploadedFile } from "@/hooks/api/file";

export type TChatHeaderProps = {
    conversationTitle: string;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    isStreaming: boolean;
    selected_file_ids: string[];
    filesData: TUploadedFile[] | undefined;
    isLoadingFiles: boolean;
    modelOptions: Array<{ value: string; label: string; disabled: boolean }>;
    setIsFilesContextModalOpen: (open: boolean) => void;
};

export function ChatHeader({
    conversationTitle,
    selectedModel,
    setSelectedModel,
    isStreaming,
    selected_file_ids,
    filesData,
    isLoadingFiles,
    modelOptions,
    setIsFilesContextModalOpen
}: TChatHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">
                {conversationTitle || "Chat"}
            </h1>
            <div className="flex items-center gap-3">
                {/* Files in Context Button */}
                <button
                    onClick={() => setIsFilesContextModalOpen(true)}
                    className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group border hover:border-gray-300 ${selected_file_ids.length > 0
                        ? 'text-blue-700 border-blue-200 bg-blue-50'
                        : 'text-gray-600 border-gray-200 hover:text-gray-800'
                        }`}
                    title={selected_file_ids.length > 0
                        ? `${selected_file_ids.length} of ${filesData?.length || 0} files selected for AI search`
                        : `${filesData?.length || 0} files available • AI will search all`
                    }
                    disabled={isStreaming}
                >
                    <FolderOpen className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        {selected_file_ids.length > 0 ? 'Selected Files' : 'Files'}
                    </span>
                    {isLoadingFiles ? (
                        <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    ) : (
                        <div className="flex items-center gap-1">
                            {selected_file_ids.length > 0 && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                                    {selected_file_ids.length}
                                </span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                                {filesData?.length || 0}
                            </span>
                        </div>
                    )}
                </button>

                <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <label htmlFor="model-select" className="text-sm font-medium text-gray-600 whitespace-nowrap">
                        Model:
                    </label>
                    <select
                        id="model-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer hover:border-gray-300"
                        disabled={isStreaming}
                    >
                        {modelOptions.map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled} className="text-black bg-white">
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}