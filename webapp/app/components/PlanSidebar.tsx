"use client";

import { useEffect, useRef, useState } from "react";

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  type: "task" | "subagent" | "manual" | "checkpoint";
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  assignee?: string;
  dependencies?: string[];
  output?: string | null;
}

export interface Plan {
  id: string;
  title: string;
  goal: string;
  steps: PlanStep[];
  createdAt: string;
}

interface PlanSidebarProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  pending: { icon: "○", color: "#6b7280", label: "Pending" },
  in_progress: { icon: "◐", color: "#a78bfa", label: "In Progress" },
  completed: { icon: "●", color: "#34d399", label: "Completed" },
  failed: { icon: "✕", color: "#f87171", label: "Failed" },
  skipped: { icon: "◌", color: "#9ca3af", label: "Skipped" },
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  task: { icon: "📋", label: "Task", color: "#60a5fa" },
  subagent: { icon: "🤖", label: "Subagent", color: "#e879f9" },
  manual: { icon: "👤", label: "Manual", color: "#fbbf24" },
  checkpoint: { icon: "🎯", label: "Checkpoint", color: "#34d399" },
};

export default function PlanSidebar({ plan, isOpen, onClose }: PlanSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Auto-expand in-progress steps
  useEffect(() => {
    if (plan) {
      const inProgressSteps = plan.steps
        .filter((s) => s.status === "in_progress")
        .map((s) => s.id);
      setExpandedSteps(new Set(inProgressSteps));
    }
  }, [plan]);

  const toggleExpanded = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!plan) {
    return null;
  }

  const completedCount = plan.steps.filter((s) => s.status === "completed").length;
  const totalCount = plan.steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const inProgressCount = plan.steps.filter((s) => s.status === "in_progress").length;

  return (
    <>
      <div
        style={{
          ...styles.sidebar,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div style={styles.headerTitle}>
              <span style={styles.headerIcon}>📋</span>
              <h2 style={styles.title}>Plan</h2>
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

          {/* Plan title and goal */}
          <h3 style={styles.planTitle}>{plan.title}</h3>
          <p style={styles.planGoal}>{plan.goal}</p>

          {/* Progress bar */}
          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <span style={styles.progressText}>
                {completedCount} of {totalCount} steps
              </span>
              <span style={styles.progressPercent}>{Math.round(progressPercent)}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div style={styles.statsBar}>
            {inProgressCount > 0 && (
              <div style={styles.stat}>
                <span style={{ ...styles.statDot, background: "#a78bfa" }} className="pulse-dot" />
                <span style={styles.statText}>{inProgressCount} in progress</span>
              </div>
            )}
            <div style={styles.stat}>
              <span style={{ ...styles.statDot, background: "#34d399" }} />
              <span style={styles.statText}>{completedCount} completed</span>
            </div>
          </div>
        </div>

        {/* Steps list */}
        <div ref={scrollRef} style={styles.stepsList}>
          {plan.steps.map((step, index) => {
            const statusConfig = STATUS_CONFIG[step.status];
            const typeConfig = TYPE_CONFIG[step.type];
            const isExpanded = expandedSteps.has(step.id);
            const isInProgress = step.status === "in_progress";
            const isCompleted = step.status === "completed";
            const hasDependencies = step.dependencies && step.dependencies.length > 0;

            return (
              <div
                key={step.id}
                style={{
                  ...styles.stepItem,
                  ...(isInProgress ? styles.stepItemInProgress : {}),
                  ...(isCompleted ? styles.stepItemCompleted : {}),
                }}
              >
                {/* Timeline connector */}
                {index < plan.steps.length - 1 && (
                  <div
                    style={{
                      ...styles.connector,
                      background: isCompleted
                        ? "#34d399"
                        : isInProgress
                        ? `linear-gradient(180deg, ${statusConfig.color}, var(--border))`
                        : "var(--border)",
                    }}
                  />
                )}

                {/* Step number/status indicator */}
                <div
                  style={{
                    ...styles.stepNumber,
                    borderColor: statusConfig.color,
                    background: isCompleted ? "#34d39920" : isInProgress ? "#a78bfa20" : "var(--card)",
                    ...(isInProgress ? { boxShadow: `0 0 12px ${statusConfig.color}40` } : {}),
                  }}
                  className={isInProgress ? "node-pulse" : ""}
                >
                  {isInProgress ? (
                    <div style={styles.spinnerWrapper}>
                      <div
                        style={{
                          ...styles.spinner,
                          borderTopColor: statusConfig.color,
                        }}
                        className="spinner"
                      />
                    </div>
                  ) : (
                    <span
                      style={{
                        ...styles.statusIcon,
                        color: statusConfig.color,
                      }}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </span>
                  )}
                </div>

                {/* Step content */}
                <div style={styles.stepContent}>
                  <button
                    onClick={() => toggleExpanded(step.id)}
                    style={styles.stepHeader}
                  >
                    <div style={styles.stepTitleRow}>
                      <span
                        style={{
                          ...styles.typeBadge,
                          background: `${typeConfig.color}20`,
                          color: typeConfig.color,
                        }}
                      >
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                      {step.assignee && (
                        <span style={styles.assigneeBadge}>{step.assignee}</span>
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

                  <h4 style={styles.stepTitle}>{step.title}</h4>

                  <div style={styles.statusRow}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: `${statusConfig.color}20`,
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={styles.expandedContent}>
                      <p style={styles.stepDescription}>{step.description}</p>

                      {hasDependencies && (
                        <div style={styles.detailSection}>
                          <span style={styles.detailLabel}>Dependencies</span>
                          <div style={styles.dependenciesList}>
                            {step.dependencies?.map((depId) => {
                              const depStep = plan.steps.find((s) => s.id === depId);
                              const depStatus = depStep
                                ? STATUS_CONFIG[depStep.status]
                                : STATUS_CONFIG.pending;
                              return (
                                <span
                                  key={depId}
                                  style={{
                                    ...styles.dependencyBadge,
                                    borderColor: depStatus.color,
                                  }}
                                >
                                  {depStep?.title || depId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {step.output && (
                        <div style={styles.detailSection}>
                          <span style={styles.detailLabel}>Output</span>
                          <pre style={styles.outputBlock}>{step.output}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {inProgressCount > 0 && (
          <div style={styles.footer}>
            <div style={styles.footerProgress}>
              <div style={styles.footerProgressTrack}>
                <div style={styles.footerProgressFill} className="progress-animate" />
              </div>
            </div>
            <span style={styles.footerText}>Executing plan...</span>
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
    left: "48px", // Account for settings sidebar
    width: "320px",
    maxWidth: "calc(100vw - 48px)",
    height: "100vh",
    background: "linear-gradient(180deg, #0f0f12 0%, #0a0a0d 100%)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 90,
    boxShadow: "4px 0 24px rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 89,
    display: "none",
  },
  header: {
    padding: "1rem",
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
  planTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--foreground)",
    margin: "0 0 0.5rem 0",
  },
  planGoal: {
    fontSize: "0.85rem",
    color: "var(--muted)",
    margin: "0 0 1rem 0",
    lineHeight: 1.4,
  },
  progressSection: {
    marginBottom: "0.75rem",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.375rem",
  },
  progressText: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
  progressPercent: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#34d399",
  },
  progressTrack: {
    height: "6px",
    background: "var(--border)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #34d399, #22d3d8)",
    borderRadius: "3px",
    transition: "width 0.3s ease",
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
  },
  statText: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
  stepsList: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
  },
  stepItem: {
    position: "relative",
    display: "flex",
    gap: "0.75rem",
    paddingBottom: "1.5rem",
  },
  stepItemInProgress: {
    // Additional styling
  },
  stepItemCompleted: {
    opacity: 0.8,
  },
  connector: {
    position: "absolute",
    left: "15px",
    top: "36px",
    bottom: "0",
    width: "2px",
    borderRadius: "1px",
  },
  stepNumber: {
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
  statusIcon: {
    fontSize: "0.875rem",
    fontWeight: 600,
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
  stepContent: {
    flex: 1,
    minWidth: 0,
  },
  stepHeader: {
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
  stepTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  typeBadge: {
    fontSize: "0.65rem",
    fontWeight: 600,
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
  },
  assigneeBadge: {
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
  stepTitle: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "var(--foreground)",
    margin: "0 0 0.375rem 0",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  statusBadge: {
    fontSize: "0.65rem",
    fontWeight: 500,
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  expandedContent: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "8px",
    border: "1px solid var(--border)",
  },
  stepDescription: {
    fontSize: "0.8rem",
    color: "var(--foreground)",
    margin: "0 0 0.75rem 0",
    lineHeight: 1.5,
    opacity: 0.9,
  },
  detailSection: {
    marginTop: "0.75rem",
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
  dependenciesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.375rem",
  },
  dependencyBadge: {
    fontSize: "0.7rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid var(--border)",
    color: "var(--muted)",
  },
  outputBlock: {
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
  footer: {
    padding: "0.75rem 1rem",
    borderTop: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  footerProgress: {
    marginBottom: "0.5rem",
  },
  footerProgressTrack: {
    height: "3px",
    background: "var(--border)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  footerProgressFill: {
    height: "100%",
    width: "30%",
    background: "linear-gradient(90deg, var(--accent), #a78bfa)",
    borderRadius: "2px",
  },
  footerText: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
};
