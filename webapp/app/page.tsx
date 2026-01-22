"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import Canvas from "./components/Canvas";
import ToolTimeline, { ToolStep } from "./components/ToolTimeline";
import ToolActivitySidebar, { ToolActivity } from "./components/ToolActivitySidebar";
import SettingsSidebar from "./components/SettingsSidebar";
import CanvasPreview from "./components/CanvasPreview";
import PlanSidebar, { Plan, PlanStep } from "./components/PlanSidebar";
import TodoListComponent, { TodoList, TodoItem } from "./components/TodoList";
import { usePromptConfig } from "./contexts/PromptConfigContext";
import { useChatHistory, ChatMessage } from "./contexts/ChatHistoryContext";
import { useMemory } from "./contexts/MemoryContext";

interface CanvasData {
  title: string;
  content: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolSteps?: ToolStep[];
  canvas?: CanvasData; // Canvas attached to this message
  todoList?: TodoList; // Todo list attached to this message
}

interface CanvasState {
  isOpen: boolean;
  messageId: string | null; // Which message's canvas is open
  title: string;
  content: string;
  isStreaming: boolean;
}


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canvas, setCanvas] = useState<CanvasState>({
    isOpen: false,
    messageId: null,
    title: "",
    content: "",
    isStreaming: false,
  });
  const [currentToolSteps, setCurrentToolSteps] = useState<ToolStep[]>([]);
  const [toolActivities, setToolActivities] = useState<ToolActivity[]>([]);
  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.34); // Chat takes 34%, canvas takes 66%
  const [isDragging, setIsDragging] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [planSidebarOpen, setPlanSidebarOpen] = useState(false);
  const [currentTodoList, setCurrentTodoList] = useState<TodoList | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChatIdRef = useRef<string | null>(null);
  const { config } = usePromptConfig();
  const { currentChat, currentChatId, updateCurrentChat, setStreamingChatId } = useChatHistory();
  const { memoryFiles, updateMemory } = useMemory();

  // Sync messages with chat history - only reset canvas when switching chats
  useEffect(() => {
    const chatIdChanged = prevChatIdRef.current !== currentChatId;
    prevChatIdRef.current = currentChatId;

    if (chatIdChanged) {
      // Only reset canvas and activities when switching to a different chat
      if (currentChat) {
        setMessages(currentChat.messages as Message[]);
        setToolActivities([]);
        setCanvas({
          isOpen: false,
          messageId: null,
          title: "",
          content: "",
          isStreaming: false,
        });
      } else {
        setMessages([]);
        setToolActivities([]);
      }
    }
  }, [currentChatId, currentChat]);

  // Save messages to chat history when they change (with debounce)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateCurrentChat(messages as ChatMessage[]);
      }, 500);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, isLoading, updateCurrentChat]);

  // Pending canvas data while streaming (before attaching to message)
  const [pendingCanvas, setPendingCanvas] = useState<CanvasData | null>(null);
  const pendingCanvasRef = useRef<CanvasData | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    pendingCanvasRef.current = pendingCanvas;
  }, [pendingCanvas]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolSteps]);

  // Handle drag for resizable split view
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const activityWidth = activitySidebarOpen ? 240 : 0;
    const availableWidth = containerRect.width - activityWidth;
    const mouseX = e.clientX - containerRect.left - 48; // Account for settings sidebar

    // Calculate ratio (chat width / available width)
    let newRatio = mouseX / availableWidth;
    // Clamp between 20% and 80%
    newRatio = Math.max(0.2, Math.min(0.8, newRatio));
    setSplitRatio(newRatio);
  }, [isDragging, activitySidebarOpen]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentToolSteps([]);
    setToolActivities([]);
    setCurrentTodoList(null); // Reset todo list for new message
    setActivitySidebarOpen(true); // Auto-open sidebar when work starts

    // Mark this chat as streaming
    if (currentChatId) {
      setStreamingChatId(currentChatId);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          canvasContent: canvas.content,
          memoryFiles: memoryFiles,
          promptConfig: {
            systemPrompt: config.mainAgentSystemPrompt,
            canvasToolDescription: config.canvasToolDescription,
            // Filesystem tool descriptions
            listFilesDescription: config.listFilesDescription,
            readFileDescription: config.readFileDescription,
            writeFileDescription: config.writeFileDescription,
            editFileDescription: config.editFileDescription,
            globDescription: config.globDescription,
            grepDescription: config.grepDescription,
            executeDescription: config.executeDescription,
            // System prompts
            filesystemSystemPrompt: config.filesystemSystemPrompt,
            executionSystemPrompt: config.executionSystemPrompt,
            // Subagent config
            taskToolDescription: config.taskToolDescription,
            taskSystemPrompt: config.taskSystemPrompt,
            defaultSubagentPrompt: config.defaultSubagentPrompt,
            // Feature prompts
            skillsSystemPrompt: config.skillsSystemPrompt,
            memorySystemPrompt: config.memorySystemPrompt,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        toolSteps: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                // Finalize tool steps, canvas, and todo list in the message
                const finalCanvas = pendingCanvasRef.current;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? {
                          ...m,
                          toolSteps: [...currentToolSteps],
                          canvas: finalCanvas || undefined,
                          todoList: currentTodoList || m.todoList,
                        }
                      : m
                  )
                );
                setCanvas((prev) => ({ ...prev, isStreaming: false }));
                setPendingCanvas(null);
                continue;
              }
              try {
                const parsed = JSON.parse(data);

                // Handle tool step events
                if (parsed.type === "tool_step") {
                  const newStep: ToolStep = {
                    id: parsed.id,
                    tool: parsed.tool,
                    reasoning: parsed.reasoning,
                    status: parsed.status,
                    timestamp: Date.now(),
                  };
                  setCurrentToolSteps((prev) => [...prev, newStep]);
                  // Also update the message's toolSteps
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, toolSteps: [...(m.toolSteps || []), newStep] }
                        : m
                    )
                  );
                  // Add to activity sidebar
                  const newActivity: ToolActivity = {
                    id: parsed.id,
                    tool: parsed.tool,
                    reasoning: parsed.reasoning,
                    status: parsed.status,
                    timestamp: Date.now(),
                    input: parsed.input,
                  };
                  setToolActivities((prev) => [...prev, newActivity]);
                } else if (parsed.type === "tool_step_complete") {
                  const completeTimestamp = Date.now();
                  // Mark the step as complete
                  setCurrentToolSteps((prev) =>
                    prev.map((step) =>
                      step.id === parsed.id || step.tool === parsed.tool
                        ? { ...step, status: "complete" as const }
                        : step
                    )
                  );
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? {
                            ...m,
                            toolSteps: (m.toolSteps || []).map((step) =>
                              step.id === parsed.id || step.tool === parsed.tool
                                ? { ...step, status: "complete" as const }
                                : step
                            ),
                          }
                        : m
                    )
                  );
                  // Update activity sidebar with completion
                  setToolActivities((prev) =>
                    prev.map((activity) =>
                      activity.id === parsed.id || activity.tool === parsed.tool
                        ? {
                            ...activity,
                            status: "complete" as const,
                            output: parsed.output,
                            duration: completeTimestamp - activity.timestamp,
                          }
                        : activity
                    )
                  );
                }
                // Handle canvas tool use
                else if (parsed.type === "canvas_create") {
                  const newCanvas = {
                    title: parsed.title || "Untitled Document",
                    content: "",
                  };
                  setPendingCanvas(newCanvas);
                  // For shared docs, auto-open the canvas immediately
                  // For regular canvas, just store the data without opening
                  if (parsed.isSharedDoc) {
                    setCanvas({
                      isOpen: true,
                      messageId: assistantMessage.id,
                      title: newCanvas.title,
                      content: "",
                      isStreaming: true,
                    });
                  } else {
                    // Update canvas state for streaming indicator but don't open
                    setCanvas((prev) => ({
                      ...prev,
                      title: newCanvas.title,
                      content: "",
                      isStreaming: true,
                    }));
                  }
                } else if (parsed.type === "canvas_content") {
                  setPendingCanvas((prev) =>
                    prev ? { ...prev, content: prev.content + parsed.content } : null
                  );
                  setCanvas((prev) => ({
                    ...prev,
                    content: prev.content + parsed.content,
                  }));
                } else if (parsed.type === "shared_doc_update") {
                  // Live update from subagent writing to shared document
                  setPendingCanvas((prev) =>
                    prev ? { ...prev, content: parsed.content } : null
                  );
                  setCanvas((prev) => ({
                    ...prev,
                    content: parsed.content,
                  }));
                } else if (parsed.type === "canvas_done") {
                  setCanvas((prev) => ({ ...prev, isStreaming: false }));
                } else if (parsed.type === "memory_update") {
                  // Update memory files when agent writes to them
                  updateMemory(parsed.path, parsed.content);
                } else if (parsed.type === "todo_list_create") {
                  // Create a new todo list
                  const newTodoList = parsed.todoList as TodoList;
                  setCurrentTodoList(newTodoList);
                  // Also attach it to the current message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, todoList: newTodoList }
                        : m
                    )
                  );
                } else if (parsed.type === "todo_update") {
                  // Update a specific todo item
                  setCurrentTodoList((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      items: prev.items.map((item) =>
                        item.id === parsed.item_id
                          ? { ...item, status: parsed.status as TodoItem["status"] }
                          : item
                      ),
                    };
                  });
                  // Also update in the message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id && m.todoList
                        ? {
                            ...m,
                            todoList: {
                              ...m.todoList,
                              items: m.todoList.items.map((item) =>
                                item.id === parsed.item_id
                                  ? { ...item, status: parsed.status as TodoItem["status"] }
                                  : item
                              ),
                            },
                          }
                        : m
                    )
                  );
                } else if (parsed.type === "plan_create") {
                  // Create a new plan and open the sidebar
                  setCurrentPlan(parsed.plan as Plan);
                  setPlanSidebarOpen(true);
                } else if (parsed.type === "plan_update") {
                  // Update a plan step
                  setCurrentPlan((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      steps: prev.steps.map((step) =>
                        step.id === parsed.step_id
                          ? {
                              ...step,
                              status: parsed.status as PlanStep["status"],
                              output: parsed.output || step.output,
                            }
                          : step
                      ),
                    };
                  });
                } else if (parsed.content) {
                  // Regular chat content
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessage.id
                        ? { ...m, content: m.content + parsed.content }
                        : m
                    )
                  );
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentToolSteps([]);
      setCanvas((prev) => ({ ...prev, isStreaming: false }));
      setStreamingChatId(null); // Clear streaming state
    }
  };

  const handleCanvasClose = () => {
    setCanvas((prev) => ({ ...prev, isOpen: false, messageId: null }));
  };

  const handleCanvasContentChange = (content: string) => {
    setCanvas((prev) => ({ ...prev, content }));
    // Also update the message's canvas content
    if (canvas.messageId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === canvas.messageId && m.canvas
            ? { ...m, canvas: { ...m.canvas, content } }
            : m
        )
      );
    }
  };

  const handleCanvasTitleChange = (title: string) => {
    setCanvas((prev) => ({ ...prev, title }));
    // Also update the message's canvas title
    if (canvas.messageId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === canvas.messageId && m.canvas
            ? { ...m, canvas: { ...m.canvas, title } }
            : m
        )
      );
    }
  };

  const openCanvasFromMessage = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message?.canvas) {
      setCanvas({
        isOpen: true,
        messageId: messageId,
        title: message.canvas.title,
        content: message.canvas.content,
        isStreaming: false,
      });
    }
  };

  // Calculate main content width based on what panels are open
  const getMainWidth = () => {
    const activityWidth = activitySidebarOpen ? 240 : 0;
    if (canvas.isOpen) {
      // Use split ratio when canvas is open
      return `calc((100% - ${activityWidth}px - 48px) * ${splitRatio})`;
    }
    if (activitySidebarOpen) return `calc(100% - ${activityWidth}px)`;
    return "100%";
  };

  const getCanvasWidth = () => {
    const activityWidth = activitySidebarOpen ? 240 : 0;
    return `calc((100% - ${activityWidth}px - 48px) * ${1 - splitRatio})`;
  };

  return (
    <div ref={containerRef} style={styles.pageContainer}>
      {/* Settings Sidebar (Left) */}
      <SettingsSidebar />

      <div
        style={{
          ...styles.container,
          width: getMainWidth(),
          marginLeft: "48px", // Account for collapsed settings sidebar
        }}
      >
        {messages.length > 0 && (
          <header style={styles.header}>
            <div style={styles.headerContent}>
              <div style={styles.logo}>
                <span style={styles.logoIcon}>🤖</span>
                <h1 style={styles.title}>DeepAgents</h1>
              </div>
              <p style={styles.subtitle}>AI Agent Framework Chat Interface</p>
            </div>
            {/* Header buttons */}
            <div style={styles.headerButtons}>
              {/* Plan toggle button - only show when there's a plan */}
              {currentPlan && (
                <button
                  onClick={() => setPlanSidebarOpen(!planSidebarOpen)}
                  style={{
                    ...styles.planToggle,
                    ...(currentPlan.steps.some((s) => s.status === "in_progress")
                      ? styles.planToggleActive
                      : {}),
                  }}
                  title={planSidebarOpen ? "Hide plan" : "Show plan"}
                >
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
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  <span style={styles.planBadge}>
                    {currentPlan.steps.filter((s) => s.status === "completed").length}/
                    {currentPlan.steps.length}
                  </span>
                </button>
              )}
              {/* Activity toggle button */}
              <button
                onClick={() => setActivitySidebarOpen(!activitySidebarOpen)}
                style={{
                  ...styles.activityToggle,
                  ...(toolActivities.some((a) => a.status === "running")
                    ? styles.activityToggleActive
                    : {}),
                }}
                title={activitySidebarOpen ? "Hide activity" : "Show activity"}
              >
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
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                {toolActivities.length > 0 && (
                  <span style={styles.activityBadge}>{toolActivities.length}</span>
                )}
              </button>
            </div>
          </header>
        )}

        <main style={styles.main}>
          <div style={styles.chatContainer}>
            {messages.length === 0 ? (
              <div style={styles.landingContainer}>
                <h1 style={styles.landingTitle}>Give me something to do</h1>
                <form onSubmit={handleSubmit} style={styles.landingInputForm}>
                  <div style={styles.landingInputContainer}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Assign a task or ask anything"
                      style={styles.landingInput}
                      disabled={isLoading}
                    />
                    <div style={styles.landingInputActions}>
                      <button
                        type="submit"
                        style={{
                          ...styles.landingSendButton,
                          opacity: isLoading || !input.trim() ? 0.3 : 1,
                        }}
                        disabled={isLoading || !input.trim()}
                      >
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
                          <line x1="12" y1="19" x2="12" y2="5"></line>
                          <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>
                <div style={styles.landingSuggestions}>
                  <button
                    style={styles.landingSuggestionBtn}
                    onClick={() => setInput("Write me a blog post about AI agents")}
                  >
                    <span style={styles.suggestionIcon}>📝</span>
                    Create slides
                  </button>
                  <button
                    style={styles.landingSuggestionBtn}
                    onClick={() => setInput("Build a website landing page")}
                  >
                    <span style={styles.suggestionIcon}>🌐</span>
                    Build website
                  </button>
                  <button
                    style={styles.landingSuggestionBtn}
                    onClick={() => setInput("Help me develop an app idea")}
                  >
                    <span style={styles.suggestionIcon}>📱</span>
                    Develop apps
                  </button>
                  <button
                    style={styles.landingSuggestionBtn}
                    onClick={() => setInput("Create a design for my project")}
                  >
                    <span style={styles.suggestionIcon}>✨</span>
                    Design
                  </button>
                  <button
                    style={styles.landingSuggestionBtn}
                    onClick={() => setInput("What can you help me with?")}
                  >
                    More
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.messages}>
                {messages.map((message, index) => {
                  const isLastAssistant = message.role === "assistant" && index === messages.length - 1;
                  const showToolTimeline = message.role === "assistant" &&
                    message.toolSteps &&
                    message.toolSteps.length > 0 &&
                    !(isLastAssistant && isLoading); // Don't show if we're still loading this message

                  return (
                    <div key={message.id}>
                      {/* User messages get their own bubble */}
                      {message.role === "user" && (
                        <div style={{ ...styles.messageRow, justifyContent: "flex-end" }}>
                          <div style={{ ...styles.message, ...styles.userMessage }}>
                            {message.content}
                          </div>
                        </div>
                      )}

                      {/* Assistant messages flow directly in chat */}
                      {message.role === "assistant" && (
                        <>
                          {/* Todo list - show inline in chat */}
                          {message.todoList && (
                            <TodoListComponent
                              todoList={isLastAssistant && currentTodoList ? currentTodoList : message.todoList}
                            />
                          )}

                          {/* Show current todo list for streaming message if it exists */}
                          {isLastAssistant && isLoading && currentTodoList && !message.todoList && (
                            <TodoListComponent todoList={currentTodoList} />
                          )}

                          {/* Tool timeline for completed messages */}
                          {showToolTimeline && (
                            <div style={styles.toolTimelineContainer}>
                              <ToolTimeline steps={message.toolSteps!} isCollapsed={!isLastAssistant} />
                            </div>
                          )}

                          {/* Show current tool steps only for the message being streamed */}
                          {isLastAssistant && isLoading && currentToolSteps.length > 0 && (
                            <div style={styles.toolTimelineContainer}>
                              <ToolTimeline steps={currentToolSteps} />
                            </div>
                          )}

                          {/* Message content */}
                          {message.content && (
                            <div style={styles.assistantContent}>
                              <div className="markdown-content">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {/* Canvas preview card */}
                          {message.canvas && (
                            <CanvasPreview
                              title={message.canvas.title}
                              content={message.canvas.content}
                              onOpen={() => openCanvasFromMessage(message.id)}
                            />
                          )}

                          {/* Typing indicator when loading but no content yet */}
                          {isLastAssistant && isLoading && !message.content && currentToolSteps.length === 0 && (
                            <div style={styles.typingIndicator}>
                              <span style={styles.dot}></span>
                              <span style={{ ...styles.dot, animationDelay: "0.2s" }}></span>
                              <span style={{ ...styles.dot, animationDelay: "0.4s" }}></span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <form onSubmit={handleSubmit} style={styles.inputForm}>
              <div style={styles.inputContainer}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  style={styles.input}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  style={{
                    ...styles.sendButton,
                    opacity: isLoading || !input.trim() ? 0.5 : 1,
                  }}
                  disabled={isLoading || !input.trim()}
                >
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
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {canvas.isOpen && (
        <>
          {/* Draggable divider */}
          <div
            style={{
              ...styles.divider,
              left: `calc(48px + (100% - ${activitySidebarOpen ? 240 : 0}px - 48px) * ${splitRatio})`,
            }}
            onMouseDown={handleMouseDown}
            className="split-divider"
          >
            <div style={styles.dividerHandle} />
          </div>

          <div
            style={{
              ...styles.canvasWrapper,
              width: getCanvasWidth(),
              right: activitySidebarOpen ? "min(15vw, 280px)" : "0",
            }}
          >
            <Canvas
              content={canvas.content}
              title={canvas.title}
              isOpen={canvas.isOpen}
              isStreaming={canvas.isStreaming}
              onClose={handleCanvasClose}
              onContentChange={handleCanvasContentChange}
              onTitleChange={handleCanvasTitleChange}
            />
          </div>
        </>
      )}

      {/* Plan Sidebar */}
      <PlanSidebar
        plan={currentPlan}
        isOpen={planSidebarOpen}
        onClose={() => setPlanSidebarOpen(false)}
      />

      {/* Activity Sidebar */}
      <ToolActivitySidebar
        activities={toolActivities}
        isOpen={activitySidebarOpen}
        onClose={() => setActivitySidebarOpen(false)}
      />

      <style jsx global>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-border {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
          }
        }
        @keyframes progress-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .spinner {
          animation: spin 0.8s linear infinite;
        }
        .node-pulse {
          animation: pulse-border 2s infinite;
        }
        .progress-animate {
          animation: progress-slide 1.5s ease-in-out infinite;
        }
        .pulse-dot {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        .running-text {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        .activity-running {
          animation: none;
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
  },
  canvasWrapper: {
    height: "100vh",
    position: "fixed",
    top: 0,
  },
  divider: {
    position: "fixed",
    top: 0,
    width: "8px",
    height: "100vh",
    cursor: "col-resize",
    zIndex: 101,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    transition: "background 0.2s",
  },
  dividerHandle: {
    width: "4px",
    height: "40px",
    borderRadius: "2px",
    background: "var(--border)",
    transition: "all 0.2s",
  },
  header: {
    padding: "1rem 2rem",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
    textAlign: "center",
    flex: 1,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  headerButtons: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  activityToggle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.5rem 0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
    position: "relative" as const,
  },
  activityToggleActive: {
    borderColor: "var(--accent)",
    color: "var(--accent)",
  },
  activityBadge: {
    fontSize: "0.65rem",
    fontWeight: 600,
    background: "var(--accent)",
    color: "white",
    borderRadius: "10px",
    padding: "0.1rem 0.4rem",
    minWidth: "18px",
    textAlign: "center" as const,
  },
  planToggle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.5rem 0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
    position: "relative" as const,
  },
  planToggleActive: {
    borderColor: "#34d399",
    color: "#34d399",
  },
  planBadge: {
    fontSize: "0.65rem",
    fontWeight: 600,
    background: "#34d39920",
    color: "#34d399",
    borderRadius: "10px",
    padding: "0.1rem 0.4rem",
    minWidth: "18px",
    textAlign: "center" as const,
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  subtitle: {
    color: "var(--muted)",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
    padding: "1rem",
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: "1rem",
  },
  landingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "60vh",
    textAlign: "center",
    padding: "2rem",
  },
  landingTitle: {
    fontSize: "2.5rem",
    fontWeight: 500,
    marginBottom: "2rem",
    color: "var(--foreground)",
    letterSpacing: "-0.02em",
  },
  landingInputForm: {
    width: "100%",
    maxWidth: "700px",
    marginBottom: "1.5rem",
  },
  landingInputContainer: {
    display: "flex",
    alignItems: "center",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "0.75rem 1rem",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  landingInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--foreground)",
    fontSize: "1rem",
    padding: "0.5rem",
    outline: "none",
  },
  landingInputActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  landingSendButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--foreground)",
    border: "none",
    color: "var(--background)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
  },
  landingSuggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
    marginTop: "0.5rem",
  },
  landingSuggestionBtn: {
    padding: "0.625rem 1.25rem",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  suggestionIcon: {
    fontSize: "1rem",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "400px",
    textAlign: "center",
    padding: "2rem",
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  emptyText: {
    color: "var(--muted)",
    marginBottom: "2rem",
    maxWidth: "400px",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "center",
  },
  suggestionBtn: {
    padding: "0.5rem 1rem",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  messages: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  message: {
    maxWidth: "80%",
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    lineHeight: 1.5,
  },
  userMessage: {
    background: "var(--accent)",
    color: "white",
    borderBottomRightRadius: "4px",
  },
  assistantMessage: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderBottomLeftRadius: "4px",
  },
  assistantContent: {
    padding: "0.5rem 0",
    lineHeight: 1.6,
  },
  toolTimelineContainer: {
    padding: "0.5rem 0",
  },
  typingIndicator: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--muted)",
    animation: "blink 1.4s infinite both",
  },
  inputForm: {
    marginTop: "auto",
    paddingTop: "1rem",
  },
  inputContainer: {
    display: "flex",
    gap: "0.5rem",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "0.5rem",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--foreground)",
    fontSize: "1rem",
    padding: "0.5rem",
    outline: "none",
  },
  sendButton: {
    background: "var(--accent)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    padding: "0.5rem 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
};
