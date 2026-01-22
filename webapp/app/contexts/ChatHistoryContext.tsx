"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

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
  isLoading: boolean;
  createNewChat: () => Promise<string>;
  selectChat: (chatId: string) => void;
  updateCurrentChat: (messages: ChatMessage[]) => void;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, title: string) => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

const CURRENT_CHAT_KEY = "deepagents-current-chat-id";

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
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ chatId: string; messages: ChatMessage[]; title: string } | null>(null);

  // Load chats from database on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const data = await response.json();
          setChats(data);
        }
      } catch (error) {
        console.error("Failed to load chats from database:", error);
      } finally {
        setIsLoading(false);
      }

      // Restore current chat ID from localStorage (just the ID, not the data)
      const savedChatId = localStorage.getItem(CURRENT_CHAT_KEY);
      if (savedChatId) {
        setCurrentChatId(savedChatId);
      }
    }

    loadChats();
  }, []);

  // Save current chat ID to localStorage when it changes
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem(CURRENT_CHAT_KEY, currentChatId);
    } else {
      localStorage.removeItem(CURRENT_CHAT_KEY);
    }
  }, [currentChatId]);

  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  // Debounced save to database
  const saveToDatabase = useCallback(async (chatId: string, messages: ChatMessage[], title: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, title }),
      });
    } catch (error) {
      console.error("Failed to save chat to database:", error);
    }
  }, []);

  const createNewChat = useCallback(async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setChats((prev) => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        return newChat.id;
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }

    // Fallback: create locally if API fails
    const fallbackId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat: Chat = {
      id: fallbackId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(fallbackId);
    return fallbackId;
  }, []);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const updateCurrentChat = useCallback(
    (messages: ChatMessage[]) => {
      if (!currentChatId) {
        // Create a new chat if none exists
        (async () => {
          try {
            const response = await fetch("/api/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: generateChatTitle(messages) }),
            });

            if (response.ok) {
              const newChat = await response.json();
              newChat.messages = messages;
              setChats((prev) => [newChat, ...prev]);
              setCurrentChatId(newChat.id);

              // Save messages to database
              saveToDatabase(newChat.id, messages, newChat.title);
            }
          } catch (error) {
            console.error("Failed to create chat:", error);
          }
        })();
        return;
      }

      const chat = chats.find((c) => c.id === currentChatId);
      const newTitle = chat?.title === "New Chat" ? generateChatTitle(messages) : (chat?.title || "New Chat");

      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? {
                ...c,
                messages,
                title: newTitle,
                updatedAt: Date.now(),
              }
            : c
        )
      );

      // Debounced save to database
      pendingSaveRef.current = { chatId: currentChatId, messages, title: newTitle };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          saveToDatabase(
            pendingSaveRef.current.chatId,
            pendingSaveRef.current.messages,
            pendingSaveRef.current.title
          );
          pendingSaveRef.current = null;
        }
      }, 1000); // Save after 1 second of inactivity
    },
    [currentChatId, chats, saveToDatabase]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await fetch(`/api/chats/${chatId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete chat from database:", error);
      }

      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    },
    [currentChatId]
  );

  const renameChat = useCallback(async (chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, title, updatedAt: Date.now() }
          : chat
      )
    );

    try {
      await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    } catch (error) {
      console.error("Failed to rename chat in database:", error);
    }
  }, []);

  return (
    <ChatHistoryContext.Provider
      value={{
        chats,
        currentChatId,
        currentChat,
        isLoading,
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
