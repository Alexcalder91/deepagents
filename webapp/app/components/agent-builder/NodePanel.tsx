"use client";

import { useState, useEffect } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";
import type {
  AgentTool,
  AgentSubagent,
  AgentSkill,
  AgentTrigger,
  ScheduledTriggerConfig,
  WebhookTriggerConfig,
  AppEventTriggerConfig,
} from "@/lib/agent-builder/types";

export default function NodePanel() {
  const {
    agent,
    selectedNodeId,
    selectedNodeType,
    selectNode,
    updateTool,
    updateSubagent,
    updateTrigger,
    removeTool,
    removeSubagent,
    removeSkill,
    removeTrigger,
  } = useAgentBuilder();

  if (!agent || !selectedNodeId || !selectedNodeType) return null;

  // Find the selected item
  let selectedItem: AgentTool | AgentSubagent | AgentSkill | AgentTrigger | null =
    null;

  switch (selectedNodeType) {
    case "tool":
      selectedItem = agent.tools.find((t) => t.id === selectedNodeId) || null;
      break;
    case "subagent":
      selectedItem =
        agent.subagents.find((s) => s.id === selectedNodeId) || null;
      break;
    case "skill":
      selectedItem = agent.skills.find((s) => s.id === selectedNodeId) || null;
      break;
    case "trigger":
      selectedItem =
        agent.triggers.find((t) => t.id === selectedNodeId) || null;
      break;
  }

  if (!selectedItem) return null;

  const handleClose = () => {
    selectNode(null, null);
  };

  const handleDelete = () => {
    switch (selectedNodeType) {
      case "tool":
        removeTool(selectedNodeId);
        break;
      case "subagent":
        removeSubagent(selectedNodeId);
        break;
      case "skill":
        removeSkill(selectedNodeId);
        break;
      case "trigger":
        removeTrigger(selectedNodeId);
        break;
    }
    selectNode(null, null);
  };

  const getTitle = () => {
    switch (selectedNodeType) {
      case "tool":
        return "Tool Configuration";
      case "subagent":
        return "Subagent Configuration";
      case "skill":
        return "Skill Details";
      case "trigger":
        return "Trigger Configuration";
      default:
        return "Configuration";
    }
  };

  const getIcon = () => {
    switch (selectedNodeType) {
      case "tool":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case "subagent":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "skill":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case "trigger":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <span style={styles.icon}>{getIcon()}</span>
          <span style={styles.title}>{getTitle()}</span>
        </div>
        <button onClick={handleClose} style={styles.closeButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {selectedNodeType === "tool" && (
          <ToolEditor tool={selectedItem as AgentTool} onUpdate={updateTool} />
        )}
        {selectedNodeType === "subagent" && (
          <SubagentEditor
            subagent={selectedItem as AgentSubagent}
            onUpdate={updateSubagent}
            availableTools={agent.tools}
          />
        )}
        {selectedNodeType === "skill" && (
          <SkillViewer skill={selectedItem as AgentSkill} />
        )}
        {selectedNodeType === "trigger" && (
          <TriggerEditor
            trigger={selectedItem as AgentTrigger}
            onUpdate={updateTrigger}
          />
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button onClick={handleDelete} style={styles.deleteButton}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

// Tool Editor
function ToolEditor({
  tool,
  onUpdate,
}: {
  tool: AgentTool;
  onUpdate: (id: string, updates: Partial<AgentTool>) => void;
}) {
  const [requiresReview, setRequiresReview] = useState(tool.requiresReview);
  const [reviewDestination, setReviewDestination] = useState(
    tool.reviewDestination || "in_app"
  );

  useEffect(() => {
    setRequiresReview(tool.requiresReview);
    setReviewDestination(tool.reviewDestination || "in_app");
  }, [tool]);

  const handleReviewChange = (value: boolean) => {
    setRequiresReview(value);
    onUpdate(tool.id, { requiresReview: value });
  };

  const handleDestinationChange = (value: typeof reviewDestination) => {
    setReviewDestination(value);
    onUpdate(tool.id, { reviewDestination: value });
  };

  return (
    <div style={styles.editor}>
      <div style={styles.field}>
        <label style={styles.label}>Tool Name</label>
        <div style={styles.readOnlyValue}>{tool.toolName}</div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Type</label>
        <div style={styles.badge}>{tool.toolType}</div>
      </div>

      <div style={styles.divider} />

      <div style={styles.field}>
        <div style={styles.switchRow}>
          <label style={styles.label}>Require Human Review</label>
          <button
            onClick={() => handleReviewChange(!requiresReview)}
            style={{
              ...styles.toggle,
              ...(requiresReview ? styles.toggleOn : styles.toggleOff),
            }}
          >
            <span style={styles.toggleDot} />
          </button>
        </div>
        <p style={styles.helpText}>
          When enabled, tool executions will require approval before running.
        </p>
      </div>

      {requiresReview && (
        <div style={styles.field}>
          <label style={styles.label}>Review Destination</label>
          <select
            value={reviewDestination}
            onChange={(e) =>
              handleDestinationChange(
                e.target.value as typeof reviewDestination
              )
            }
            style={styles.select}
          >
            <option value="in_app">In-App Notification</option>
            <option value="slack">Slack</option>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
      )}
    </div>
  );
}

// Subagent Editor
function SubagentEditor({
  subagent,
  onUpdate,
  availableTools,
}: {
  subagent: AgentSubagent;
  onUpdate: (id: string, updates: Partial<AgentSubagent>) => void;
  availableTools: AgentTool[];
}) {
  const [name, setName] = useState(subagent.name);
  const [description, setDescription] = useState(subagent.description);
  const [systemPrompt, setSystemPrompt] = useState(subagent.systemPrompt);
  const [model, setModel] = useState(subagent.model || "");
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
    subagent.toolIds || []
  );

  useEffect(() => {
    setName(subagent.name);
    setDescription(subagent.description);
    setSystemPrompt(subagent.systemPrompt);
    setModel(subagent.model || "");
    setSelectedToolIds(subagent.toolIds || []);
  }, [subagent]);

  const handleBlur = (field: string, value: string | string[]) => {
    onUpdate(subagent.id, { [field]: value });
  };

  const toggleTool = (toolId: string) => {
    const newToolIds = selectedToolIds.includes(toolId)
      ? selectedToolIds.filter((id) => id !== toolId)
      : [...selectedToolIds, toolId];
    setSelectedToolIds(newToolIds);
    onUpdate(subagent.id, { toolIds: newToolIds });
  };

  return (
    <div style={styles.editor}>
      <div style={styles.field}>
        <label style={styles.label}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleBlur("name", name)}
          style={styles.input}
          placeholder="Subagent name"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => handleBlur("description", description)}
          style={styles.input}
          placeholder="What does this subagent do?"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          onBlur={() => handleBlur("systemPrompt", systemPrompt)}
          style={styles.textarea}
          placeholder="Instructions for this subagent..."
          rows={4}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Model</label>
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            handleBlur("model", e.target.value);
          }}
          style={styles.select}
        >
          <option value="">Inherit from parent</option>
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
          <option value="claude-opus-4-20250514">Claude Opus 4</option>
          <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
        </select>
      </div>

      <div style={styles.divider} />

      <div style={styles.field}>
        <label style={styles.label}>Assigned Tools</label>
        <p style={styles.helpText}>
          Select which tools this subagent can use.
        </p>
        <div style={styles.toolsList}>
          {availableTools.length === 0 ? (
            <p style={styles.emptyTools}>
              Add tools to the main agent first.
            </p>
          ) : (
            availableTools.map((tool) => (
              <label key={tool.id} style={styles.toolCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedToolIds.includes(tool.id)}
                  onChange={() => toggleTool(tool.id)}
                  style={styles.checkbox}
                />
                <span style={styles.toolCheckboxLabel}>{tool.toolName}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Skill Viewer (read-only since skills are predefined)
function SkillViewer({ skill }: { skill: AgentSkill }) {
  return (
    <div style={styles.editor}>
      <div style={styles.field}>
        <label style={styles.label}>Skill Name</label>
        <div style={styles.readOnlyValue}>{skill.skillName}</div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Path</label>
        <div style={styles.codePath}>{skill.skillPath}</div>
      </div>

      {skill.skillDescription && (
        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <p style={styles.description}>{skill.skillDescription}</p>
        </div>
      )}
    </div>
  );
}

// Trigger Editor
function TriggerEditor({
  trigger,
  onUpdate,
}: {
  trigger: AgentTrigger;
  onUpdate: (id: string, updates: Partial<AgentTrigger>) => void;
}) {
  const [name, setName] = useState(trigger.name);
  const [description, setDescription] = useState(trigger.description || "");
  const [isEnabled, setIsEnabled] = useState(trigger.isEnabled);

  // Config fields based on trigger type
  const [cron, setCron] = useState(
    (trigger.config as ScheduledTriggerConfig)?.cron || ""
  );
  const [timezone, setTimezone] = useState(
    (trigger.config as ScheduledTriggerConfig)?.timezone || ""
  );
  const [webhookSecret, setWebhookSecret] = useState(
    (trigger.config as WebhookTriggerConfig)?.secret || ""
  );
  const [appName, setAppName] = useState(
    (trigger.config as AppEventTriggerConfig)?.appName || ""
  );
  const [eventType, setEventType] = useState(
    (trigger.config as AppEventTriggerConfig)?.eventType || ""
  );

  useEffect(() => {
    setName(trigger.name);
    setDescription(trigger.description || "");
    setIsEnabled(trigger.isEnabled);
    if (trigger.triggerType === "scheduled") {
      setCron((trigger.config as ScheduledTriggerConfig)?.cron || "");
      setTimezone((trigger.config as ScheduledTriggerConfig)?.timezone || "");
    } else if (trigger.triggerType === "webhook") {
      setWebhookSecret((trigger.config as WebhookTriggerConfig)?.secret || "");
    } else if (trigger.triggerType === "app_event") {
      setAppName((trigger.config as AppEventTriggerConfig)?.appName || "");
      setEventType((trigger.config as AppEventTriggerConfig)?.eventType || "");
    }
  }, [trigger]);

  const handleBlur = (field: string, value: unknown) => {
    onUpdate(trigger.id, { [field]: value });
  };

  const handleConfigUpdate = (configUpdates: Record<string, unknown>) => {
    const newConfig = { ...trigger.config, ...configUpdates };
    onUpdate(trigger.id, { config: newConfig as typeof trigger.config });
  };

  const handleEnabledChange = (value: boolean) => {
    setIsEnabled(value);
    onUpdate(trigger.id, { isEnabled: value });
  };

  return (
    <div style={styles.editor}>
      <div style={styles.field}>
        <label style={styles.label}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleBlur("name", name)}
          style={styles.input}
          placeholder="Trigger name"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => handleBlur("description", description)}
          style={styles.input}
          placeholder="Optional description"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Type</label>
        <div style={styles.badge}>{trigger.triggerType}</div>
      </div>

      <div style={styles.field}>
        <div style={styles.switchRow}>
          <label style={styles.label}>Enabled</label>
          <button
            onClick={() => handleEnabledChange(!isEnabled)}
            style={{
              ...styles.toggle,
              ...(isEnabled ? styles.toggleOn : styles.toggleOff),
            }}
          >
            <span style={styles.toggleDot} />
          </button>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Type-specific configuration */}
      {trigger.triggerType === "scheduled" && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Cron Expression</label>
            <input
              type="text"
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              onBlur={() => handleConfigUpdate({ cron })}
              style={styles.input}
              placeholder="0 9 * * 1-5"
            />
            <p style={styles.helpText}>
              Standard cron format: minute hour day month weekday
            </p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              onBlur={() => handleConfigUpdate({ timezone })}
              style={styles.input}
              placeholder="America/New_York"
            />
          </div>
        </>
      )}

      {trigger.triggerType === "webhook" && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Webhook URL</label>
            <div style={styles.urlDisplay}>
              {(trigger.config as WebhookTriggerConfig)?.webhookUrl ||
                "Will be generated on save"}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Secret (Optional)</label>
            <input
              type="text"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              onBlur={() => handleConfigUpdate({ secret: webhookSecret })}
              style={styles.input}
              placeholder="Webhook secret for verification"
            />
            <p style={styles.helpText}>
              Used to verify webhook requests via HMAC signature.
            </p>
          </div>
        </>
      )}

      {trigger.triggerType === "app_event" && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>App Name</label>
            <select
              value={appName}
              onChange={(e) => {
                setAppName(e.target.value);
                handleConfigUpdate({ appName: e.target.value });
              }}
              style={styles.select}
            >
              <option value="">Select an app...</option>
              <option value="slack">Slack</option>
              <option value="github">GitHub</option>
              <option value="linear">Linear</option>
              <option value="notion">Notion</option>
              <option value="jira">Jira</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Event Type</label>
            <input
              type="text"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              onBlur={() => handleConfigUpdate({ eventType })}
              style={styles.input}
              placeholder="e.g., message.received, issue.created"
            />
          </div>
        </>
      )}

      {trigger.triggerType === "manual" && (
        <div style={styles.infoBox}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p>
            Manual triggers are activated by clicking the "Run" button in the
            agent dashboard.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "320px",
    minWidth: "320px",
    background: "var(--card)",
    borderLeft: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "var(--accent)",
    color: "white",
  },
  title: {
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "var(--muted)",
    cursor: "pointer",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "1rem",
  },
  editor: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  input: {
    padding: "0.5rem 0.75rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--foreground)",
    fontSize: "0.85rem",
    outline: "none",
  },
  textarea: {
    padding: "0.5rem 0.75rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--foreground)",
    fontSize: "0.85rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.5,
  },
  select: {
    padding: "0.5rem 0.75rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--foreground)",
    fontSize: "0.85rem",
    outline: "none",
    cursor: "pointer",
  },
  readOnlyValue: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "var(--foreground)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.5rem",
    background: "var(--accent)",
    color: "white",
    borderRadius: "4px",
    fontSize: "0.7rem",
    fontWeight: 500,
    textTransform: "uppercase",
    width: "fit-content",
  },
  codePath: {
    fontSize: "0.8rem",
    fontFamily: "monospace",
    color: "var(--muted)",
    background: "var(--background)",
    padding: "0.5rem",
    borderRadius: "4px",
    wordBreak: "break-all",
  },
  description: {
    fontSize: "0.85rem",
    color: "var(--foreground)",
    lineHeight: 1.5,
    margin: 0,
  },
  divider: {
    height: "1px",
    background: "var(--border)",
    margin: "0.5rem 0",
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggle: {
    width: "40px",
    height: "22px",
    borderRadius: "11px",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
  },
  toggleOn: {
    background: "#10b981",
    justifyContent: "flex-end",
  },
  toggleOff: {
    background: "var(--muted)",
    justifyContent: "flex-start",
  },
  toggleDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "white",
  },
  helpText: {
    fontSize: "0.7rem",
    color: "var(--muted)",
    margin: 0,
    lineHeight: 1.4,
  },
  toolsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  toolCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    background: "var(--background)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "var(--accent)",
  },
  toolCheckboxLabel: {
    fontSize: "0.85rem",
  },
  emptyTools: {
    fontSize: "0.8rem",
    color: "var(--muted)",
    fontStyle: "italic",
    margin: 0,
    padding: "0.5rem",
  },
  urlDisplay: {
    fontSize: "0.8rem",
    fontFamily: "monospace",
    color: "var(--muted)",
    background: "var(--background)",
    padding: "0.5rem",
    borderRadius: "4px",
    wordBreak: "break-all",
  },
  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "8px",
    color: "var(--accent)",
  },
  footer: {
    padding: "0.75rem 1rem",
    borderTop: "1px solid var(--border)",
  },
  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.5rem",
    background: "transparent",
    border: "1px solid #ef4444",
    borderRadius: "6px",
    color: "#ef4444",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
