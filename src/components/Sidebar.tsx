'use client'
import React, { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PlusIcon, TrashIcon, Loader2 } from 'lucide-react'

import { useInfiniteConversations, useDeleteConversation } from "../hooks/api/conversation";

import { useChatContext } from "@/contexts/chat-context";

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { activeConversationId, setActiveConversationId } = useChatContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteConversations("123", 3); // Smaller page size for testing

  const deleteConversationMutation = useDeleteConversation();

  // Flatten all conversations from all pages
  const conversations = data?.pages.flatMap(page => page.data).filter(Boolean) || [];


  const handleClick = (id: string) => {
    setActiveConversationId(id);
    router.push(`/chat/${id}`);
  }

  const handleDelete = (id: string) => {
    deleteConversationMutation.mutate(id);

    if (activeConversationId && activeConversationId === id) {
      router.push(`/`);
    }

  }

  // Intersection Observer for infinite scroll
  const lastConversationElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || !node) return;

    const observer = new IntersectionObserver(entries => {

      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, {
      // More conservative settings to prevent premature loading
      threshold: 0.5,
      rootMargin: '50px'
    });

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, conversations.length]);

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
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p>Loading conversations...</p>
          </div>
        </div>
      </aside>
    );
  }

  if (isError) {
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

      {/* Conversations List with Infinite Scroll */}
      <div className="flex-1 flex flex-col min-h-0 mt-4">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-2"
          style={{ minHeight: '400px' }} // Ensure container has minimum height
        >
          {conversations.map((conv, index) => {
            if (!conv) return null;
            const isLast = index === conversations.length - 1;
            return (
              <div
                key={conv._id}
                ref={isLast && hasNextPage ? lastConversationElementRef : undefined}
                className={`group px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors flex justify-between items-center ${activeConversationId === conv._id ? "bg-blue-100" : ""}`}
                onClick={() => handleClick(conv._id)}
              >
                <p className="text-lg truncate">{conv.title}</p>
                <button
                  className="opacity-0 group-hover:opacity-100 text-sm text-gray-500 hover:text-red-500 hover:scale-110 transition-all duration-300 hover:cursor-pointer mr-2"
                  onClick={e => { e.stopPropagation(); handleDelete(conv._id); }}
                  disabled={deleteConversationMutation.isPending}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Loading indicator for next page */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            </div>
          )}

          {/* End of list indicator */}
          {!hasNextPage && conversations.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <span className="text-xs text-gray-400">No more conversations</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-400">&copy; 2024 TrailChat</div>
    </aside>
  );
};

export default Sidebar; 