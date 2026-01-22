"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/lib/agent-builder/types";

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createAgent() {
    setIsCreating(true);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Agent" }),
      });

      if (response.ok) {
        const newAgent = await response.json();
        router.push(`/agents/${newAgent.id}`);
      }
    } catch (error) {
      console.error("Failed to create agent:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteAgent(agentId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      }
    } catch (error) {
      console.error("Failed to delete agent:", error);
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => router.push("/")} style={styles.backButton}>
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={styles.title}>Agents</h1>
        </div>
        <button
          onClick={createAgent}
          disabled={isCreating}
          style={styles.createButton}
        >
          {isCreating ? (
            <span style={styles.spinner} />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
          New Agent
        </button>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {isLoading ? (
          <div style={styles.loading}>
            <span style={styles.spinner} />
            <p>Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6M9 15h6M9 12h6" />
              </svg>
            </div>
            <h2 style={styles.emptyTitle}>No agents yet</h2>
            <p style={styles.emptyText}>
              Create your first agent to get started with automated workflows.
            </p>
            <button
              onClick={createAgent}
              disabled={isCreating}
              style={styles.createButtonLarge}
            >
              {isCreating ? (
                <span style={styles.spinner} />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              Create Agent
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={styles.card}
                onClick={() => router.push(`/agents/${agent.id}`)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={(e) => deleteAgent(agent.id, e)}
                      style={styles.deleteButton}
                      title="Delete agent"
                    >
                      <svg
                        width="16"
                        height="16"
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
                <h3 style={styles.cardTitle}>{agent.name}</h3>
                {agent.description && (
                  <p style={styles.cardDescription}>{agent.description}</p>
                )}
                <div style={styles.cardMeta}>
                  <span style={styles.metaItem}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    {agent.tools?.length || 0} tools
                  </span>
                  <span style={styles.metaItem}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {agent.triggers?.length || 0} triggers
                  </span>
                </div>
                <div style={styles.cardFooter}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(agent.isActive
                        ? styles.statusActive
                        : styles.statusInactive),
                    }}
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                  <span style={styles.dateText}>
                    Updated{" "}
                    {new Date(agent.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "var(--background)",
    color: "var(--foreground)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid var(--border)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: 0,
  },
  createButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "var(--accent)",
    color: "white",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  main: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    gap: "1rem",
    color: "var(--muted)",
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "2px solid currentColor",
    borderRightColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    textAlign: "center",
    padding: "2rem",
  },
  emptyIcon: {
    color: "var(--muted)",
    marginBottom: "1.5rem",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: "0 0 0.5rem 0",
  },
  emptyText: {
    color: "var(--muted)",
    marginBottom: "1.5rem",
    maxWidth: "400px",
  },
  createButtonLarge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    borderRadius: "10px",
    border: "none",
    background: "var(--accent)",
    color: "white",
    fontSize: "1rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  cardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "var(--accent)",
    color: "white",
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  cardTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    margin: "0 0 0.5rem 0",
  },
  cardDescription: {
    color: "var(--muted)",
    fontSize: "0.875rem",
    margin: "0 0 1rem 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardMeta: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "1rem",
    borderTop: "1px solid var(--border)",
  },
  statusBadge: {
    fontSize: "0.75rem",
    fontWeight: 500,
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  statusActive: {
    background: "#10b98120",
    color: "#10b981",
  },
  statusInactive: {
    background: "var(--muted)20",
    color: "var(--muted)",
  },
  dateText: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
};
