'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TFileUploadState } from '@/types/common-types';
import { useGetAllFilesMetaData, TUploadedFile } from '@/hooks/api/file';

export type ChatContextType = {
  // Global input state that persists across conversations
  globalInput: string;
  setGlobalInput: (input: string) => void;
  clearGlobalInput: () => void;

  // For programmatic message sending (like from new chat page)
  initialMessage: string | null;
  setInitialMessage: (message: string | null) => void;
  clearInitialMessage: () => void;

  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selected_file_ids: string[];
  setSelectedFileIds: (file_ids: string[]) => void;
  toggleFileSelection: (file_id: string) => void;
  clearFileSelection: () => void;

  // Global modal states
  isFileUploadModalOpen: boolean;
  setIsFileUploadModalOpen: (open: boolean) => void;
  isFilesContextModalOpen: boolean;
  setIsFilesContextModalOpen: (open: boolean) => void;
  uploadedFiles: TFileUploadState[];
  setUploadedFiles: (files: TFileUploadState[]) => void;

  // Global files data
  filesData: TUploadedFile[] | undefined;
  isLoadingFiles: boolean;

  // Global functions and constants
  modelOptions: Array<{ value: string; label: string; disabled: boolean }>;
  handleFilesUploaded: (files: TFileUploadState[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [globalInput, setGlobalInputState] = useState<string>('');
  const [initialMessage, setInitialMessageState] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<string>('openai');
  const [selected_file_ids, setSelectedFileIds] = useState<string[]>([]);

  // Global modal states
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState<boolean>(false);
  const [isFilesContextModalOpen, setIsFilesContextModalOpen] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<TFileUploadState[]>([]);

  // Global files data
  const { data: filesData, isLoading: isLoadingFiles } = useGetAllFilesMetaData();

  // Global constants
  const modelOptions = [
    { value: 'openai', label: 'OpenAI GPT-4o-mini', disabled: false },
    { value: 'mistral', label: 'Mistral Large', disabled: false },
    { value: 'gemini', label: 'Google Gemini (Coming Soon)', disabled: true }
  ];

  const setGlobalInput = (input: string) => {
    setGlobalInputState(input);
  };

  const clearGlobalInput = () => {
    setGlobalInputState('');
  };

  const setInitialMessage = (message: string | null) => {
    setInitialMessageState(message);
  };

  const clearInitialMessage = () => {
    setInitialMessageState(null);
  };

  const setSelectedModel = (model: string) => {
    // Prevent gemini from being selected for now
    if (model === 'gemini') {
      setSelectedModelState('openai');
    } else {
      setSelectedModelState(model);
    }
  };

  const toggleFileSelection = (file_id: string) => {
    setSelectedFileIds(prev =>
      prev.includes(file_id)
        ? prev.filter(id => id !== file_id)
        : [...prev, file_id]
    );
  };

  const clearFileSelection = () => {
    setSelectedFileIds([]);
  };

  const handleFilesUploaded = (files: TFileUploadState[]) => {
    setUploadedFiles(files);
    console.log('Files uploaded:', files);
  };

  return (
    <ChatContext.Provider value={{
      globalInput,
      setGlobalInput,
      clearGlobalInput,
      initialMessage,
      setInitialMessage,
      clearInitialMessage,
      activeConversationId,
      setActiveConversationId,
      selectedModel,
      setSelectedModel,
      selected_file_ids,
      setSelectedFileIds,
      toggleFileSelection,
      clearFileSelection,
      isFileUploadModalOpen,
      setIsFileUploadModalOpen,
      isFilesContextModalOpen,
      setIsFilesContextModalOpen,
      uploadedFiles,
      setUploadedFiles,
      filesData,
      isLoadingFiles,
      modelOptions,
      handleFilesUploaded,
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