"use client";

import { useState, useEffect } from "react";

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  activeForm?: string; // Present tense form for display when in progress
}

export interface TodoList {
  id: string;
  title?: string;
  items: TodoItem[];
  createdAt: number;
}

interface TodoListProps {
  todoList: TodoList;
  isCompact?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  pending: { icon: "○", color: "#6b7280", bgColor: "#6b728015" },
  in_progress: { icon: "◐", color: "#a78bfa", bgColor: "#a78bfa20" },
  completed: { icon: "✓", color: "#34d399", bgColor: "#34d39920" },
  failed: { icon: "✕", color: "#f87171", bgColor: "#f8717120" },
};

export default function TodoListComponent({ todoList, isCompact = false }: TodoListProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const completedCount = todoList.items.filter((i) => i.status === "completed").length;
  const totalCount = todoList.items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const hasInProgress = todoList.items.some((i) => i.status === "in_progress");

  // Auto-collapse when all items are completed
  useEffect(() => {
    if (completedCount === totalCount && totalCount > 0 && !isCompact) {
      // Small delay to let user see the completion
      const timeout = setTimeout(() => setIsCollapsed(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, [completedCount, totalCount, isCompact]);

  if (isCompact) {
    // Compact inline view for chat
    return (
      <div style={styles.compactContainer}>
        <div style={styles.compactHeader}>
          <span style={styles.compactIcon}>📋</span>
          <span style={styles.compactTitle}>{todoList.title || "Tasks"}</span>
          <span style={styles.compactProgress}>
            {completedCount}/{totalCount}
          </span>
          {hasInProgress && <span style={styles.compactSpinner} className="spinner" />}
        </div>
        <div style={styles.compactProgressBar}>
          <div
            style={{
              ...styles.compactProgressFill,
              width: `${progressPercent}%`,
            }}
          />
        </div>
        <div style={styles.compactItems}>
          {todoList.items.map((item) => {
            const config = STATUS_CONFIG[item.status];
            const isActive = item.status === "in_progress";
            return (
              <div
                key={item.id}
                style={{
                  ...styles.compactItem,
                  background: config.bgColor,
                  borderColor: isActive ? config.color : "transparent",
                }}
              >
                <span
                  style={{
                    ...styles.compactItemIcon,
                    color: config.color,
                  }}
                  className={isActive ? "spinner-icon" : ""}
                >
                  {config.icon}
                </span>
                <span
                  style={{
                    ...styles.compactItemText,
                    color: item.status === "completed" ? "var(--muted)" : "var(--foreground)",
                    textDecoration: item.status === "completed" ? "line-through" : "none",
                  }}
                >
                  {isActive && item.activeForm ? item.activeForm : item.content}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full inline view for chat
  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>📋</span>
          <span style={styles.headerTitle}>{todoList.title || "Task List"}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.progressBadge}>
            {completedCount}/{totalCount}
          </span>
          {hasInProgress && (
            <span style={styles.inProgressBadge}>
              <span style={styles.pulsingDot} />
              Working
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              ...styles.chevron,
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>

      {/* Progress bar - always visible */}
      <div style={styles.progressContainer}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      {/* Items list */}
      {!isCollapsed && (
        <div style={styles.itemsList}>
          {todoList.items.map((item, index) => {
            const config = STATUS_CONFIG[item.status];
            const isActive = item.status === "in_progress";
            const isCompleted = item.status === "completed";

            return (
              <div
                key={item.id}
                style={{
                  ...styles.item,
                  ...(isActive ? styles.itemActive : {}),
                  ...(isCompleted ? styles.itemCompleted : {}),
                }}
              >
                {/* Status indicator */}
                <div
                  style={{
                    ...styles.statusIndicator,
                    borderColor: config.color,
                    background: isCompleted ? config.bgColor : "transparent",
                  }}
                  className={isActive ? "node-pulse" : ""}
                >
                  {isActive ? (
                    <div style={styles.spinnerSmall} className="spinner" />
                  ) : (
                    <span style={{ color: config.color, fontSize: "0.75rem", fontWeight: 600 }}>
                      {isCompleted ? "✓" : index + 1}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={styles.itemContent}>
                  <span
                    style={{
                      ...styles.itemText,
                      ...(isCompleted ? styles.itemTextCompleted : {}),
                    }}
                    className={isActive ? "running-text" : ""}
                  >
                    {isActive && item.activeForm ? item.activeForm : item.content}
                  </span>
                </div>

                {/* Status badge */}
                {isActive && (
                  <span style={styles.activeBadge}>In Progress</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "0.75rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    background: "transparent",
    border: "none",
    width: "100%",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  headerIcon: {
    fontSize: "1rem",
  },
  headerTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--foreground)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  progressBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#34d399",
    background: "#34d39915",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  },
  inProgressBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "#a78bfa",
    background: "#a78bfa15",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  },
  pulsingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#a78bfa",
    animation: "pulse-glow 1.5s ease-in-out infinite",
  },
  chevron: {
    color: "var(--muted)",
    transition: "transform 0.2s ease",
  },
  progressContainer: {
    padding: "0 1rem 0.75rem",
  },
  progressTrack: {
    height: "4px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #34d399, #22d3d8)",
    borderRadius: "2px",
    transition: "width 0.3s ease",
  },
  itemsList: {
    padding: "0 0.75rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0.75rem",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    transition: "all 0.2s",
  },
  itemActive: {
    background: "rgba(167, 139, 250, 0.1)",
    border: "1px solid rgba(167, 139, 250, 0.3)",
  },
  itemCompleted: {
    opacity: 0.6,
  },
  statusIndicator: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "2px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  spinnerSmall: {
    width: "12px",
    height: "12px",
    border: "2px solid rgba(167, 139, 250, 0.3)",
    borderTopColor: "#a78bfa",
    borderRadius: "50%",
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemText: {
    fontSize: "0.85rem",
    color: "var(--foreground)",
  },
  itemTextCompleted: {
    textDecoration: "line-through",
    color: "var(--muted)",
  },
  activeBadge: {
    fontSize: "0.65rem",
    fontWeight: 500,
    color: "#a78bfa",
    background: "rgba(167, 139, 250, 0.15)",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
    flexShrink: 0,
  },
  // Compact styles
  compactContainer: {
    background: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderRadius: "10px",
    padding: "0.75rem",
    marginBottom: "0.75rem",
  },
  compactHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  compactIcon: {
    fontSize: "0.9rem",
  },
  compactTitle: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--foreground)",
    flex: 1,
  },
  compactProgress: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#34d399",
  },
  compactSpinner: {
    width: "12px",
    height: "12px",
    border: "2px solid rgba(167, 139, 250, 0.3)",
    borderTopColor: "#a78bfa",
    borderRadius: "50%",
  },
  compactProgressBar: {
    height: "3px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "0.5rem",
  },
  compactProgressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #34d399, #22d3d8)",
    borderRadius: "2px",
    transition: "width 0.3s ease",
  },
  compactItems: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
  },
  compactItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.375rem 0.5rem",
    borderRadius: "6px",
    border: "1px solid transparent",
    transition: "all 0.2s",
  },
  compactItemIcon: {
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  compactItemText: {
    fontSize: "0.8rem",
    lineHeight: 1.3,
  },
};
