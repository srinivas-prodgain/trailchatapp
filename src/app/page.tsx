"use client";
import { useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/chat-context";
import { Paperclip, FolderOpen } from "lucide-react";
import { FileUploadModal } from "@/components/file-upload-modal";
import { FilesContextModal } from "@/components/files-context-modal";
import { useCreateConversation } from "@/hooks/api/conversation";




export default function Home() {
  const router = useRouter();
  const createConversationMutation = useCreateConversation();

  const {
    setInitialMessage,
    selectedModel,
    setSelectedModel,
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!globalInput.trim()) return;

    try {
      const result = await createConversationMutation.mutateAsync({
        user_id: '123', // TODO: Replace with actual user ID from auth context
        title: globalInput.trim().substring(0, 50) || 'New Chat'
      });

      if (result.data?._id) {
        setInitialMessage(globalInput.trim());
        router.push(`/chat/${result.data._id}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-gray-50">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
        <h1 className="text-6xl font-thin text-gray-900 mb-3 tracking-tight">New Chat</h1>
        <p className="text-gray-500 text-lg font-light">Start a conversation</p>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8">
        <div className="flex items-center justify-center gap-3">
          {/* Files Context Button */}
          <button
            type="button"
            onClick={() => setIsFilesContextModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200 border border-gray-200"
            title={`${filesData?.length || 0} files in context`}
          >
            <FolderOpen className="w-4 h-4" />
            {isLoadingFiles ? (
              <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {filesData?.length || 0}
              </span>
            )}
          </button>

          {/* Model Selection */}
          <select
            id="home-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
          >
            {modelOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4" onSubmit={handleSubmit}>
        <div className="relative flex items-center bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow duration-200 px-4 py-3">
          <button
            type="button"
            onClick={() => setIsFileUploadModalOpen(true)}
            className="p-2 rounded-full transition-colors duration-150 bg-gray-200 text-gray-400 cursor-pointer hover:bg-gray-300 mr-2"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={globalInput}
            onChange={e => setGlobalInput(e.target.value)}
            placeholder="Message"
            className="flex-1 bg-transparent outline-none text-gray-900 text-base placeholder-gray-400"
          />

          <button
            type="submit"
            className={`p-2 rounded-full transition-colors duration-150 ${globalInput.trim()
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            disabled={!globalInput.trim()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

        </div>
      </form>

      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        onFilesUploaded={handleFilesUploaded}
      />

      <FilesContextModal
        isOpen={isFilesContextModalOpen}
        onClose={() => setIsFilesContextModalOpen(false)}
      />
    </div>
  );
}
