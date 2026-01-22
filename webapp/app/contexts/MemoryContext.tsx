"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

export interface MemoryFile {
  id: string;
  name: string;
  content: string;
  createdAt?: number;
  updatedAt?: number;
}

interface MemoryContextType {
  memoryFiles: Record<string, string>; // { filename: content } for backward compatibility
  memories: MemoryFile[];
  isLoading: boolean;
  updateMemory: (filename: string, content: string) => void;
  deleteMemory: (filename: string) => void;
  clearAllMemories: () => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [memories, setMemories] = useState<MemoryFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert memories array to Record for backward compatibility
  const memoryFiles: Record<string, string> = {};
  memories.forEach((m) => {
    memoryFiles[m.name] = m.content;
  });

  // Load memories from database on mount
  useEffect(() => {
    async function loadMemories() {
      try {
        const response = await fetch("/api/memories");
        if (response.ok) {
          const data = await response.json();
          setMemories(data);
        }
      } catch (error) {
        console.error("Failed to load memories from database:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMemories();
  }, []);

  // Debounced save to database
  const saveToDatabase = useCallback(async (newMemories: MemoryFile[]) => {
    try {
      await fetch("/api/memories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories: newMemories }),
      });
    } catch (error) {
      console.error("Failed to save memories to database:", error);
    }
  }, []);

  const updateMemory = useCallback((filename: string, content: string) => {
    setMemories((prev) => {
      const existing = prev.find((m) => m.name === filename);
      let newMemories: MemoryFile[];

      if (existing) {
        newMemories = prev.map((m) =>
          m.name === filename
            ? { ...m, content, updatedAt: Date.now() }
            : m
        );
      } else {
        const newMemory: MemoryFile = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: filename,
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newMemories = [...prev, newMemory];
      }

      // Debounced save to database
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveToDatabase(newMemories);
      }, 1000);

      return newMemories;
    });
  }, [saveToDatabase]);

  const deleteMemory = useCallback((filename: string) => {
    setMemories((prev) => {
      const newMemories = prev.filter((m) => m.name !== filename);

      // Save to database immediately on delete
      saveToDatabase(newMemories);

      return newMemories;
    });
  }, [saveToDatabase]);

  const clearAllMemories = useCallback(async () => {
    setMemories([]);

    try {
      await fetch("/api/memories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories: [] }),
      });
    } catch (error) {
      console.error("Failed to clear memories from database:", error);
    }
  }, []);

  return (
    <MemoryContext.Provider
      value={{
        memoryFiles,
        memories,
        isLoading,
        updateMemory,
        deleteMemory,
        clearAllMemories,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within a MemoryProvider");
  }
  return context;
}
