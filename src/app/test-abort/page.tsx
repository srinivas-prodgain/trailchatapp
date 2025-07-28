'use client'

import { useState, useRef } from 'react';

export default function TestAbortPage() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    const startStream = async () => {
        setIsStreaming(true);
        setMessages([]);

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        try {
            console.log('🧪 FE: Starting test stream...');
            console.log('🧪 FE: AbortController created:', abortControllerRef.current);
            console.log('🧪 FE: Initial abort signal state:', abortControllerRef.current.signal.aborted);

            const response = await fetch('http://localhost:3001/api/v1/stream/test-abort', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
                signal: abortControllerRef.current.signal
            });

            console.log('🧪 FE: Response received:', response.status, response.statusText);
            console.log('🧪 FE: Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get reader');
            }

            console.log('🧪 FE: Reader obtained, starting to read stream...');
            const decoder = new TextDecoder();
            let chunkCount = 0;

            while (true) {
                console.log('🧪 FE: Reading chunk', chunkCount++);
                console.log('🧪 FE: Abort signal state before read:', abortControllerRef.current.signal.aborted);

                const { done, value } = await reader.read();

                console.log('🧪 FE: Read result - done:', done, 'value length:', value?.length);

                if (done) {
                    console.log('🧪 FE: Stream completed normally');
                    setIsStreaming(false);
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                console.log('🧪 FE: Decoded chunk:', chunk);

                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        console.log('🧪 FE: Processing data:', data);

                        if (data === '[DONE]') {
                            console.log('🧪 FE: Received [DONE]');
                            setIsStreaming(false);
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.message) {
                                console.log('🧪 FE: Received message:', parsed.message);
                                setMessages(prev => [...prev, parsed.message]);
                            }
                        } catch (e) {
                            console.log('🧪 FE: Parse error:', e);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.log('🧪 FE: Error caught:', error);
            console.log('🧪 FE: Error name:', error.name);
            console.log('🧪 FE: Error message:', error.message);
            console.log('🧪 FE: Error stack:', error.stack);
            console.log('🧪 FE: Abort signal state:', abortControllerRef.current?.signal.aborted);

            if (error.name === 'AbortError') {
                console.log('🧪 FE: Stream was aborted successfully');
            }
            setIsStreaming(false);
        }
    };

    const abortStream = () => {
        console.log('🧪 FE: Aborting stream...');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsStreaming(false);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Abort Signal Test</h1>

            <div className="mb-6">
                <p className="text-gray-600 mb-4">
                    This test will start a 10-second stream from the backend.
                    Click "Abort Stream" to test if the backend properly detects the disconnect.
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={startStream}
                        disabled={isStreaming}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Start Stream
                    </button>

                    <button
                        onClick={abortStream}
                        disabled={!isStreaming}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        Abort Stream
                    </button>
                </div>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Stream Messages:</h3>
                <div className="space-y-1">
                    {messages.map((msg, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                            {msg}
                        </div>
                    ))}
                </div>

                {isStreaming && (
                    <div className="text-sm text-blue-600 mt-2">
                        🔄 Streaming... (Check backend console for abort detection)
                    </div>
                )}
            </div>

            <div className="mt-6 text-sm text-gray-600">
                <p><strong>How to test:</strong></p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Start the backend server and watch the console logs</li>
                    <li>Click "Start Stream" - you should see "🧪 TEST: Starting 10-second stream..." in backend console</li>
                    <li>After 2-3 seconds, click "Abort Stream"</li>
                    <li>Check backend console for "🧪 TEST: Abort detected at second X" message</li>
                    <li>If you see the abort message, the signal is working! 🎉</li>
                </ol>
            </div>
        </div>
    );
} 