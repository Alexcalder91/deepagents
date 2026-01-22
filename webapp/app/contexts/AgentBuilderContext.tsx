"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import type {
  Agent,
  AgentTool,
  AgentSubagent,
  AgentSkill,
  AgentTrigger,
  CanvasState,
  TestMessage,
  ToolDefinition,
  SkillDefinition,
  NodeType,
} from "@/lib/agent-builder/types";

interface AgentBuilderState {
  // Agent configuration
  agent: Agent | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // Canvas state
  zoom: number;
  pan: { x: number; y: number };
  selectedNodeId: string | null;
  selectedNodeType: NodeType | null;

  // Test chat
  testMessages: TestMessage[];
  isTestRunning: boolean;

  // Available resources
  availableTools: ToolDefinition[];
  availableSkills: SkillDefinition[];
}

interface AgentBuilderActions {
  // Agent
  loadAgent: (agentId: string) => Promise<void>;
  saveAgent: () => Promise<void>;
  updateAgentName: (name: string) => void;
  updateAgentDescription: (description: string) => void;
  updateAgentInstructions: (instructions: string) => void;
  updateAgentModel: (model: string) => void;

  // Tools
  addTool: (tool: Partial<AgentTool>) => void;
  updateTool: (toolId: string, updates: Partial<AgentTool>) => void;
  removeTool: (toolId: string) => void;

  // Subagents
  addSubagent: (subagent: Partial<AgentSubagent>) => void;
  updateSubagent: (subagentId: string, updates: Partial<AgentSubagent>) => void;
  removeSubagent: (subagentId: string) => void;

  // Skills
  addSkill: (skill: Partial<AgentSkill>) => void;
  removeSkill: (skillId: string) => void;

  // Triggers
  addTrigger: (trigger: Partial<AgentTrigger>) => void;
  updateTrigger: (triggerId: string, updates: Partial<AgentTrigger>) => void;
  removeTrigger: (triggerId: string) => void;

  // Canvas
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  selectNode: (nodeId: string | null, nodeType: NodeType | null) => void;
  updateNodePosition: (
    nodeId: string,
    nodeType: NodeType,
    x: number,
    y: number
  ) => void;

  // Test chat
  sendTestMessage: (message: string) => Promise<void>;
  clearTestChat: () => void;

  // Resources
  loadAvailableTools: () => Promise<void>;
  loadAvailableSkills: () => Promise<void>;
}

type AgentBuilderContextType = AgentBuilderState & AgentBuilderActions;

const AgentBuilderContext = createContext<AgentBuilderContextType | null>(null);

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function AgentBuilderProvider({ children }: { children: ReactNode }) {
  // State
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [zoom, setZoomState] = useState(1);
  const [pan, setPanState] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(
    null
  );

  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillDefinition[]>([]);

  // Load agent
  const loadAgent = useCallback(async (agentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data);

        // Restore canvas state if saved
        if (data.canvasState) {
          setZoomState(data.canvasState.zoom || 1);
          setPanState(data.canvasState.pan || { x: 0, y: 0 });
        }
      }
    } catch (error) {
      console.error("Failed to load agent:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save agent
  const saveAgent = useCallback(async () => {
    if (!agent) return;

    setIsSaving(true);
    try {
      const canvasState: CanvasState = { zoom, pan };

      await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...agent,
          canvasState,
        }),
      });

      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save agent:", error);
    } finally {
      setIsSaving(false);
    }
  }, [agent, zoom, pan]);

  // Update agent fields
  const updateAgentName = useCallback((name: string) => {
    setAgent((prev) => (prev ? { ...prev, name } : null));
    setIsDirty(true);
  }, []);

  const updateAgentDescription = useCallback((description: string) => {
    setAgent((prev) => (prev ? { ...prev, description } : null));
    setIsDirty(true);
  }, []);

  const updateAgentInstructions = useCallback((instructions: string) => {
    setAgent((prev) => (prev ? { ...prev, instructions } : null));
    setIsDirty(true);
  }, []);

  const updateAgentModel = useCallback((model: string) => {
    setAgent((prev) => (prev ? { ...prev, model } : null));
    setIsDirty(true);
  }, []);

  // Tool actions
  const addTool = useCallback((tool: Partial<AgentTool>) => {
    const newTool: AgentTool = {
      id: generateId(),
      agentId: "",
      toolType: tool.toolType || "builtin",
      toolName: tool.toolName || "",
      toolConfig: tool.toolConfig || null,
      requiresReview: tool.requiresReview || false,
      reviewDestination: tool.reviewDestination || null,
      reviewConfig: tool.reviewConfig || null,
      positionX: tool.positionX || 0,
      positionY: tool.positionY || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAgent((prev) =>
      prev
        ? {
            ...prev,
            tools: [...prev.tools, { ...newTool, agentId: prev.id }],
          }
        : null
    );
    setIsDirty(true);
  }, []);

  const updateTool = useCallback(
    (toolId: string, updates: Partial<AgentTool>) => {
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              tools: prev.tools.map((t) =>
                t.id === toolId
                  ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                  : t
              ),
            }
          : null
      );
      setIsDirty(true);
    },
    []
  );

  const removeTool = useCallback((toolId: string) => {
    setAgent((prev) =>
      prev
        ? {
            ...prev,
            tools: prev.tools.filter((t) => t.id !== toolId),
          }
        : null
    );
    setIsDirty(true);
  }, []);

  // Subagent actions
  const addSubagent = useCallback((subagent: Partial<AgentSubagent>) => {
    const newSubagent: AgentSubagent = {
      id: generateId(),
      agentId: "",
      name: subagent.name || "New Subagent",
      description: subagent.description || "",
      systemPrompt: subagent.systemPrompt || "",
      model: subagent.model || null,
      toolIds: subagent.toolIds || [],
      positionX: subagent.positionX || 0,
      positionY: subagent.positionY || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAgent((prev) =>
      prev
        ? {
            ...prev,
            subagents: [
              ...prev.subagents,
              { ...newSubagent, agentId: prev.id },
            ],
          }
        : null
    );
    setIsDirty(true);
  }, []);

  const updateSubagent = useCallback(
    (subagentId: string, updates: Partial<AgentSubagent>) => {
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              subagents: prev.subagents.map((s) =>
                s.id === subagentId
                  ? { ...s, ...updates, updatedAt: new Date().toISOString() }
                  : s
              ),
            }
          : null
      );
      setIsDirty(true);
    },
    []
  );

  const removeSubagent = useCallback((subagentId: string) => {
    setAgent((prev) =>
      prev
        ? {
            ...prev,
            subagents: prev.subagents.filter((s) => s.id !== subagentId),
          }
        : null
    );
    setIsDirty(true);
  }, []);

  // Skill actions
  const addSkill = useCallback((skill: Partial<AgentSkill>) => {
    const newSkill: AgentSkill = {
      id: generateId(),
      agentId: "",
      skillPath: skill.skillPath || "",
      skillName: skill.skillName || "",
      skillDescription: skill.skillDescription || null,
      positionX: skill.positionX || 0,
      positionY: skill.positionY || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAgent((prev) =>
      prev
        ? {
            ...prev,
            skills: [...prev.skills, { ...newSkill, agentId: prev.id }],
          }
        : null
    );
    setIsDirty(true);
  }, []);

  const removeSkill = useCallback((skillId: string) => {
    setAgent((prev) =>
      prev
        ? {
            ...prev,
            skills: prev.skills.filter((s) => s.id !== skillId),
          }
        : null
    );
    setIsDirty(true);
  }, []);

  // Trigger actions
  const addTrigger = useCallback((trigger: Partial<AgentTrigger>) => {
    const newTrigger: AgentTrigger = {
      id: generateId(),
      agentId: "",
      triggerType: trigger.triggerType || "manual",
      name: trigger.name || "New Trigger",
      description: trigger.description || null,
      config: trigger.config || { type: "manual" },
      isEnabled: trigger.isEnabled ?? true,
      positionX: trigger.positionX || 0,
      positionY: trigger.positionY || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAgent((prev) =>
      prev
        ? {
            ...prev,
            triggers: [...prev.triggers, { ...newTrigger, agentId: prev.id }],
          }
        : null
    );
    setIsDirty(true);
  }, []);

  const updateTrigger = useCallback(
    (triggerId: string, updates: Partial<AgentTrigger>) => {
      setAgent((prev) =>
        prev
          ? {
              ...prev,
              triggers: prev.triggers.map((t) =>
                t.id === triggerId
                  ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                  : t
              ),
            }
          : null
      );
      setIsDirty(true);
    },
    []
  );

  const removeTrigger = useCallback((triggerId: string) => {
    setAgent((prev) =>
      prev
        ? {
            ...prev,
            triggers: prev.triggers.filter((t) => t.id !== triggerId),
          }
        : null
    );
    setIsDirty(true);
  }, []);

  // Canvas actions
  const setZoom = useCallback((newZoom: number) => {
    setZoomState(Math.max(0.25, Math.min(2, newZoom)));
    setIsDirty(true);
  }, []);

  const setPan = useCallback((newPan: { x: number; y: number }) => {
    setPanState(newPan);
    setIsDirty(true);
  }, []);

  const selectNode = useCallback(
    (nodeId: string | null, nodeType: NodeType | null) => {
      setSelectedNodeId(nodeId);
      setSelectedNodeType(nodeType);
    },
    []
  );

  const updateNodePosition = useCallback(
    (nodeId: string, nodeType: NodeType, x: number, y: number) => {
      switch (nodeType) {
        case "tool":
          updateTool(nodeId, { positionX: x, positionY: y });
          break;
        case "subagent":
          updateSubagent(nodeId, { positionX: x, positionY: y });
          break;
        case "skill":
          setAgent((prev) =>
            prev
              ? {
                  ...prev,
                  skills: prev.skills.map((s) =>
                    s.id === nodeId ? { ...s, positionX: x, positionY: y } : s
                  ),
                }
              : null
          );
          setIsDirty(true);
          break;
        case "trigger":
          updateTrigger(nodeId, { positionX: x, positionY: y });
          break;
      }
    },
    [updateTool, updateSubagent, updateTrigger]
  );

  // Test chat actions
  const sendTestMessage = useCallback(
    async (message: string) => {
      if (!agent) return;

      const userMessage: TestMessage = {
        id: generateId(),
        role: "user",
        content: message,
        timestamp: Date.now(),
      };

      setTestMessages((prev) => [...prev, userMessage]);
      setIsTestRunning(true);

      try {
        const response = await fetch(`/api/agents/${agent.id}/test-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationHistory: testMessages,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let assistantContent = "";
          const toolSteps: TestMessage["toolSteps"] = [];

          const assistantMessage: TestMessage = {
            id: generateId(),
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            toolSteps: [],
          };

          setTestMessages((prev) => [...prev, assistantMessage]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.content) {
                    assistantContent += parsed.content;
                    setTestMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, content: assistantContent }
                          : m
                      )
                    );
                  }

                  if (parsed.type === "tool_step") {
                    toolSteps.push({
                      id: parsed.id,
                      tool: parsed.tool,
                      reasoning: parsed.reasoning,
                      status: "running",
                      input: parsed.input,
                      timestamp: Date.now(),
                    });
                    setTestMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessage.id
                          ? { ...m, toolSteps: [...toolSteps] }
                          : m
                      )
                    );
                  }

                  if (parsed.type === "tool_step_complete") {
                    const stepIndex = toolSteps.findIndex(
                      (s) => s.id === parsed.id
                    );
                    if (stepIndex !== -1) {
                      toolSteps[stepIndex] = {
                        ...toolSteps[stepIndex],
                        status: "complete",
                        output: parsed.output,
                      };
                      setTestMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantMessage.id
                            ? { ...m, toolSteps: [...toolSteps] }
                            : m
                        )
                      );
                    }
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Test chat error:", error);
        const errorMessage: TestMessage = {
          id: generateId(),
          role: "assistant",
          content: "Error: Failed to send message. Please try again.",
          timestamp: Date.now(),
        };
        setTestMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTestRunning(false);
      }
    },
    [agent, testMessages]
  );

  const clearTestChat = useCallback(() => {
    setTestMessages([]);
  }, []);

  // Load available resources
  const loadAvailableTools = useCallback(async () => {
    try {
      const response = await fetch("/api/tools/available");
      if (response.ok) {
        const data = await response.json();
        setAvailableTools(data);
      }
    } catch (error) {
      console.error("Failed to load available tools:", error);
    }
  }, []);

  const loadAvailableSkills = useCallback(async () => {
    try {
      const response = await fetch("/api/skills/available");
      if (response.ok) {
        const data = await response.json();
        setAvailableSkills(data);
      }
    } catch (error) {
      console.error("Failed to load available skills:", error);
    }
  }, []);

  // Load resources on mount
  useEffect(() => {
    loadAvailableTools();
    loadAvailableSkills();
  }, [loadAvailableTools, loadAvailableSkills]);

  const value: AgentBuilderContextType = {
    // State
    agent,
    isDirty,
    isSaving,
    isLoading,
    zoom,
    pan,
    selectedNodeId,
    selectedNodeType,
    testMessages,
    isTestRunning,
    availableTools,
    availableSkills,

    // Actions
    loadAgent,
    saveAgent,
    updateAgentName,
    updateAgentDescription,
    updateAgentInstructions,
    updateAgentModel,
    addTool,
    updateTool,
    removeTool,
    addSubagent,
    updateSubagent,
    removeSubagent,
    addSkill,
    removeSkill,
    addTrigger,
    updateTrigger,
    removeTrigger,
    setZoom,
    setPan,
    selectNode,
    updateNodePosition,
    sendTestMessage,
    clearTestChat,
    loadAvailableTools,
    loadAvailableSkills,
  };

  return (
    <AgentBuilderContext.Provider value={value}>
      {children}
    </AgentBuilderContext.Provider>
  );
}

export function useAgentBuilder() {
  const context = useContext(AgentBuilderContext);
  if (!context) {
    throw new Error(
      "useAgentBuilder must be used within an AgentBuilderProvider"
    );
  }
  return context;
}
