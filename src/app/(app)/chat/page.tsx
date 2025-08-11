'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ChatPage = (): React.JSX.Element => {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home page where users can start a new chat
        router.push('/');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Redirecting...</p>
        </div>
    );
};

export default ChatPage;