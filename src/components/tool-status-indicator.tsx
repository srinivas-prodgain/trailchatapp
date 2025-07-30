
'use client'
import {
    Search,
    Zap
} from 'lucide-react';

import { TToolStatus } from '@/types/shared';

export function ToolStatusIndicator({ tool, status, details }: TToolStatus) {
    const getToolIcon = (toolName: string) => {
        const baseClasses = "w-4 h-4";

        switch (toolName) {
            case 'web_search':
                return (
                    <Search className={`${baseClasses} ${status === 'started'
                        ? 'search-spinning text-blue-600'
                        : details?.error
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`} />
                );
            default:
                return (
                    <Zap className={`${baseClasses} ${status === 'started'
                        ? 'animate-spin text-blue-600'
                        : details?.error
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`} />
                );
        }
    };

    const getToolDisplayName = (toolName: string) => {
        switch (toolName) {
            case 'web_search':
                return 'Web Search';
            default:
                return toolName;
        }
    };

    const getToolDescription = (toolName: string) => {
        switch (toolName) {
            case 'web_search':
                return 'Searching the web for current information...';
            default:
                return 'Processing...';
        }
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform animate-tool-slide-in ${status === 'started'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
            : details?.error
                ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200'
            } ${status === 'started' ? 'animate-tool-pulse' : ''}`}>

            {/* Animated Icon */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${status === 'started'
                ? 'bg-blue-100 animate-pulse'
                : details?.error
                    ? 'bg-red-100'
                    : 'bg-green-100'
                }`}>
                {getToolIcon(tool)}
            </div>

            {/* Tool Info */}
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                        {getToolDisplayName(tool)}
                    </span>

                    {status === 'started' && (
                        <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    )}
                </div>

                <div className="text-xs opacity-75 mt-0.5">
                    {status === 'started'
                        ? getToolDescription(tool)
                        : details?.error
                            ? 'Failed to complete'
                            : 'Completed successfully'
                    }
                </div>
            </div>

            {/* Status Badge */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'started'
                ? 'bg-blue-100 text-blue-700 animate-pulse'
                : details?.error
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                {status === 'started' ? 'Running' : details?.error ? 'Failed' : 'Done'}
            </div>

            {/* Result Count Badge */}
            {details?.resultCount && !details?.error && (
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium animate-in slide-in-from-right-2">
                    {details.resultCount} results
                </div>
            )}
        </div>
    );
}