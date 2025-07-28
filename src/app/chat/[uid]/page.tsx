'use client'

import { useState, useRef, useEffect, use } from "react";
import { TChatMessage, TMessage } from "@/types/common-types";
import { useChatContext } from "@/contexts/chat-context";
import { useStreamChat } from "@/hooks/api/chat";
import { Paperclip, FolderOpen } from "lucide-react";

import { useConversation } from "@/hooks/api/conversation";


import { useQueryClient } from "@tanstack/react-query";
import { MessageContent } from "@/components/message-component";
import { FileUploadModal } from "@/components/file-upload-modal";
import { FilesContextModal } from "@/components/files-context-modal";



export default function ChatPage({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = use(params);
    const queryClient = useQueryClient();

    const {
        initialMessage,
        clearInitialMessage,
        setActiveConversationId,
        selectedModel,
        setSelectedModel,
        selectedFileIds,
        globalInput,
        setGlobalInput,
        isFileUploadModalOpen,
        setIsFileUploadModalOpen,
        isFilesContextModalOpen,
        setIsFilesContextModalOpen,
        filesData,
        isLoadingFiles,
        modelOptions,
        handleFilesUploaded
    } = useChatContext();

    const [messages, setMessages] = useState<TMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentMessage, setCurrentMessage] = useState("");
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [conversationTitle, setConversationTitle] = useState(" ");


    const abortControllerRef = useRef<AbortController | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    const streamChatMutation = useStreamChat(uid, messages, "123", selectedModel, selectedFileIds);
    const { data: conversationData, isLoading: isLoadingConversation } = useConversation(uid);

    useEffect(() => {
        setActiveConversationId(uid);
    }, [uid, setActiveConversationId]);


    useEffect(() => {
        if (conversationData?.data && !initialMessage) {
            const conversation = conversationData.data;
            setConversationTitle(conversation.title);

            if (conversation.messages && conversation.messages.length > 0) {
                const convertedMessages: TMessage[] = conversation.messages.map((msg: TChatMessage) => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.message
                }));
                setMessages(convertedMessages);
            }
        }
    }, [conversationData, initialMessage]);

    useEffect(() => {
        if (initialMessage) {
            console.log('Sending initial message:', initialMessage);
            sendMessage(initialMessage);
            clearInitialMessage();
        }
    }, [initialMessage]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming, currentMessage]);

    const abortResponse = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (currentMessage.trim()) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: currentMessage
            }]);
        }

        setIsStreaming(false);
        setCurrentMessage('');
        setIsWaitingForResponse(false);
    };

    const sendMessage = async (messageContent?: string) => {
        const contentToSend = messageContent || globalInput;
        if (!contentToSend.trim() || isStreaming) return;

        const userMessage: TMessage = {
            role: "user",
            content: contentToSend,
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setGlobalInput('');
        setIsStreaming(true);
        setCurrentMessage('');
        setIsWaitingForResponse(true);

        abortControllerRef.current = new AbortController();

        try {
            const response = await streamChatMutation.mutateAsync({
                uid,
                messages: newMessages,
                userId: "123",
                model: selectedModel,
                selectedFileIds,
                abortSignal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to get reader");
            }

            const decoder = new TextDecoder();
            let accumulatedResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: accumulatedResponse
                    }]);
                    setCurrentMessage('');
                    setIsStreaming(false);
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                setIsWaitingForResponse(false);

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            console.log("done");
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedResponse += parsed.content;
                                setCurrentMessage(accumulatedResponse);
                            }

                            if (parsed.conversationId && conversationTitle === "New Chat") {
                                setConversationTitle("New Chat");
                            }
                        } catch (e) { }
                    }
                }
            }

            queryClient.invalidateQueries({ queryKey: ['conversation', uid] });
            queryClient.invalidateQueries({ queryKey: ['userConversations', '123'] });

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.'
                }]);
            }
            setIsStreaming(false);
            setCurrentMessage('');
            setIsWaitingForResponse(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full max-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
            {/* Model Selector Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-800">
                    {conversationTitle || "Chat"}
                </h1>
                <div className="flex items-center gap-3">
                    {/* Files in Context Button */}
                    <button
                        onClick={() => setIsFilesContextModalOpen(true)}
                        className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group border hover:border-gray-300 ${selectedFileIds.length > 0
                            ? 'text-blue-700 border-blue-200 bg-blue-50'
                            : 'text-gray-600 border-gray-200 hover:text-gray-800'
                            }`}
                        title={selectedFileIds.length > 0
                            ? `${selectedFileIds.length} of ${filesData?.length || 0} files selected for AI search`
                            : `${filesData?.length || 0} files available • AI will search all`
                        }
                        disabled={isStreaming}
                    >
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {selectedFileIds.length > 0 ? 'Selected Files' : 'Files'}
                        </span>
                        {isLoadingFiles ? (
                            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        ) : (
                            <div className="flex items-center gap-1">
                                {selectedFileIds.length > 0 && (
                                    <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                                        {selectedFileIds.length}
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-6">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg shadow ${msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                    {msg.role === 'user' ? 'U' : 'A'}
                                </div>
                                <div
                                    className={`px-4 py-2 rounded-2xl shadow-md text-base max-w-xs sm:max-w-md break-words ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'}
                                    `}
                                >
                                    <MessageContent content={msg.content} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {isWaitingForResponse && (
                        <div className="flex justify-start">
                            <div className="flex items-end gap-2">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg shadow bg-green-500">
                                    A
                                </div>
                                <div className="px-4 py-2 rounded-2xl shadow-md text-base whitespace-pre-line max-w-xs sm:max-w-md break-words bg-white text-gray-900 rounded-bl-md border border-gray-200 animate-pulse">
                                    AI is thinking...
                                </div>
                            </div>
                        </div>
                    )}
                    {isStreaming && currentMessage && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-2">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg shadow bg-green-500">
                                    A
                                </div>
                                <div className="px-4 py-2 rounded-2xl shadow-md text-base max-w-xs sm:max-w-md break-words bg-white text-gray-900 rounded-bl-md border border-gray-200 animate-pulse">
                                    <MessageContent content={currentMessage} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messageEndRef} />
                </div>
            </div>

            {/* Input Form */}
            <form
                className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 bg-white border-t border-gray-200 flex items-center gap-2 sticky bottom-0 shadow-md mb-4 rounded-lg"
                onSubmit={e => { e.preventDefault(); sendMessage(); }}
            >
                <button
                    onClick={() => setIsFileUploadModalOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer bg-gray-100"
                    title="Upload files"
                    disabled={isStreaming}
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <input
                    type="text"
                    value={globalInput}
                    onChange={e => setGlobalInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent outline-none text-gray-800 text-base placeholder-gray-400 px-4 py-2"
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

            {/* File Upload Modal */}
            <FileUploadModal
                isOpen={isFileUploadModalOpen}
                onClose={() => setIsFileUploadModalOpen(false)}
                onFilesUploaded={handleFilesUploaded}
            />

            {/* Files Context Modal */}
            <FilesContextModal
                isOpen={isFilesContextModalOpen}
                onClose={() => setIsFilesContextModalOpen(false)}
            />
        </div>
    );
}