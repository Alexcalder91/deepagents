"use client";

import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";

export default function SkillsPanel() {
  const {
    agent,
    availableSkills,
    addSkill,
    removeSkill,
    selectNode,
    selectedNodeId,
    selectedNodeType,
  } = useAgentBuilder();

  if (!agent) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>SKILLS</span>
        <button
          onClick={() => {
            // In a full implementation, this would open a skill picker
            // For now, we'll just show a placeholder
          }}
          style={styles.addButton}
        >
          + Add
        </button>
      </div>

      <div style={styles.content}>
        {agent.skills.length === 0 ? (
          <p style={styles.emptyText}>No skills configured</p>
        ) : (
          <div style={styles.list}>
            {agent.skills.map((skill) => (
              <div
                key={skill.id}
                style={{
                  ...styles.item,
                  ...(selectedNodeId === skill.id &&
                  selectedNodeType === "skill"
                    ? styles.selectedItem
                    : {}),
                }}
                onClick={() => selectNode(skill.id, "skill")}
              >
                <div style={styles.skillIcon}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div style={styles.skillInfo}>
                  <span style={styles.skillName}>{skill.skillName}</span>
                  {skill.skillDescription && (
                    <span style={styles.skillDescription}>
                      {skill.skillDescription}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSkill(skill.id);
                  }}
                  style={styles.removeButton}
                  title="Remove skill"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
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
    width: "200px",
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
  skillIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    background: "#f59e0b20",
    color: "#f59e0b",
  },
  skillInfo: {
    flex: 1,
    minWidth: 0,
  },
  skillName: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  skillDescription: {
    display: "block",
    fontSize: "0.65rem",
    color: "var(--muted)",
    marginTop: "0.125rem",
  },
  removeButton: {
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
    left: "-4px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#f59e0b",
    border: "2px solid var(--card)",
  },
};
