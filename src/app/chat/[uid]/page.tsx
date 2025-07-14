'use client'

import { useState, useRef, useEffect, use } from "react";
import { Message } from "@/lib/api";
import { useChatContext } from "@/contexts/ChatContext";
import { useConversation, useStreamChat } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = use(params);
    const { initialMessage, clearInitialMessage, setActiveConversationId } = useChatContext();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentMessage, setCurrentMessage] = useState("");
    const messageEndRef = useRef<HTMLDivElement>(null);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [conversationTitle, setConversationTitle] = useState(" ");
    const abortControllerRef = useRef<AbortController | null>(null);

    const queryClient = useQueryClient();
    const streamChatMutation = useStreamChat();

    // Use TanStack Query to load conversation
    const { data: conversationData, isLoading: isLoadingConversation } = useConversation(uid);

    useEffect(() => {
        setActiveConversationId(uid);
    }, [uid, setActiveConversationId]);

    // Load conversation data when available
    useEffect(() => {
        if (conversationData && !initialMessage) {
            const { conversation, messages: dbMessages } = conversationData;
            setConversationTitle(conversation.title);

            const convertedMessages: Message[] = dbMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.message
            }));
            setMessages(convertedMessages);
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

        // Save the current partial response
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
        console.log("sending message", messageContent);
        const contentToSend = messageContent || input;
        if (!contentToSend.trim() || isStreaming) return;

        const userMessage: Message = {
            role: "user",
            content: contentToSend,
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsStreaming(true);
        setCurrentMessage('');
        setIsWaitingForResponse(true);

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
            const response = await streamChatMutation.mutateAsync({
                uid,
                messages: newMessages,
                userId: "123",
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
                            // End of stream
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedResponse += parsed.content;
                                setCurrentMessage(accumulatedResponse);
                            }
                            // Update conversation title if this is a new conversation
                            if (parsed.conversationId && conversationTitle === "New Chat") {
                                setConversationTitle("New Chat");
                            }
                        } catch (e) { }
                    }
                }
            }

            // Invalidate conversation data to refetch after new message
            queryClient.invalidateQueries({ queryKey: ['conversation', uid] });
            queryClient.invalidateQueries({ queryKey: ['userConversations', '123'] });

        } catch (error) {
            // Check if it's an abort error
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Request was aborted');
                // The response is already saved in abortResponse function
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
            console.log("Enter key pressed");
        }
    };

    // if (isLoadingConversation && !initialMessage) {
    //     // console.log("loading conversation");
    //     // console.log("initialMessage", initialMessage);
    //     return (
    //         <div className="flex flex-col h-full max-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
    //             <div className="flex-1 flex items-center justify-center">
    //                 <p className="text-gray-500">Loading conversation...</p>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col h-full max-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-6">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg shadow ${msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                    {msg.role === 'user' ? 'U' : 'A'}
                                </div>
                                <div
                                    className={`px-4 py-2 rounded-2xl shadow-md text-base whitespace-pre-line max-w-xs sm:max-w-md break-words ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'}
                                    `}
                                >
                                    {msg.content}
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
                            <div className="flex items-end gap-2">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg shadow bg-green-500">
                                    A
                                </div>
                                <div className="px-4 py-2 rounded-2xl shadow-md text-base whitespace-pre-line max-w-xs sm:max-w-md break-words bg-white text-gray-900 rounded-bl-md border border-gray-200 animate-pulse">
                                    {currentMessage}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messageEndRef} />
                </div>
            </div>
            <form
                className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 bg-white border-t border-gray-200 flex items-center gap-2 sticky bottom-0 shadow-md mb-4 rounded-lg"
                onSubmit={e => { e.preventDefault(); sendMessage(); }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
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
                        disabled={!input.trim() || isStreaming}
                    >
                        Send
                    </button>
                )}
            </form>
        </div>
    );
}