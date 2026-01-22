// Agent Builder Types

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  instructions: string;
  model: string;
  isActive: boolean;
  canvasState: CanvasState | null;
  createdAt: string;
  updatedAt: string;
  tools: AgentTool[];
  subagents: AgentSubagent[];
  skills: AgentSkill[];
  triggers: AgentTrigger[];
}

export interface AgentTool {
  id: string;
  agentId: string;
  toolType: "builtin" | "mcp" | "custom";
  toolName: string;
  toolConfig: Record<string, unknown> | null;
  requiresReview: boolean;
  reviewDestination: "slack" | "email" | "webhook" | "in_app" | null;
  reviewConfig: Record<string, unknown> | null;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSubagent {
  id: string;
  agentId: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string | null;
  toolIds: string[];
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSkill {
  id: string;
  agentId: string;
  skillPath: string;
  skillName: string;
  skillDescription: string | null;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTrigger {
  id: string;
  agentId: string;
  triggerType: "manual" | "scheduled" | "webhook" | "app_event";
  name: string;
  description: string | null;
  config: TriggerConfig;
  isEnabled: boolean;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
}

export type TriggerConfig =
  | ManualTriggerConfig
  | ScheduledTriggerConfig
  | WebhookTriggerConfig
  | AppEventTriggerConfig;

export interface ManualTriggerConfig {
  type: "manual";
}

export interface ScheduledTriggerConfig {
  type: "scheduled";
  cron: string;
  timezone?: string;
}

export interface WebhookTriggerConfig {
  type: "webhook";
  webhookUrl?: string;
  secret?: string;
}

export interface AppEventTriggerConfig {
  type: "app_event";
  appName: string;
  eventType: string;
  filters?: Record<string, unknown>;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions?: Record<string, { x: number; y: number }>;
}

export interface TestMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolSteps?: ToolStep[];
}

export interface ToolStep {
  id: string;
  tool: string;
  reasoning: string;
  status: "running" | "complete" | "error";
  input?: Record<string, unknown>;
  output?: string;
  timestamp: number;
}

// Tool definitions for the tool picker
export interface ToolDefinition {
  name: string;
  type: "builtin" | "mcp" | "custom";
  description: string;
  inputSchema: Record<string, unknown>;
  category: "filesystem" | "execution" | "canvas" | "planning" | "subagent" | "other";
  icon?: string;
}

// Skill definitions for the skill picker
export interface SkillDefinition {
  path: string;
  name: string;
  description: string;
  allowedTools?: string[];
}

// Node types for the canvas
export type NodeType = "agent" | "tool" | "subagent" | "skill" | "trigger";

export interface NodePosition {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: { nodeId: string; nodeType: NodeType };
  to: { nodeId: string; nodeType: NodeType };
}
