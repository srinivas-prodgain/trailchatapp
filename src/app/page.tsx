"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/chat/${uuidv4()}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-50">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
        <p className="text-3xl font-bold text-gray-800 mb-2">New Chat</p>
        <p className="text-gray-500 text-base">Start a new conversation</p>
      </div>
      <form className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4" onSubmit={handleSubmit}>
        <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent outline-none text-gray-800 text-base placeholder-gray-400"
          />
          <button
            type="submit"
            className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
