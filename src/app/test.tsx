'use client'

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}


export default function Home() {

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  // const [currentMessage, setCurrentMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming])

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
    // setCurrentMessage('');

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
          // setCurrentMessage('');
          setIsStreaming(false);
          console.log("done is true");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        console.log("chunk", chunk);
        const lines = chunk.split('\n');
        console.log("lines", lines);


        for (const line of lines) {
          console.log("line", line);
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log("data is [DONE]");
              // setMessages(prev => [...prev, {
              //     role: 'assistant',
              //     content: accumulatedResponse
              // }]);
              // setCurrentResponse('');
              // setIsStreaming(false);
              // return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedResponse += parsed.content;
                // setCurrentMessage(accumulatedResponse);
              }
            } catch (e) {
              console.log("error", e);
            }
          }
        }
      }


    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }]);
      setIsStreaming(false);
      // setCurrentMessage('');
    }

  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }



  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}