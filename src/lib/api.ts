const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  _id: string;
  uid: string;
  title: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: string;
  conversationId: string;
}

// Stream chat completion
export async function streamChat(uid: string, messages: Message[], userId?: string) {
  const response = await fetch(`${BACKEND_URL}/api/v1/stream/${uid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      messages,
      userId 
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

// Get conversation with messages
export async function getConversation(uid: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  // console.log("getting conversation", uid);
  const response = await fetch(`${BACKEND_URL}/api/v1/conversations/${uid}`);
  // console.log("response", response);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Get all conversations for user
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const response = await fetch(`${BACKEND_URL}/api/v1/conversations/user/${userId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Create new conversation
// export async function createConversation(uid: string, title: string, userId?: string): Promise<Conversation> {
//   const response = await fetch(`${BACKEND_URL}/api/v1/conversations`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ uid, title, userId }),
//   });

//   if (!response.ok) {
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }

//   return response.json();
// }

// Update conversation title
export async function updateConversationTitle(uid: string, title: string): Promise<Conversation> {
  const response = await fetch(`${BACKEND_URL}/api/v1/conversations/${uid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Delete conversation
export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/conversations/${id}`, {
    method: 'DELETE',
  });

  console.log("response", response);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
} 