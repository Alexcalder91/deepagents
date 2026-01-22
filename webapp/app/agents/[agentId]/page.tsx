"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  AgentBuilderProvider,
  useAgentBuilder,
} from "@/app/contexts/AgentBuilderContext";
import AgentBuilderCanvas from "@/app/components/agent-builder/AgentBuilderCanvas";
import TestChatPanel from "@/app/components/agent-builder/TestChatPanel";
import NodePanel from "@/app/components/agent-builder/NodePanel";

interface PageProps {
  params: Promise<{ agentId: string }>;
}

function AgentBuilderContent({ agentId }: { agentId: string }) {
  const router = useRouter();
  const {
    agent,
    isLoading,
    isDirty,
    isSaving,
    loadAgent,
    saveAgent,
    selectedNodeId,
    selectedNodeType,
  } = useAgentBuilder();

  useEffect(() => {
    loadAgent(agentId);
  }, [agentId, loadAgent]);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <span style={styles.spinner} />
        <p>Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={styles.errorContainer}>
        <h2>Agent not found</h2>
        <button onClick={() => router.push("/agents")} style={styles.backButton}>
          Back to Agents
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            onClick={() => router.push("/agents")}
            style={styles.backBtn}
            title="Back to agents"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div style={styles.agentInfo}>
            <span style={styles.agentName}>{agent.name}</span>
            <div style={styles.badges}>
              <span style={styles.editingBadge}>Editing</span>
              <span style={styles.privateBadge}>Private</span>
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {isDirty && (
            <span style={styles.unsavedIndicator}>Unsaved changes</span>
          )}
          <button
            onClick={saveAgent}
            disabled={isSaving || !isDirty}
            style={{
              ...styles.saveButton,
              opacity: isSaving || !isDirty ? 0.5 : 1,
            }}
          >
            {isSaving ? (
              <>
                <span style={styles.smallSpinner} />
                Saving...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {isDirty ? "Save" : "Saved"}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content with 3-panel layout */}
      <div style={styles.mainContent}>
        {/* Left: Test Chat Panel */}
        <TestChatPanel />

        {/* Center: Canvas */}
        <div style={styles.canvasContainer}>
          <AgentBuilderCanvas />
        </div>

        {/* Right: Node Panel (shown when node selected) */}
        {selectedNodeId && selectedNodeType && <NodePanel />}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function AgentBuilderPage({ params }: PageProps) {
  const { agentId } = use(params);

  return (
    <AgentBuilderProvider>
      <AgentBuilderContent agentId={agentId} />
    </AgentBuilderProvider>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--background)",
    color: "var(--foreground)",
    overflow: "hidden",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "1rem",
    color: "var(--muted)",
  },
  spinner: {
    display: "inline-block",
    width: "24px",
    height: "24px",
    border: "2px solid currentColor",
    borderRightColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  smallSpinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid currentColor",
    borderRightColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "1rem",
  },
  backButton: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
    background: "var(--card)",
    zIndex: 100,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  agentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  agentName: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  badges: {
    display: "flex",
    gap: "0.5rem",
  },
  editingBadge: {
    fontSize: "0.7rem",
    fontWeight: 500,
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    background: "var(--muted)20",
    color: "var(--muted)",
  },
  privateBadge: {
    fontSize: "0.7rem",
    fontWeight: 500,
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    background: "var(--muted)20",
    color: "var(--muted)",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  unsavedIndicator: {
    fontSize: "0.75rem",
    color: "var(--accent)",
  },
  saveButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "none",
    background: "#10b981",
    color: "white",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  canvasContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
};
