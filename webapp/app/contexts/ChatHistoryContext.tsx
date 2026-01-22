"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolSteps?: {
    id: string;
    tool: string;
    reasoning: string;
    status: "running" | "complete" | "error";
    timestamp: number;
  }[];
  canvas?: {
    title: string;
    content: string;
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatHistoryContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  updateCurrentChat: (messages: ChatMessage[]) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

const STORAGE_KEY = "deepagents-chat-history";

function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    if (content.length > 40) {
      return content.substring(0, 40) + "...";
    }
    return content || "New Chat";
  }
  return "New Chat";
}

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChats(parsed.chats || []);
        setCurrentChatId(parsed.currentChatId || null);
      } catch {
        // Invalid JSON, start fresh
      }
    }
  }, []);

  // Save chats to localStorage when they change
  useEffect(() => {
    if (chats.length > 0 || currentChatId) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ chats, currentChatId })
      );
    }
  }, [chats, currentChatId]);

  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: generateChatId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const updateCurrentChat = useCallback(
    (messages: ChatMessage[]) => {
      if (!currentChatId) {
        // Create a new chat if none exists
        const newId = generateChatId();
        const newChat: Chat = {
          id: newId,
          title: generateChatTitle(messages),
          messages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setChats((prev) => [newChat, ...prev]);
        setCurrentChatId(newId);
        return;
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages,
                title: chat.title === "New Chat" ? generateChatTitle(messages) : chat.title,
                updatedAt: Date.now(),
              }
            : chat
        )
      );
    },
    [currentChatId]
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    },
    [currentChatId]
  );

  const renameChat = useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, title, updatedAt: Date.now() }
          : chat
      )
    );
  }, []);

  return (
    <ChatHistoryContext.Provider
      value={{
        chats,
        currentChatId,
        currentChat,
        createNewChat,
        selectChat,
        updateCurrentChat,
        deleteChat,
        renameChat,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory() {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }
  return context;
}
