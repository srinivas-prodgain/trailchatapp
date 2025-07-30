'use client'

import { ToolStatusIndicator } from './tool-status-indicator';

type TMessageContentProps = {
    content: string;
    toolStatus?: {
        tool: string;
        status: 'started' | 'completed';
        details?: any;
    } | null;
};

export function MessageContent({ content, toolStatus }: TMessageContentProps) {
    const parts = content.split(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/g);

    return (
        <div className="space-y-2">
            {/* Show tool status if available */}
            {toolStatus && (
                <ToolStatusIndicator
                    tool={toolStatus.tool}
                    status={toolStatus.status}
                    details={toolStatus.details}
                />
            )}

            {/* Existing content rendering */}
            {parts.map((part, index) => {
                // Check if this part is a data URL
                if (part.match(/^data:image\/[^;]+;base64,/)) {
                    return (
                        <div key={index} className="flex flex-col items-center space-y-2">
                            <img
                                src={part}
                                alt="Generated QR Code"
                                className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = part;
                                        link.download = 'qr-code.png';
                                        link.click();
                                    }}
                                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(part);
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Copy URL
                                </button>
                            </div>
                        </div>
                    );
                }

                // Regular text content
                if (part.trim()) {
                    return (
                        <div key={index} className="whitespace-pre-line">
                            {part}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}