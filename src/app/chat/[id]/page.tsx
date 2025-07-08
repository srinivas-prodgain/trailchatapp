'use client'

import { useState, useRef, useEffect, use } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}


const initialMessages: Message[] = [
    { role: "assistant", content: "Hello! How can I help you today?" },
    { role: "user", content: "Tell me a joke." },
    { role: "assistant", content: "Why did the scarecrow win an award? Because he was outstanding in his field!" },
];



export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentMessage, setCurrentMessage] = useState("");
    const messageEndRef = useRef<HTMLDivElement>(null);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming, currentMessage])

    const sendMessage = async () => {
        if (!input.trim() || isStreaming) return;
        const userMessage: Message = {
            role: "user",
            content: input,
        }
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsStreaming(true);
        setCurrentMessage('');
        setIsWaitingForResponse(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: newMessages }),
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
                        } catch (e) { }
                    }
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.'
            }]);
            setIsStreaming(false);
            setCurrentMessage('');
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <div className="flex flex-col h-full max-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <h1 className="text-lg font-semibold text-gray-800">Chat {id}</h1>
            </div>
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
                                    Ai is thinking...
                                </div>
                            </div>
                        </div>
                    )

                    }
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
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow"
                    disabled={!input.trim() || isStreaming}
                >
                    Send
                </button>
            </form>
        </div>
    );
}