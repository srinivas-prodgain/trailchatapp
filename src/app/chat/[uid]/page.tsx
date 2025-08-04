'use client'

import { useState, useRef, useEffect, use, useCallback } from "react";
import { TChatMessage, TMessage } from "@/types/common-types";
import { useChatContext } from "@/contexts/chat-context";
import { useStreamChat } from "@/hooks/api/chat";

import { useConversation } from "@/hooks/api/conversation";


import { useQueryClient } from "@tanstack/react-query";
import { FileUploadModal } from "@/components/file-upload-modal";
import { FilesContextModal } from "@/components/files-context-modal";
import { TToolStatus } from "@/types/shared";
import { ChatHeader } from "@/components/chat-header";
import { ChatInputForm } from "@/components/chat-input-form";
import { MessageItem } from "@/components/message-item";
import { MessageContent } from "@/components/message-component";



export default function ChatPage({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = use(params);
    const queryClient = useQueryClient();

    const {
        initialMessage,
        clearInitialMessage,
        setActiveConversationId,
        selectedModel,
        setSelectedModel,
        selected_file_ids,
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
    const [toolStatus, setToolStatus] = useState<TToolStatus | null>(null);


    const abortControllerRef = useRef<AbortController | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    const streamChatMutation = useStreamChat(uid, messages, "123", selectedModel, selected_file_ids);
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

    // Auto-resize textarea based on content
    useEffect(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 120);
            textarea.style.height = `${newHeight}px`;
        }
    }, [globalInput]);

    const abortResponse = useCallback(() => {
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
    }, [currentMessage]);

    const sendMessage = useCallback(async (messageContent?: string) => {
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
                user_id: "123",
                model: selectedModel,
                selected_file_ids,
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
                            setToolStatus(null); // Clear tool status when done
                            break;
                        }
                        try {
                            const parsed = JSON.parse(data);

                            // Handle tool status updates
                            if (parsed.type === 'tool_status') {
                                setToolStatus({
                                    tool: parsed.tool,
                                    status: parsed.status,
                                    details: parsed.details
                                });
                                continue; // Skip to next line
                            }

                            // Handle regular message content
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
    }, [uid, messages, selectedModel, selected_file_ids, globalInput, isStreaming, streamChatMutation, queryClient]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (e.shiftKey) {
                // Allow default behavior for Shift + Enter (new line)
                return;
            } else {
                // Prevent default and send message for just Enter
                e.preventDefault();
                sendMessage();
            }
        }
    }, [sendMessage]);

    return (
        <div className="flex flex-col h-full max-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
            {/* Memoized Header */}
            <ChatHeader
                conversationTitle={conversationTitle}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                isStreaming={isStreaming}
                selected_file_ids={selected_file_ids}
                filesData={filesData}
                isLoadingFiles={isLoadingFiles}
                modelOptions={modelOptions}
                setIsFilesContextModalOpen={setIsFilesContextModalOpen}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-6">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                    {messages.map((msg, idx) => (
                        <MessageItem
                            key={`${idx}-${msg.content.slice(0, 50)}`}
                            message={msg}
                            index={idx}
                            toolStatus={msg.role === 'assistant' && idx === messages.length - 1 ? toolStatus : null}
                        />
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
                    {isStreaming  && (
                        <div className="flex justify-start mb-4">
                            <div className="max-w-[70%] px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                                <MessageContent
                                    content={currentMessage}
                                    toolStatus={toolStatus}
                                />
                            </div>
                        </div>
                    )}
                    <div ref={messageEndRef} />
                </div>
            </div>

            {/* Memoized Input Form */}
            <ChatInputForm
                globalInput={globalInput}
                setGlobalInput={setGlobalInput}
                isStreaming={isStreaming}
                handleKeyPress={handleKeyPress}
                sendMessage={sendMessage}
                abortResponse={abortResponse}
                setIsFileUploadModalOpen={setIsFileUploadModalOpen}
            />

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