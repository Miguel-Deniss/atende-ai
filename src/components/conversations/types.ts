export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  lastService: string | null;
  notes: string | null;
  status: string;
}


export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  unread: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;

  clientId?: string | null;
  client?: Client | null;
}


export interface Message {
  id: string;
  role: string;
  content: string;
  type: string;
  createdAt: string;
  conversationId: string;
}