"use client";

import { useState } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";

export default function TriggersPanel() {
  const {
    agent,
    addTrigger,
    removeTrigger,
    updateTrigger,
    selectNode,
    selectedNodeId,
    selectedNodeType,
  } = useAgentBuilder();

  const [showAddMenu, setShowAddMenu] = useState(false);

  if (!agent) return null;

  const triggerTypes = [
    { type: "manual" as const, label: "Manual", icon: "👆", description: "Trigger manually" },
    { type: "scheduled" as const, label: "Scheduled", icon: "🕐", description: "Run on a schedule" },
    { type: "webhook" as const, label: "Webhook", icon: "🔗", description: "HTTP webhook trigger" },
    { type: "app_event" as const, label: "App Event", icon: "⚡", description: "When something happens in an app" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>TRIGGERS</span>
        <div style={styles.addWrapper}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={styles.addButton}
          >
            + Add
          </button>
          {showAddMenu && (
            <div style={styles.addMenu}>
              {triggerTypes.map((tt) => (
                <button
                  key={tt.type}
                  onClick={() => {
                    const config = tt.type === "manual"
                      ? { type: "manual" as const }
                      : tt.type === "scheduled"
                      ? { type: "scheduled" as const, cron: "" }
                      : tt.type === "webhook"
                      ? { type: "webhook" as const }
                      : { type: "app_event" as const, appName: "", eventType: "" };
                    addTrigger({
                      triggerType: tt.type,
                      name: `${tt.label} Trigger`,
                      config,
                    });
                    setShowAddMenu(false);
                  }}
                  style={styles.menuItem}
                >
                  <span style={styles.menuIcon}>{tt.icon}</span>
                  <div style={styles.menuInfo}>
                    <span style={styles.menuLabel}>{tt.label}</span>
                    <span style={styles.menuDesc}>{tt.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {agent.triggers.length === 0 ? (
          <p style={styles.emptyText}>No triggers configured</p>
        ) : (
          <div style={styles.list}>
            {agent.triggers.map((trigger) => {
              const triggerType = triggerTypes.find(
                (t) => t.type === trigger.triggerType
              );
              return (
                <div
                  key={trigger.id}
                  style={{
                    ...styles.item,
                    ...(selectedNodeId === trigger.id &&
                    selectedNodeType === "trigger"
                      ? styles.selectedItem
                      : {}),
                  }}
                  onClick={() => selectNode(trigger.id, "trigger")}
                >
                  <span style={styles.triggerIcon}>{triggerType?.icon}</span>
                  <div style={styles.triggerInfo}>
                    <span style={styles.triggerName}>{trigger.name}</span>
                    <span style={styles.triggerType}>{triggerType?.label}</span>
                  </div>
                  <div style={styles.triggerActions}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrigger(trigger.id, {
                          isEnabled: !trigger.isEnabled,
                        });
                      }}
                      style={{
                        ...styles.toggleButton,
                        ...(trigger.isEnabled
                          ? styles.toggleEnabled
                          : styles.toggleDisabled),
                      }}
                      title={trigger.isEnabled ? "Disable" : "Enable"}
                    >
                      <div style={styles.toggleDot} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrigger(trigger.id);
                      }}
                      style={styles.actionButton}
                      title="Remove"
                    >
                      <svg
                        width="12"
                        height="12"
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
              );
            })}
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
    width: "280px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "visible",
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
  addWrapper: {
    position: "relative",
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
  addMenu: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "0.5rem",
    width: "200px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    zIndex: 100,
    overflow: "hidden",
  },
  menuItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
  },
  menuIcon: {
    fontSize: "1rem",
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--foreground)",
  },
  menuDesc: {
    display: "block",
    fontSize: "0.65rem",
    color: "var(--muted)",
    marginTop: "0.125rem",
  },
  content: {
    padding: "0.5rem",
    maxHeight: "150px",
    overflowY: "auto",
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
    gap: "0.5rem",
    padding: "0.5rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  selectedItem: {
    background: "rgba(99, 102, 241, 0.1)",
  },
  triggerIcon: {
    fontSize: "1rem",
  },
  triggerInfo: {
    flex: 1,
    minWidth: 0,
  },
  triggerName: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  triggerType: {
    display: "block",
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  triggerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  toggleButton: {
    width: "28px",
    height: "16px",
    borderRadius: "8px",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  toggleEnabled: {
    background: "#10b981",
    justifyContent: "flex-end",
  },
  toggleDisabled: {
    background: "var(--muted)",
    justifyContent: "flex-start",
  },
  toggleDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "white",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "none",
    background: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
  },
  connectionPoint: {
    position: "absolute",
    bottom: "-4px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ec4899",
    border: "2px solid var(--card)",
  },
};
