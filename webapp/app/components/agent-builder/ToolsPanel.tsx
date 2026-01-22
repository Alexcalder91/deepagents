"use client";

import { useState } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";
import ToolPicker from "./ToolPicker";

export default function ToolsPanel() {
  const {
    agent,
    availableTools,
    addTool,
    removeTool,
    updateTool,
    selectNode,
    selectedNodeId,
    selectedNodeType,
  } = useAgentBuilder();

  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "mcp">("add");

  if (!agent) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>TOOLBOX</span>
        <div style={styles.tabs}>
          <button
            onClick={() => {
              setActiveTab("add");
              setShowPicker(true);
            }}
            style={{
              ...styles.tab,
              ...(activeTab === "add" ? styles.activeTab : {}),
            }}
          >
            + Add
          </button>
          <button
            onClick={() => setActiveTab("mcp")}
            style={{
              ...styles.tab,
              ...(activeTab === "mcp" ? styles.activeTab : {}),
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            MCP
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {agent.tools.length === 0 ? (
          <p style={styles.emptyText}>No tools configured</p>
        ) : (
          <div style={styles.toolList}>
            {agent.tools.map((tool) => (
              <div
                key={tool.id}
                style={{
                  ...styles.toolItem,
                  ...(selectedNodeId === tool.id && selectedNodeType === "tool"
                    ? styles.selectedItem
                    : {}),
                }}
                onClick={() => selectNode(tool.id, "tool")}
              >
                <div style={styles.toolIcon}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div style={styles.toolInfo}>
                  <span style={styles.toolName}>{tool.toolName}</span>
                  <span style={styles.toolType}>{tool.toolType}</span>
                </div>
                {tool.requiresReview && (
                  <span style={styles.reviewBadge}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Review Required
                  </span>
                )}
                <div style={styles.toolActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTool(tool.id, {
                        requiresReview: !tool.requiresReview,
                      });
                    }}
                    style={styles.actionButton}
                    title={
                      tool.requiresReview
                        ? "Remove review requirement"
                        : "Require review"
                    }
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTool(tool.id);
                    }}
                    style={styles.actionButton}
                    title="Remove tool"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection point */}
      <div style={styles.connectionPoint} />

      {/* Tool Picker Modal */}
      {showPicker && (
        <ToolPicker
          tools={availableTools}
          onSelect={(tool) => {
            addTool({
              toolType: tool.type,
              toolName: tool.name,
              toolConfig: { description: tool.description },
            });
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "280px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "var(--muted)",
    letterSpacing: "0.05em",
  },
  tabs: {
    display: "flex",
    gap: "0.25rem",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.375rem 0.625rem",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "6px",
    fontSize: "0.75rem",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "var(--accent)",
    color: "white",
  },
  content: {
    padding: "0.5rem",
    maxHeight: "200px",
    overflowY: "auto",
  },
  emptyText: {
    fontSize: "0.8rem",
    color: "var(--muted)",
    textAlign: "center",
    padding: "1rem",
    margin: 0,
  },
  toolList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  toolItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "transparent",
  },
  selectedItem: {
    background: "rgba(99, 102, 241, 0.1)",
    borderColor: "var(--accent)",
  },
  toolIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "var(--accent)",
    color: "white",
  },
  toolInfo: {
    flex: 1,
    minWidth: 0,
  },
  toolName: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  toolType: {
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  reviewBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.6rem",
    color: "#f59e0b",
    padding: "0.125rem 0.375rem",
    background: "rgba(245, 158, 11, 0.1)",
    borderRadius: "4px",
  },
  toolActions: {
    display: "flex",
    gap: "0.25rem",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "none",
    background: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  connectionPoint: {
    position: "absolute",
    left: "-4px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    border: "2px solid var(--card)",
  },
};
