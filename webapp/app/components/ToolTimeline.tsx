"use client";

import { useState } from "react";

export interface ToolStep {
  id: string;
  tool: string;
  reasoning: string;
  status: "running" | "complete" | "error";
  timestamp: number;
}

interface ToolTimelineProps {
  steps: ToolStep[];
  isCollapsed?: boolean;
}

const TOOL_ICONS: Record<string, string> = {
  create_canvas: "📄",
  thinking: "💭",
  search: "🔍",
  code: "💻",
  default: "⚡",
};

const TOOL_LABELS: Record<string, string> = {
  create_canvas: "Creating document",
  thinking: "Thinking",
  search: "Searching",
  code: "Writing code",
  default: "Processing",
};

export default function ToolTimeline({ steps, isCollapsed: initialCollapsed = false }: ToolTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  if (steps.length === 0) return null;

  const getIcon = (tool: string) => TOOL_ICONS[tool] || TOOL_ICONS.default;
  const getLabel = (tool: string) => TOOL_LABELS[tool] || tool;

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={styles.toggleButton}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <span style={styles.toggleText}>
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </span>
        {!isCollapsed && (
          <span style={styles.collapseHint}>click to collapse</span>
        )}
      </button>

      {!isCollapsed && (
        <div style={styles.timeline}>
          {steps.map((step, index) => (
            <div key={step.id} style={styles.stepContainer}>
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div style={styles.connector} />
              )}

              {/* Step node */}
              <div style={styles.step}>
                <div
                  style={{
                    ...styles.node,
                    ...(step.status === "running" ? styles.nodeRunning : {}),
                    ...(step.status === "error" ? styles.nodeError : {}),
                  }}
                >
                  {step.status === "running" ? (
                    <div style={styles.spinner} />
                  ) : (
                    <span style={styles.icon}>{getIcon(step.tool)}</span>
                  )}
                </div>

                <div style={styles.stepContent}>
                  <div style={styles.stepHeader}>
                    <span style={styles.toolName}>{getLabel(step.tool)}</span>
                    {step.status === "running" && (
                      <span style={styles.runningBadge}>running</span>
                    )}
                  </div>
                  <p style={styles.reasoning}>{step.reasoning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: "0.75rem",
  },
  toggleButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.25rem 0",
    fontSize: "0.75rem",
    transition: "color 0.2s",
  },
  toggleText: {
    fontWeight: 500,
  },
  collapseHint: {
    opacity: 0.6,
    fontSize: "0.7rem",
  },
  timeline: {
    marginTop: "0.5rem",
    marginLeft: "0.25rem",
  },
  stepContainer: {
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: "11px",
    top: "24px",
    bottom: "-8px",
    width: "2px",
    background: "var(--border)",
  },
  step: {
    display: "flex",
    gap: "0.75rem",
    paddingBottom: "0.75rem",
  },
  node: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "var(--card)",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    zIndex: 1,
  },
  nodeRunning: {
    borderColor: "var(--accent)",
    animation: "pulse-border 2s infinite",
  },
  nodeError: {
    borderColor: "#ef4444",
    background: "rgba(239, 68, 68, 0.1)",
  },
  icon: {
    fontSize: "0.7rem",
  },
  spinner: {
    width: "10px",
    height: "10px",
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  stepContent: {
    flex: 1,
    minWidth: 0,
    paddingTop: "2px",
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  toolName: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--foreground)",
  },
  runningBadge: {
    fontSize: "0.65rem",
    padding: "0.1rem 0.4rem",
    background: "rgba(99, 102, 241, 0.1)",
    color: "var(--accent)",
    borderRadius: "4px",
    fontWeight: 500,
  },
  reasoning: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    margin: "0.25rem 0 0 0",
    lineHeight: 1.4,
  },
};
