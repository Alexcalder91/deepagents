"use client";

import { useState, useRef, useEffect } from "react";
import { usePromptConfig, PromptConfig } from "../contexts/PromptConfigContext";
import { useChatHistory } from "../contexts/ChatHistoryContext";
import { useMemory } from "../contexts/MemoryContext";

type SettingsPage = "main" | "prompts" | "memory" | "history";

interface PromptCategory {
  title: string;
  icon: string;
  prompts: {
    key: keyof PromptConfig;
    label: string;
    description: string;
  }[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    title: "Main Agent",
    icon: "🤖",
    prompts: [
      {
        key: "mainAgentSystemPrompt",
        label: "System Prompt",
        description: "The main system prompt that defines the agent's personality and capabilities",
      },
      {
        key: "canvasToolDescription",
        label: "Canvas Tool",
        description: "Description for the canvas/document creation tool",
      },
    ],
  },
  {
    title: "Subagents",
    icon: "🔄",
    prompts: [
      {
        key: "taskToolDescription",
        label: "Task Tool Description",
        description: "How the task/subagent spawning tool is described to the agent",
      },
      {
        key: "taskSystemPrompt",
        label: "Task System Prompt",
        description: "System prompt injected when explaining task tool usage",
      },
      {
        key: "defaultSubagentPrompt",
        label: "Default Subagent Prompt",
        description: "Base prompt given to spawned subagents",
      },
      {
        key: "generalPurposeAgentDescription",
        label: "General Purpose Agent",
        description: "Description of the general-purpose subagent type",
      },
    ],
  },
  {
    title: "Filesystem Tools",
    icon: "📁",
    prompts: [
      {
        key: "filesystemSystemPrompt",
        label: "Filesystem System Prompt",
        description: "Overview prompt for filesystem capabilities",
      },
      {
        key: "listFilesDescription",
        label: "List Files (ls)",
        description: "Description for the directory listing tool",
      },
      {
        key: "readFileDescription",
        label: "Read File",
        description: "Description for the file reading tool",
      },
      {
        key: "writeFileDescription",
        label: "Write File",
        description: "Description for the file writing tool",
      },
      {
        key: "editFileDescription",
        label: "Edit File",
        description: "Description for the file editing tool",
      },
      {
        key: "globDescription",
        label: "Glob (Find Files)",
        description: "Description for the glob pattern matching tool",
      },
      {
        key: "grepDescription",
        label: "Grep (Search)",
        description: "Description for the text search tool",
      },
    ],
  },
  {
    title: "Execution",
    icon: "⚡",
    prompts: [
      {
        key: "executionSystemPrompt",
        label: "Execution System Prompt",
        description: "Overview prompt for shell execution capabilities",
      },
      {
        key: "executeDescription",
        label: "Execute Command",
        description: "Description for the shell command execution tool",
      },
    ],
  },
  {
    title: "Features",
    icon: "✨",
    prompts: [
      {
        key: "skillsSystemPrompt",
        label: "Skills System Prompt",
        description: "Prompt explaining the skills/capabilities system",
      },
      {
        key: "memorySystemPrompt",
        label: "Memory System Prompt",
        description: "Guidelines for the agent's memory and learning system",
      },
    ],
  },
];

export default function SettingsSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState<SettingsPage>("main");
  const [selectedPrompt, setSelectedPrompt] = useState<keyof PromptConfig | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Main Agent"]));
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { config, updatePrompt, resetPrompt, hasChanges } = usePromptConfig();
  const { chats, currentChatId, createNewChat, selectChat, deleteChat, renameChat } = useChatHistory();
  const { memoryFiles, clearAllMemories } = useMemory();

  const clearMemory = async () => {
    await clearAllMemories();
  };

  // Handle hover to expand
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
    }, 150);
  };

  // Handle mouse leave to contract
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Don't contract if editing a prompt
    if (selectedPrompt) return;

    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setCurrentPage("main");
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const toggleCategory = (title: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handlePromptSelect = (key: keyof PromptConfig) => {
    setSelectedPrompt(key);
  };

  const handlePromptClose = () => {
    setSelectedPrompt(null);
  };

  const getPromptInfo = (key: keyof PromptConfig) => {
    for (const category of PROMPT_CATEGORIES) {
      const prompt = category.prompts.find((p) => p.key === key);
      if (prompt) return { ...prompt, category: category.title };
    }
    return null;
  };

  const selectedPromptInfo = selectedPrompt ? getPromptInfo(selectedPrompt) : null;

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...styles.sidebar,
        width: isExpanded ? (selectedPrompt ? "600px" : "280px") : "48px",
      }}
    >
      {/* Collapsed state - icon bar */}
      <div style={styles.iconBar}>
        <div style={styles.iconBarInner}>
          {/* New Chat Button */}
          <button
            style={styles.iconButton}
            className="settings-icon-button"
            onClick={() => {
              createNewChat();
            }}
            title="New Chat"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>

          {/* Chat History Button */}
          <button
            style={styles.iconButton}
            className="settings-icon-button"
            onClick={() => {
              setIsExpanded(true);
              setCurrentPage("history");
            }}
            title="Chat History"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {chats.length > 0 && (
              <span style={styles.chatCountBadge}>{chats.length}</span>
            )}
          </button>

          {/* Settings Button */}
          <button
            style={styles.iconButton}
            className="settings-icon-button"
            onClick={() => {
              setIsExpanded(true);
              setCurrentPage("main");
            }}
            title="Settings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded state - full menu */}
      <div
        style={{
          ...styles.expandedContent,
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? "auto" : "none",
        }}
      >
        {currentPage === "main" && !selectedPrompt && (
          <>
            <div style={styles.header}>
              <h2 style={styles.title}>Settings</h2>
            </div>

            <div style={styles.menuList}>
              <button
                style={styles.menuItem}
                className="settings-menu-item"
                onClick={() => setCurrentPage("prompts")}
              >
                <span style={styles.menuIcon}>📝</span>
                <div style={styles.menuText}>
                  <span style={styles.menuLabel}>Prompt Configuration</span>
                  <span style={styles.menuDescription}>Edit agent and tool prompts</span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={styles.menuArrow}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <button
                style={styles.menuItem}
                className="settings-menu-item"
                onClick={() => setCurrentPage("memory")}
              >
                <span style={styles.menuIcon}>🧠</span>
                <div style={styles.menuText}>
                  <span style={styles.menuLabel}>Agent Memory</span>
                  <span style={styles.menuDescription}>
                    View and manage stored memories
                    {Object.keys(memoryFiles).length > 0 && (
                      <span style={styles.memoryBadge}>{Object.keys(memoryFiles).length} file{Object.keys(memoryFiles).length !== 1 ? "s" : ""}</span>
                    )}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={styles.menuArrow}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </>
        )}

        {currentPage === "prompts" && !selectedPrompt && (
          <>
            <div style={styles.header}>
              <button
                style={styles.backButton}
                className="settings-back-button"
                onClick={() => setCurrentPage("main")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <h2 style={styles.title}>Prompts</h2>
            </div>

            <div style={styles.promptList}>
              {PROMPT_CATEGORIES.map((category) => (
                <div key={category.title} style={styles.category}>
                  <button
                    style={styles.categoryHeader}
                    className="settings-category-header"
                    onClick={() => toggleCategory(category.title)}
                  >
                    <span style={styles.categoryIcon}>{category.icon}</span>
                    <span style={styles.categoryTitle}>{category.title}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        ...styles.categoryArrow,
                        transform: expandedCategories.has(category.title)
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {expandedCategories.has(category.title) && (
                    <div style={styles.categoryPrompts}>
                      {category.prompts.map((prompt) => (
                        <button
                          key={prompt.key}
                          style={styles.promptItem}
                          className="settings-prompt-item"
                          onClick={() => handlePromptSelect(prompt.key)}
                        >
                          <span style={styles.promptLabel}>{prompt.label}</span>
                          {hasChanges(prompt.key) && (
                            <span style={styles.modifiedBadge}>modified</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {currentPage === "memory" && !selectedPrompt && (
          <>
            <div style={styles.header}>
              <button
                style={styles.backButton}
                className="settings-back-button"
                onClick={() => setCurrentPage("main")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <h2 style={styles.title}>Agent Memory</h2>
              {Object.keys(memoryFiles).length > 0 && (
                <button
                  style={styles.clearMemoryButton}
                  className="settings-reset-button"
                  onClick={clearMemory}
                  title="Clear all memory"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Clear
                </button>
              )}
            </div>

            <div style={styles.memoryContainer}>
              {Object.keys(memoryFiles).length === 0 ? (
                <div style={styles.memoryEmpty}>
                  <span style={styles.memoryEmptyIcon}>🧠</span>
                  <p style={styles.memoryEmptyText}>No memories stored yet</p>
                  <p style={styles.memoryEmptyHint}>
                    Ask the agent to remember something, or it will automatically save important information.
                  </p>
                </div>
              ) : (
                Object.entries(memoryFiles).map(([filePath, content]) => (
                  <div key={filePath} style={styles.memoryFile}>
                    <div style={styles.memoryFileHeader}>
                      <span style={styles.memoryFileName}>{filePath}</span>
                      <span style={styles.memoryFileSize}>
                        {content.length} chars
                      </span>
                    </div>
                    <div style={styles.memoryFileContent}>
                      <pre style={styles.memoryPre}>{content}</pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {currentPage === "history" && !selectedPrompt && (
          <>
            <div style={styles.header}>
              <button
                style={styles.backButton}
                className="settings-back-button"
                onClick={() => setCurrentPage("main")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <h2 style={styles.title}>Chat History</h2>
              <button
                style={styles.newChatButton}
                className="settings-new-chat-button"
                onClick={() => {
                  createNewChat();
                  setIsExpanded(false);
                }}
                title="New Chat"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                New
              </button>
            </div>

            <div style={styles.chatHistoryContainer}>
              {chats.length === 0 ? (
                <div style={styles.memoryEmpty}>
                  <span style={styles.memoryEmptyIcon}>💬</span>
                  <p style={styles.memoryEmptyText}>No chat history yet</p>
                  <p style={styles.memoryEmptyHint}>
                    Start a new conversation to see it here.
                  </p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    style={{
                      ...styles.chatHistoryItem,
                      ...(chat.id === currentChatId ? styles.chatHistoryItemActive : {}),
                    }}
                    className="chat-history-item"
                  >
                    {editingChatId === chat.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim()) {
                            renameChat(chat.id, editingTitle.trim());
                          }
                          setEditingChatId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editingTitle.trim()) {
                              renameChat(chat.id, editingTitle.trim());
                            }
                            setEditingChatId(null);
                          } else if (e.key === "Escape") {
                            setEditingChatId(null);
                          }
                        }}
                        style={styles.chatTitleInput}
                        autoFocus
                      />
                    ) : (
                      <button
                        style={styles.chatHistoryButton}
                        onClick={() => {
                          selectChat(chat.id);
                          setIsExpanded(false);
                        }}
                      >
                        <span style={styles.chatHistoryTitle}>{chat.title}</span>
                        <span style={styles.chatHistoryMeta}>
                          {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""}
                        </span>
                      </button>
                    )}
                    <div style={styles.chatHistoryActions}>
                      <button
                        style={styles.chatActionButton}
                        onClick={() => {
                          setEditingChatId(chat.id);
                          setEditingTitle(chat.title);
                        }}
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        style={styles.chatActionButton}
                        onClick={() => deleteChat(chat.id)}
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {selectedPrompt && selectedPromptInfo && (
          <div style={styles.editorContainer}>
            <div style={styles.editorHeader}>
              <button style={styles.backButton} className="settings-back-button" onClick={handlePromptClose}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <div style={styles.editorTitleGroup}>
                <h3 style={styles.editorTitle}>{selectedPromptInfo.label}</h3>
                <span style={styles.editorCategory}>{selectedPromptInfo.category}</span>
              </div>
              {hasChanges(selectedPrompt) && (
                <button
                  style={styles.resetButton}
                  className="settings-reset-button"
                  onClick={() => resetPrompt(selectedPrompt)}
                  title="Reset to default"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Reset
                </button>
              )}
            </div>

            <p style={styles.editorDescription}>{selectedPromptInfo.description}</p>

            <div style={styles.editorBody}>
              <textarea
                style={styles.textarea}
                className="settings-textarea"
                value={config[selectedPrompt]}
                onChange={(e) => updatePrompt(selectedPrompt, e.target.value)}
                placeholder="Enter prompt..."
                spellCheck={false}
              />
            </div>

            <div style={styles.editorFooter}>
              <span style={styles.charCount}>
                {config[selectedPrompt].length} characters
              </span>
              {hasChanges(selectedPrompt) && (
                <span style={styles.unsavedIndicator}>
                  <span style={styles.unsavedDot} />
                  Modified
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    background: "linear-gradient(180deg, #0f0f12 0%, #0a0a0d 100%)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 100,
    overflow: "hidden",
  },
  iconBar: {
    width: "48px",
    flexShrink: 0,
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "1rem",
  },
  iconBarInner: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  iconButton: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    position: "relative",
  },
  expandedContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "opacity 0.2s ease",
  },
  header: {
    padding: "1rem",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--foreground)",
    margin: 0,
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  menuList: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem",
  },
  menuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
    color: "var(--foreground)",
  },
  menuIcon: {
    fontSize: "1.25rem",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "8px",
  },
  menuText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  menuLabel: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  menuDescription: {
    fontSize: "0.7rem",
    color: "var(--muted)",
  },
  menuArrow: {
    color: "var(--muted)",
  },
  promptList: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem",
  },
  category: {
    marginBottom: "0.25rem",
  },
  categoryHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "var(--foreground)",
    transition: "all 0.2s",
  },
  categoryIcon: {
    fontSize: "0.875rem",
  },
  categoryTitle: {
    flex: 1,
    fontSize: "0.8rem",
    fontWeight: 600,
    textAlign: "left",
  },
  categoryArrow: {
    color: "var(--muted)",
    transition: "transform 0.2s ease",
  },
  categoryPrompts: {
    paddingLeft: "1.5rem",
    paddingBottom: "0.25rem",
  },
  promptItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.4rem 0.75rem",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    color: "var(--muted)",
    fontSize: "0.75rem",
    textAlign: "left",
    transition: "all 0.2s",
  },
  promptLabel: {
    flex: 1,
  },
  modifiedBadge: {
    fontSize: "0.6rem",
    padding: "0.1rem 0.35rem",
    background: "rgba(251, 191, 36, 0.15)",
    color: "#fbbf24",
    borderRadius: "4px",
    fontWeight: 500,
  },
  editorContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  editorHeader: {
    padding: "1rem",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  editorTitleGroup: {
    flex: 1,
  },
  editorTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--foreground)",
    margin: 0,
  },
  editorCategory: {
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  resetButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.6rem",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--muted)",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  editorDescription: {
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    color: "var(--muted)",
    margin: 0,
    borderBottom: "1px solid var(--border)",
    background: "rgba(0, 0, 0, 0.2)",
  },
  editorBody: {
    flex: 1,
    padding: "0.75rem",
    overflow: "hidden",
  },
  textarea: {
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
    fontSize: "0.8rem",
    fontFamily: "monospace",
    padding: "0.75rem",
    resize: "none",
    outline: "none",
    lineHeight: 1.5,
  },
  editorFooter: {
    padding: "0.5rem 1rem",
    borderTop: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCount: {
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  unsavedIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.65rem",
    color: "#fbbf24",
  },
  unsavedDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#fbbf24",
  },
  memoryBadge: {
    marginLeft: "0.5rem",
    padding: "0.1rem 0.4rem",
    background: "rgba(99, 102, 241, 0.15)",
    color: "var(--accent)",
    borderRadius: "4px",
    fontSize: "0.6rem",
    fontWeight: 500,
  },
  clearMemoryButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.6rem",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--muted)",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.2s",
    marginLeft: "auto",
  },
  memoryContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "0.75rem",
  },
  memoryEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    textAlign: "center",
  },
  memoryEmptyIcon: {
    fontSize: "2rem",
    marginBottom: "0.75rem",
    opacity: 0.5,
  },
  memoryEmptyText: {
    color: "var(--muted)",
    fontSize: "0.875rem",
    margin: 0,
    marginBottom: "0.5rem",
  },
  memoryEmptyHint: {
    color: "var(--muted)",
    fontSize: "0.75rem",
    margin: 0,
    opacity: 0.7,
    maxWidth: "200px",
  },
  memoryFile: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    marginBottom: "0.75rem",
    overflow: "hidden",
  },
  memoryFileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 0.75rem",
    background: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid var(--border)",
  },
  memoryFileName: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--accent)",
    fontFamily: "monospace",
  },
  memoryFileSize: {
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  memoryFileContent: {
    maxHeight: "300px",
    overflowY: "auto",
    padding: "0.75rem",
  },
  memoryPre: {
    margin: 0,
    fontSize: "0.7rem",
    fontFamily: "monospace",
    color: "var(--foreground)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.5,
  },
  chatCountBadge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    fontSize: "0.55rem",
    fontWeight: 600,
    background: "var(--accent)",
    color: "white",
    borderRadius: "8px",
    padding: "0.1rem 0.3rem",
    minWidth: "14px",
    textAlign: "center",
  },
  newChatButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.35rem 0.6rem",
    background: "var(--accent)",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.2s",
    marginLeft: "auto",
  },
  chatHistoryContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem",
  },
  chatHistoryItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    borderRadius: "8px",
    marginBottom: "0.25rem",
    transition: "all 0.2s",
    background: "transparent",
  },
  chatHistoryItemActive: {
    background: "rgba(99, 102, 241, 0.15)",
  },
  chatHistoryButton: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.125rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    minWidth: 0,
  },
  chatHistoryTitle: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--foreground)",
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
  },
  chatHistoryMeta: {
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  chatHistoryActions: {
    display: "flex",
    gap: "0.25rem",
    opacity: 0.5,
    transition: "opacity 0.2s",
  },
  chatActionButton: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  chatTitleInput: {
    flex: 1,
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--accent)",
    borderRadius: "4px",
    color: "var(--foreground)",
    fontSize: "0.8rem",
    padding: "0.25rem 0.5rem",
    outline: "none",
  },
};
