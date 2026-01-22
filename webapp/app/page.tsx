"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Canvas from "./components/Canvas";
import ToolTimeline, { ToolStep } from "./components/ToolTimeline";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolSteps?: ToolStep[];
}

interface CanvasState {
  isOpen: boolean;
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
    title: "",
    content: "",
    isStreaming: false,
  });
  const [currentToolSteps, setCurrentToolSteps] = useState<ToolStep[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolSteps]);

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
                // Finalize tool steps in the message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, toolSteps: [...currentToolSteps] }
                      : m
                  )
                );
                setCanvas((prev) => ({ ...prev, isStreaming: false }));
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
                } else if (parsed.type === "tool_step_complete") {
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
                }
                // Handle canvas tool use
                else if (parsed.type === "canvas_create") {
                  setCanvas({
                    isOpen: true,
                    title: parsed.title || "Untitled Document",
                    content: "",
                    isStreaming: true,
                  });
                } else if (parsed.type === "canvas_content") {
                  setCanvas((prev) => ({
                    ...prev,
                    content: prev.content + parsed.content,
                  }));
                } else if (parsed.type === "canvas_done") {
                  setCanvas((prev) => ({ ...prev, isStreaming: false }));
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
    }
  };

  const handleCanvasClose = () => {
    setCanvas((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCanvasContentChange = (content: string) => {
    setCanvas((prev) => ({ ...prev, content }));
  };

  const handleCanvasTitleChange = (title: string) => {
    setCanvas((prev) => ({ ...prev, title }));
  };

  return (
    <div style={styles.pageContainer}>
      <div
        style={{
          ...styles.container,
          width: canvas.isOpen ? "50%" : "100%",
        }}
      >
        <header style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🤖</span>
            <h1 style={styles.title}>DeepAgents</h1>
          </div>
          <p style={styles.subtitle}>AI Agent Framework Chat Interface</p>
        </header>

        <main style={styles.main}>
          <div style={styles.chatContainer}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💬</div>
                <h2 style={styles.emptyTitle}>Start a conversation</h2>
                <p style={styles.emptyText}>
                  Ask me anything! I&apos;m powered by Claude and the DeepAgents
                  framework.
                </p>
                <div style={styles.suggestions}>
                  <button
                    style={styles.suggestionBtn}
                    onClick={() =>
                      setInput("What can you help me with?")
                    }
                  >
                    What can you help me with?
                  </button>
                  <button
                    style={styles.suggestionBtn}
                    onClick={() =>
                      setInput("Write me a blog post about AI agents")
                    }
                  >
                    Write a blog post
                  </button>
                  <button
                    style={styles.suggestionBtn}
                    onClick={() => setInput("Create a project proposal for a mobile app")}
                  >
                    Create a proposal
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.messages}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent:
                        message.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...styles.message,
                        ...(message.role === "user"
                          ? styles.userMessage
                          : styles.assistantMessage),
                      }}
                    >
                      {message.role === "assistant" && message.toolSteps && message.toolSteps.length > 0 && (
                        <ToolTimeline steps={message.toolSteps} />
                      )}
                      {message.role === "assistant" ? (
                        <div className="markdown-content">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                    <div style={{ ...styles.message, ...styles.assistantMessage }}>
                      {currentToolSteps.length > 0 ? (
                        <ToolTimeline steps={currentToolSteps} />
                      ) : (
                        <div style={styles.typingIndicator}>
                          <span style={styles.dot}></span>
                          <span style={{ ...styles.dot, animationDelay: "0.2s" }}></span>
                          <span style={{ ...styles.dot, animationDelay: "0.4s" }}></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

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
        </main>
      </div>

      {canvas.isOpen && (
        <div style={styles.canvasWrapper}>
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
      )}

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
    width: "50%",
    height: "100vh",
    position: "sticky",
    top: 0,
  },
  header: {
    padding: "1rem 2rem",
    borderBottom: "1px solid var(--border)",
    textAlign: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
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
