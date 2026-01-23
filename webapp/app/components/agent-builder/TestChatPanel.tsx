"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";

export default function TestChatPanel() {
  const {
    agent,
    testMessages,
    isTestRunning,
    sendTestMessage,
    clearTestChat,
  } = useAgentBuilder();

  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  if (!agent) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = inputValue.trim();
    if (!message || isTestRunning) return;

    setInputValue("");
    await sendTestMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={styles.expandButton}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <span style={styles.title}>TEST CHAT</span>
          {isTestRunning && <span style={styles.runningIndicator} />}
        </div>
        <button
          onClick={clearTestChat}
          style={styles.clearButton}
          title="Clear chat"
          disabled={testMessages.length === 0}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Messages */}
          <div style={styles.messagesContainer}>
            {testMessages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p style={styles.emptyTitle}>Test your agent</p>
                <p style={styles.emptyText}>
                  Send a message to see how your agent responds with its current
                  configuration.
                </p>
              </div>
            ) : (
              <div style={styles.messages}>
                {testMessages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.message,
                      ...(message.role === "user"
                        ? styles.userMessage
                        : styles.assistantMessage),
                    }}
                  >
                    <div style={styles.messageHeader}>
                      <span style={styles.messageRole}>
                        {message.role === "user" ? "You" : agent.name}
                      </span>
                      <span style={styles.messageTime}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div style={styles.messageContent}>{message.content}</div>

                    {/* Tool Steps */}
                    {message.toolSteps && message.toolSteps.length > 0 && (
                      <div style={styles.toolSteps}>
                        {message.toolSteps.map((step) => (
                          <div key={step.id} style={styles.toolStep}>
                            <div style={styles.toolStepHeader}>
                              <span
                                style={{
                                  ...styles.toolStepStatus,
                                  ...(step.status === "running"
                                    ? styles.statusRunning
                                    : step.status === "complete"
                                    ? styles.statusComplete
                                    : styles.statusError),
                                }}
                              >
                                {step.status === "running" && (
                                  <span style={styles.statusSpinner} />
                                )}
                                {step.status === "complete" && "✓"}
                                {step.status === "error" && "✗"}
                              </span>
                              <span style={styles.toolName}>{step.tool}</span>
                            </div>
                            {step.reasoning && (
                              <p style={styles.toolReasoning}>{step.reasoning}</p>
                            )}
                            {step.output && (
                              <pre style={styles.toolOutput}>
                                {typeof step.output === "string"
                                  ? step.output.slice(0, 200)
                                  : JSON.stringify(step.output, null, 2).slice(
                                      0,
                                      200
                                    )}
                                {(step.output?.length || 0) > 200 && "..."}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={styles.inputContainer}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a test message..."
              style={styles.input}
              rows={1}
              disabled={isTestRunning}
            />
            <button
              type="submit"
              style={{
                ...styles.sendButton,
                opacity: !inputValue.trim() || isTestRunning ? 0.5 : 1,
              }}
              disabled={!inputValue.trim() || isTestRunning}
            >
              {isTestRunning ? (
                <span style={styles.buttonSpinner} />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "320px",
    minWidth: "320px",
    background: "var(--card)",
    borderRight: "1px solid var(--border)",
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
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  expandButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    borderRadius: "4px",
  },
  title: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "var(--muted)",
    letterSpacing: "0.05em",
  },
  runningIndicator: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  clearButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--muted)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  messagesContainer: {
    flex: 1,
    overflow: "auto",
    padding: "1rem",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: "2rem",
  },
  emptyIcon: {
    color: "var(--muted)",
    marginBottom: "1rem",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "var(--foreground)",
    margin: "0 0 0.5rem 0",
  },
  emptyText: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    margin: 0,
    lineHeight: 1.5,
  },
  messages: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  message: {
    padding: "0.75rem",
    borderRadius: "8px",
  },
  userMessage: {
    background: "rgba(99, 102, 241, 0.1)",
    marginLeft: "1rem",
  },
  assistantMessage: {
    background: "var(--background)",
    marginRight: "1rem",
  },
  messageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.375rem",
  },
  messageRole: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  messageTime: {
    fontSize: "0.65rem",
    color: "var(--muted)",
  },
  messageContent: {
    fontSize: "0.85rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  toolSteps: {
    marginTop: "0.75rem",
    paddingTop: "0.75rem",
    borderTop: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  toolStep: {
    padding: "0.5rem",
    background: "var(--card)",
    borderRadius: "6px",
    border: "1px solid var(--border)",
  },
  toolStepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  toolStepStatus: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    fontSize: "0.65rem",
    fontWeight: 600,
  },
  statusRunning: {
    background: "rgba(99, 102, 241, 0.2)",
    color: "var(--accent)",
  },
  statusComplete: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#10b981",
  },
  statusError: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
  },
  statusSpinner: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    border: "1.5px solid currentColor",
    borderRightColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  toolName: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--foreground)",
  },
  toolReasoning: {
    fontSize: "0.7rem",
    color: "var(--muted)",
    margin: "0.25rem 0 0 0",
    fontStyle: "italic",
  },
  toolOutput: {
    fontSize: "0.65rem",
    color: "var(--muted)",
    background: "var(--background)",
    padding: "0.375rem",
    borderRadius: "4px",
    margin: "0.375rem 0 0 0",
    overflow: "auto",
    maxHeight: "80px",
    fontFamily: "monospace",
  },
  inputContainer: {
    display: "flex",
    alignItems: "flex-end",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderTop: "1px solid var(--border)",
  },
  input: {
    flex: 1,
    minHeight: "36px",
    maxHeight: "120px",
    padding: "0.5rem 0.75rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
    fontSize: "0.85rem",
    lineHeight: 1.4,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
  },
  sendButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "var(--accent)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  buttonSpinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid currentColor",
    borderRightColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
};
