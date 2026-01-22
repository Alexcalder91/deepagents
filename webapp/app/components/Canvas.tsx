"use client";

import { useState, useRef, useEffect } from "react";

interface CanvasProps {
  content: string;
  title: string;
  isOpen: boolean;
  isStreaming: boolean;
  onClose: () => void;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
}

export default function Canvas({
  content,
  title,
  isOpen,
  isStreaming,
  onClose,
  onContentChange,
  onTitleChange,
}: CanvasProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  if (!isOpen) return null;

  const handleTitleSave = () => {
    onTitleChange(localTitle);
    setIsEditingTitle(false);
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isStreaming) {
      onContentChange(e.currentTarget.innerText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isEditingTitle) {
      e.preventDefault();
      handleTitleSave();
    }
  };

  return (
    <div style={styles.canvasContainer}>
      <div style={styles.canvasHeader}>
        <div style={styles.canvasHeaderLeft}>
          {isEditingTitle ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              style={styles.titleInput}
              autoFocus
            />
          ) : (
            <h2
              style={styles.canvasTitle}
              onClick={() => !isStreaming && setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {title || "Untitled Document"}
            </h2>
          )}
          {isStreaming && (
            <span style={styles.streamingIndicator}>
              <span style={styles.streamingDot}></span>
              Writing...
            </span>
          )}
        </div>
        <div style={styles.canvasHeaderRight}>
          <button
            style={styles.canvasHeaderBtn}
            onClick={() => {
              navigator.clipboard.writeText(content);
            }}
            title="Copy to clipboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button
            style={styles.canvasHeaderBtn}
            onClick={onClose}
            title="Close canvas"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={contentRef}
        style={{
          ...styles.canvasContent,
          cursor: isStreaming ? "default" : "text",
        }}
        contentEditable={!isStreaming}
        suppressContentEditableWarning
        onInput={handleContentInput}
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />
      <div style={styles.canvasFooter}>
        <span style={styles.wordCount}>
          {content.split(/\s+/).filter(Boolean).length} words
        </span>
        {!isStreaming && (
          <span style={styles.editHint}>Click to edit</span>
        )}
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function formatContent(content: string): string {
  // Convert markdown-like content to HTML for display
  // Basic formatting: headers, bold, italic, lists
  let html = content
    .replace(/^### (.+)$/gm, '<h3 style="margin: 1em 0 0.5em; font-size: 1.1em; font-weight: 600;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin: 1em 0 0.5em; font-size: 1.25em; font-weight: 600;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin: 1em 0 0.5em; font-size: 1.5em; font-weight: 600;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin-left: 1.5em;">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left: 1.5em;">$2</li>')
    .replace(/\n/g, '<br>');

  return html;
}

const styles: { [key: string]: React.CSSProperties } = {
  canvasContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#1a1a1a",
    borderLeft: "1px solid var(--border)",
  },
  canvasHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
    background: "#1f1f1f",
  },
  canvasHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  canvasTitle: {
    fontSize: "1rem",
    fontWeight: 500,
    margin: 0,
    cursor: "pointer",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  titleInput: {
    fontSize: "1rem",
    fontWeight: 500,
    background: "var(--card)",
    border: "1px solid var(--accent)",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    color: "var(--foreground)",
    outline: "none",
  },
  streamingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "var(--accent)",
  },
  streamingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--accent)",
    animation: "pulse 1s infinite",
  },
  canvasHeaderRight: {
    display: "flex",
    gap: "0.5rem",
  },
  canvasHeaderBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.5rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  canvasContent: {
    flex: 1,
    padding: "2rem",
    overflowY: "auto",
    fontSize: "1rem",
    lineHeight: 1.8,
    color: "var(--foreground)",
    outline: "none",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  canvasFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 1rem",
    borderTop: "1px solid var(--border)",
    background: "#1f1f1f",
  },
  wordCount: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
  editHint: {
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
};
