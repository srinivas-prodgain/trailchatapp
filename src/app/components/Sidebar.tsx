'use client'
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PlusIcon, TrashIcon } from 'lucide-react'

import { useUserConversations, useDeleteConversation } from "@/lib/hooks";
import { useChatContext } from "@/contexts/ChatContext";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { activeConversationId, setActiveConversationId } = useChatContext();

  const { data: conversations = [], isLoading, error } = useUserConversations("123");
  const deleteConversationMutation = useDeleteConversation();

  const handleClick = (uid: string) => {
    setActiveConversationId(uid);
    router.push(`/chat/${uid}`);
  }

  const handleDelete = (id: string, uid: string) => {
    deleteConversationMutation.mutate(id);

    if (activeConversationId && activeConversationId === uid) {
      router.push(`/`);
    }

    console.log("deleting conversation", id);
  }

  if (isLoading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 h-screen">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Conversations</h2>
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              New Chat
            </div>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 h-screen">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Conversations</h2>
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              New Chat
            </div>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Error loading conversations</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 h-screen">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Conversations</h2>
      <div className="flex items-center gap-2" onClick={() => setActiveConversationId(null)}>
        <Link href="/">
          <div className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            New Chat
          </div>
        </Link>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto">

        {conversations.map((conv) => (
          <li
            key={conv._id}
            className={`group px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors flex justify-between items-center ${activeConversationId === conv.uid ? "bg-blue-100" : ""}`}
            onClick={() => handleClick(conv.uid)}
          >
            <p className="text-lg">{conv.title}</p>
            <button
              className="opacity-0 group-hover:opacity-100 text-sm text-gray-500 hover:text-red-500 hover:scale-110 transition-all duration-300 hover:cursor-pointer mr-2"
              onClick={e => { e.stopPropagation(); handleDelete(conv._id, conv.uid); }}
              disabled={deleteConversationMutation.isPending}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-xs text-gray-400">&copy; 2024 TrailChat</div>
    </aside>
  );
};

export default Sidebar; 