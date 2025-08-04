'use client'

import { TMessage } from "@/types/common-types";
import { TToolStatus } from "@/types/shared";
import { MessageContent } from "./message-component";

export type TMessageItemProps = {
    message: TMessage;
    index: number;
    toolStatus: TToolStatus | null;
};

export function MessageItem({
    message,
    index,
    toolStatus
}: TMessageItemProps) {
    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg shadow ${message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {message.role === 'user' ? 'U' : 'A'}
                </div>
                <div
                    className={`px-4 py-2 rounded-2xl shadow-md text-base max-w-xs sm:max-w-md break-words ${message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'}
                    `}
                >
                    <MessageContent
                        content={message.content}
                        toolStatus={toolStatus}
                    />
                </div>
            </div>
        </div>
    );
}