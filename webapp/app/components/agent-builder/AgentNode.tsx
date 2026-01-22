"use client";

import { useState } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";

export default function AgentNode() {
  const {
    agent,
    updateAgentInstructions,
    selectNode,
    selectedNodeId,
  } = useAgentBuilder();

  const [isEditingInstructions, setIsEditingInstructions] = useState(false);

  if (!agent) return null;

  const isSelected = selectedNodeId === "agent";
  const instructionsPreview = agent.instructions
    ? agent.instructions.length > 150
      ? agent.instructions.substring(0, 150) + "..."
      : agent.instructions
    : "No instructions configured";

  return (
    <div
      style={{
        ...styles.container,
        ...(isSelected ? styles.selected : {}),
      }}
      onClick={() => selectNode("agent", "agent")}
    >
      <div style={styles.header}>
        <span style={styles.label}>AGENT</span>
      </div>

      <div style={styles.content}>
        <h3 style={styles.name}>{agent.name}</h3>
        <p style={styles.description}>
          {agent.description || "Organizes and manages tasks for you"}
        </p>

        <div style={styles.instructionsSection}>
          <div style={styles.instructionsHeader}>
            <span style={styles.instructionsLabel}>INSTRUCTIONS</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingInstructions(true);
              }}
              style={styles.editButton}
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
              Edit
            </button>
          </div>

          {isEditingInstructions ? (
            <div style={styles.editContainer}>
              <textarea
                value={agent.instructions}
                onChange={(e) => updateAgentInstructions(e.target.value)}
                style={styles.textarea}
                placeholder="Enter agent instructions..."
                autoFocus
                onBlur={() => setIsEditingInstructions(false)}
              />
            </div>
          ) : (
            <div style={styles.instructionsPreview}>
              <p style={styles.instructionsText}>{instructionsPreview}</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection points */}
      <div style={{ ...styles.connectionPoint, ...styles.topPoint }} />
      <div style={{ ...styles.connectionPoint, ...styles.rightPoint }} />
      <div style={{ ...styles.connectionPoint, ...styles.bottomPoint }} />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "320px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.2s",
    position: "relative",
  },
  selected: {
    borderColor: "var(--accent)",
    boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
  },
  header: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  label: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "var(--muted)",
    letterSpacing: "0.05em",
  },
  content: {
    padding: "1rem",
  },
  name: {
    fontSize: "1rem",
    fontWeight: 600,
    margin: "0 0 0.25rem 0",
  },
  description: {
    fontSize: "0.8rem",
    color: "var(--muted)",
    margin: "0 0 1rem 0",
  },
  instructionsSection: {
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "8px",
    padding: "0.75rem",
  },
  instructionsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  instructionsLabel: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "var(--muted)",
    letterSpacing: "0.05em",
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.25rem 0.5rem",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  instructionsPreview: {
    maxHeight: "120px",
    overflow: "hidden",
  },
  instructionsText: {
    fontSize: "0.8rem",
    color: "var(--foreground)",
    margin: 0,
    lineHeight: 1.5,
    opacity: 0.8,
  },
  editContainer: {
    marginTop: "0.5rem",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "0.5rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--foreground)",
    fontSize: "0.8rem",
    resize: "vertical",
    outline: "none",
  },
  connectionPoint: {
    position: "absolute",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    border: "2px solid var(--card)",
  },
  topPoint: {
    top: "-4px",
    left: "50%",
    transform: "translateX(-50%)",
  },
  rightPoint: {
    right: "-4px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  bottomPoint: {
    bottom: "-4px",
    left: "50%",
    transform: "translateX(-50%)",
  },
};
