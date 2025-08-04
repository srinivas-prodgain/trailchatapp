'use client'

import { Paperclip } from "lucide-react";

export type TChatInputFormProps = {
    globalInput: string;
    setGlobalInput: (input: string) => void;
    isStreaming: boolean;
    handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    sendMessage: () => void;
    abortResponse: () => void;
    setIsFileUploadModalOpen: (open: boolean) => void;
};

export function ChatInputForm({
    globalInput,
    setGlobalInput,
    isStreaming,
    handleKeyPress,
    sendMessage,
    abortResponse,
    setIsFileUploadModalOpen
}: TChatInputFormProps) {
    return (
        <form
            className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 bg-white border-t border-gray-200 flex items-center gap-2 sticky bottom-0 shadow-md mb-4 rounded-lg"
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
        >
            <button
                type="button"
                onClick={() => setIsFileUploadModalOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer bg-gray-100"
                title="Upload files"
                disabled={isStreaming}
            >
                <Paperclip className="w-5 h-5" />
            </button>
            <textarea
                value={globalInput}
                onChange={e => setGlobalInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-transparent outline-none text-gray-800 text-base placeholder-gray-400 px-4 py-2 resize-none min-h-[40px] max-h-[120px]"
                rows={1}
                disabled={isStreaming}
            />
            {isStreaming ? (
                <button
                    type="button"
                    onClick={abortResponse}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow"
                >
                    Stop
                </button>
            ) : (
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow"
                    disabled={!globalInput.trim() || isStreaming}
                >
                    Send
                </button>
            )}
        </form>
    );
}