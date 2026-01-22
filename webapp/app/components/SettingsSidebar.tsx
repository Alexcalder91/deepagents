"use client";

import { useState, useRef, useEffect } from "react";
import { usePromptConfig, PromptConfig } from "../contexts/PromptConfigContext";

type SettingsPage = "main" | "prompts";

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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { config, updatePrompt, resetPrompt, hasChanges } = usePromptConfig();

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
};
