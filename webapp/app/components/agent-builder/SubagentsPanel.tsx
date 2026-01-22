"use client";

import { useState } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";

export default function SubagentsPanel() {
  const {
    agent,
    addSubagent,
    removeSubagent,
    selectNode,
    selectedNodeId,
    selectedNodeType,
  } = useAgentBuilder();

  const [showForm, setShowForm] = useState(false);
  const [newSubagentName, setNewSubagentName] = useState("");

  if (!agent) return null;

  const handleAddSubagent = () => {
    if (newSubagentName.trim()) {
      addSubagent({
        name: newSubagentName.trim(),
        description: "",
        systemPrompt: "",
      });
      setNewSubagentName("");
      setShowForm(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>SUB-AGENTS</span>
        <button
          onClick={() => setShowForm(true)}
          style={styles.addButton}
        >
          + Add
        </button>
      </div>

      <div style={styles.content}>
        {showForm && (
          <div style={styles.form}>
            <input
              type="text"
              value={newSubagentName}
              onChange={(e) => setNewSubagentName(e.target.value)}
              placeholder="Subagent name..."
              style={styles.input}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSubagent();
                if (e.key === "Escape") setShowForm(false);
              }}
            />
            <div style={styles.formActions}>
              <button onClick={handleAddSubagent} style={styles.confirmButton}>
                Add
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {agent.subagents.length === 0 && !showForm ? (
          <p style={styles.emptyText}>No subagents configured</p>
        ) : (
          <div style={styles.list}>
            {agent.subagents.map((subagent) => (
              <div
                key={subagent.id}
                style={{
                  ...styles.item,
                  ...(selectedNodeId === subagent.id &&
                  selectedNodeType === "subagent"
                    ? styles.selectedItem
                    : {}),
                }}
                onClick={() => selectNode(subagent.id, "subagent")}
              >
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{subagent.name}</span>
                  {subagent.description && (
                    <span style={styles.itemDescription}>
                      {subagent.description.length > 50
                        ? subagent.description.substring(0, 50) + "..."
                        : subagent.description}
                    </span>
                  )}
                </div>
                <div style={styles.itemActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectNode(subagent.id, "subagent");
                    }}
                    style={styles.actionButton}
                    title="Edit"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSubagent(subagent.id);
                    }}
                    style={styles.actionButton}
                    title="Remove"
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
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "240px",
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
  addButton: {
    padding: "0.25rem 0.5rem",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    fontSize: "0.7rem",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  content: {
    padding: "0.5rem",
    maxHeight: "180px",
    overflowY: "auto",
  },
  form: {
    padding: "0.5rem",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--foreground)",
    fontSize: "0.8rem",
    outline: "none",
    marginBottom: "0.5rem",
  },
  formActions: {
    display: "flex",
    gap: "0.5rem",
  },
  confirmButton: {
    flex: 1,
    padding: "0.375rem",
    background: "var(--accent)",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    color: "white",
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: "0.375rem",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    fontSize: "0.75rem",
    color: "var(--muted)",
    cursor: "pointer",
  },
  emptyText: {
    fontSize: "0.8rem",
    color: "var(--muted)",
    textAlign: "center",
    padding: "1rem",
    margin: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  selectedItem: {
    background: "rgba(99, 102, 241, 0.1)",
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  itemDescription: {
    display: "block",
    fontSize: "0.65rem",
    color: "var(--muted)",
    marginTop: "0.125rem",
  },
  itemActions: {
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
    background: "#3b82f6",
    border: "2px solid var(--card)",
  },
};
