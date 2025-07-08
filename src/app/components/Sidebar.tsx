import React from "react";

interface Conversation {
  id: string;
  name: string;
}

interface SidebarProps {
  conversations: Conversation[];
}

const Sidebar: React.FC<SidebarProps> = ({ conversations }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 h-screen">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Conversations</h2>
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className="px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700 transition-colors"
          >
            {conv.name}
          </li>
        ))}
      </ul>
      <div className="mt-6 text-xs text-gray-400">&copy; 2024 TrailChat</div>
    </aside>
  );
};

export default Sidebar; 