'use client'

import "./globals.css";
import Sidebar from "./components/Sidebar";
import { ChatProvider } from "@/contexts/ChatContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100">
        <QueryClientProvider client={queryClient}>
          <ChatProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col relative bg-gray-50">
              {children}
            </div>
          </ChatProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
