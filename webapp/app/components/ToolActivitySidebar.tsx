"use client";

import { useEffect, useRef, useState } from "react";

export interface ToolActivity {
  id: string;
  tool: string;
  reasoning: string;
  status: "running" | "complete" | "error";
  timestamp: number;
  input?: Record<string, unknown>;
  output?: string;
  duration?: number;
}

interface ToolActivitySidebarProps {
  activities: ToolActivity[];
  isOpen: boolean;
  onClose: () => void;
}

const TOOL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  thinking: { icon: "🧠", label: "Thinking", color: "#a78bfa" },
  create_canvas: { icon: "📄", label: "Create Document", color: "#34d399" },
  search: { icon: "🔍", label: "Search", color: "#60a5fa" },
  code: { icon: "💻", label: "Write Code", color: "#f472b6" },
  read_file: { icon: "📖", label: "Read File", color: "#fbbf24" },
  write_file: { icon: "✏️", label: "Write File", color: "#f87171" },
  edit_file: { icon: "📝", label: "Edit File", color: "#fb923c" },
  ls: { icon: "📁", label: "List Directory", color: "#a3e635" },
  glob: { icon: "🎯", label: "Find Files", color: "#22d3d8" },
  grep: { icon: "🔎", label: "Search Content", color: "#818cf8" },
  task: { icon: "🤖", label: "Sub-Agent", color: "#e879f9" },
  default: { icon: "⚡", label: "Processing", color: "#6366f1" },
};

function getToolConfig(tool: string) {
  return TOOL_CONFIG[tool] || TOOL_CONFIG.default;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ToolActivitySidebar({
  activities,
  isOpen,
  onClose,
}: ToolActivitySidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom when new activities are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const runningCount = activities.filter((a) => a.status === "running").length;
  const completedCount = activities.filter((a) => a.status === "complete").length;

  return (
    <>
      <div
        style={{
          ...styles.sidebar,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.headerTitle}>
              <span style={styles.headerIcon}>⚡</span>
              <h2 style={styles.title}>Activity</h2>
            </div>
            <button onClick={onClose} style={styles.closeButton} aria-label="Close sidebar">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Stats bar */}
          <div style={styles.statsBar}>
            {runningCount > 0 && (
              <div style={styles.stat}>
                <span style={styles.statDot} className="pulse-dot" />
                <span style={styles.statText}>{runningCount} running</span>
              </div>
            )}
            <div style={styles.stat}>
              <span style={{ ...styles.statDot, background: "#34d399" }} />
              <span style={styles.statText}>{completedCount} completed</span>
            </div>
          </div>
        </div>

        {/* Activity list */}
        <div ref={scrollRef} style={styles.activityList}>
          {activities.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🔮</span>
              <p style={styles.emptyText}>Waiting for activity...</p>
              <p style={styles.emptySubtext}>
                Tool calls will appear here as the agent works
              </p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const config = getToolConfig(activity.tool);
              const isExpanded = expandedItems.has(activity.id);
              const isRunning = activity.status === "running";
              const isLast = index === activities.length - 1;

              return (
                <div
                  key={activity.id}
                  style={{
                    ...styles.activityItem,
                    ...(isRunning ? styles.activityItemRunning : {}),
                    ...(isLast && isRunning ? styles.activityItemLatest : {}),
                  }}
                  className={isRunning ? "activity-running" : ""}
                >
                  {/* Timeline connector */}
                  {index < activities.length - 1 && (
                    <div
                      style={{
                        ...styles.connector,
                        background: isRunning
                          ? `linear-gradient(180deg, ${config.color}, var(--border))`
                          : "var(--border)",
                      }}
                    />
                  )}

                  {/* Activity node */}
                  <div
                    style={{
                      ...styles.node,
                      borderColor: config.color,
                      ...(isRunning ? { boxShadow: `0 0 12px ${config.color}40` } : {}),
                    }}
                    className={isRunning ? "node-pulse" : ""}
                  >
                    {isRunning ? (
                      <div style={styles.spinnerWrapper}>
                        <div
                          style={{
                            ...styles.spinner,
                            borderTopColor: config.color,
                          }}
                          className="spinner"
                        />
                      </div>
                    ) : (
                      <span style={styles.nodeIcon}>{config.icon}</span>
                    )}
                  </div>

                  {/* Activity content */}
                  <div style={styles.activityContent}>
                    <button
                      onClick={() => toggleExpanded(activity.id)}
                      style={styles.activityHeader}
                    >
                      <div style={styles.activityTitleRow}>
                        <span
                          style={{
                            ...styles.toolBadge,
                            background: `${config.color}20`,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                        {isRunning && (
                          <span style={styles.runningIndicator} className="running-text">
                            running
                          </span>
                        )}
                        {activity.duration && !isRunning && (
                          <span style={styles.durationBadge}>
                            {formatDuration(activity.duration)}
                          </span>
                        )}
                      </div>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          ...styles.expandIcon,
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>

                    <p style={styles.reasoning}>{activity.reasoning}</p>
                    <span style={styles.timestamp}>{formatTimestamp(activity.timestamp)}</span>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={styles.expandedContent}>
                        {activity.input && Object.keys(activity.input).length > 0 && (
                          <div style={styles.detailSection}>
                            <span style={styles.detailLabel}>Input</span>
                            <pre style={styles.codeBlock}>
                              {JSON.stringify(activity.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {activity.output && (
                          <div style={styles.detailSection}>
                            <span style={styles.detailLabel}>Output</span>
                            <pre style={styles.codeBlock}>{activity.output}</pre>
                          </div>
                        )}
                        {!activity.input && !activity.output && (
                          <p style={styles.noDetails}>No additional details</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with progress indicator */}
        {runningCount > 0 && (
          <div style={styles.footer}>
            <div style={styles.progressBar}>
              <div style={styles.progressTrack}>
                <div style={styles.progressFill} className="progress-animate" />
              </div>
            </div>
            <span style={styles.footerText}>Agent is working...</span>
          </div>
        )}
      </div>

      {/* Backdrop for mobile */}
      {isOpen && <div style={styles.backdrop} onClick={onClose} />}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "380px",
    height: "100vh",
    background: "linear-gradient(180deg, #0f0f12 0%, #0a0a0d 100%)",
    borderLeft: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 100,
    boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 99,
    display: "none", // Only show on mobile
  },
  header: {
    padding: "1.25rem",
    borderBottom: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  headerIcon: {
    fontSize: "1.25rem",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--foreground)",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  statsBar: {
    display: "flex",
    gap: "1rem",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  statDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--accent)",
  },
  statText: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
  activityList: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    paddingRight: "0.75rem",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: "2rem",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
    opacity: 0.6,
  },
  emptyText: {
    fontSize: "0.9rem",
    color: "var(--foreground)",
    marginBottom: "0.25rem",
  },
  emptySubtext: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
  activityItem: {
    position: "relative",
    display: "flex",
    gap: "0.75rem",
    paddingBottom: "1rem",
    marginBottom: "0.5rem",
  },
  activityItemRunning: {
    opacity: 1,
  },
  activityItemLatest: {
    // Additional styling for latest running item
  },
  connector: {
    position: "absolute",
    left: "15px",
    top: "32px",
    bottom: "-4px",
    width: "2px",
    borderRadius: "1px",
  },
  node: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--card)",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    zIndex: 1,
    transition: "all 0.3s ease",
  },
  nodeIcon: {
    fontSize: "0.875rem",
  },
  spinnerWrapper: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    marginBottom: "0.375rem",
  },
  activityTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  toolBadge: {
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },
  runningIndicator: {
    fontSize: "0.65rem",
    color: "var(--accent)",
    fontWeight: 500,
  },
  durationBadge: {
    fontSize: "0.65rem",
    color: "var(--muted)",
    background: "rgba(255, 255, 255, 0.05)",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
  },
  expandIcon: {
    color: "var(--muted)",
    transition: "transform 0.2s ease",
    flexShrink: 0,
  },
  reasoning: {
    fontSize: "0.8rem",
    color: "var(--foreground)",
    margin: "0 0 0.25rem 0",
    lineHeight: 1.4,
    opacity: 0.9,
  },
  timestamp: {
    fontSize: "0.65rem",
    color: "var(--muted)",
    opacity: 0.7,
  },
  expandedContent: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
  },
  detailSection: {
    marginBottom: "0.75rem",
  },
  detailLabel: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
    display: "block",
  },
  codeBlock: {
    fontSize: "0.7rem",
    background: "rgba(0, 0, 0, 0.4)",
    padding: "0.5rem",
    borderRadius: "4px",
    overflow: "auto",
    maxHeight: "150px",
    margin: 0,
    color: "var(--foreground)",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  noDetails: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    fontStyle: "italic",
    margin: 0,
  },
  footer: {
    padding: "1rem 1.25rem",
    borderTop: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  progressBar: {
    marginBottom: "0.5rem",
  },
  progressTrack: {
    height: "3px",
    background: "var(--border)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "30%",
    background: "linear-gradient(90deg, var(--accent), #a78bfa)",
    borderRadius: "2px",
  },
  footerText: {
    fontSize: "0.7rem",
    color: "var(--muted)",
  },
};
