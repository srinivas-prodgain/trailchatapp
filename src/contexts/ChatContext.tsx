'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  initialMessage: string | null;
  setInitialMessage: (message: string | null) => void;
  clearInitialMessage: () => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [initialMessage, setInitialMessageState] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const setInitialMessage = (message: string | null) => {
    setInitialMessageState(message);
  };

  const clearInitialMessage = () => {
    setInitialMessageState(null);
  };

  return (
    <ChatContext.Provider value={{
      initialMessage,
      setInitialMessage,
      clearInitialMessage,
      activeConversationId, 
      setActiveConversationId,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
} 