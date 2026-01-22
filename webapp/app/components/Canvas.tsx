"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  // Initialize content when canvas opens or content changes from streaming
  useEffect(() => {
    if (contentRef.current && content) {
      const currentHtml = contentRef.current.innerHTML;
      const newHtml = formatMarkdownToHtml(content);

      // Only update if streaming or if content is different and we haven't initialized
      if (isStreaming || (!isInitializedRef.current && currentHtml !== newHtml)) {
        contentRef.current.innerHTML = newHtml;
        lastSavedContentRef.current = content;
        isInitializedRef.current = true;
      }
    }
  }, [content, isStreaming]);

  // Reset initialization when canvas closes
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
    }
  }, [isOpen]);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback((htmlContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      const markdownContent = convertHtmlToMarkdown(htmlContent);
      if (markdownContent !== lastSavedContentRef.current) {
        onContentChange(markdownContent);
        lastSavedContentRef.current = markdownContent;
      }
      setIsSaving(false);
    }, 500);
  }, [onContentChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleTitleSave = () => {
    onTitleChange(localTitle);
    setIsEditingTitle(false);
  };

  const handleContentInput = () => {
    if (!isStreaming && contentRef.current) {
      triggerAutoSave(contentRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isEditingTitle) {
      e.preventDefault();
      handleTitleSave();
    }
  };

  // Format commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    handleContentInput();
  };

  const handleBold = () => execCommand("bold");
  const handleItalic = () => execCommand("italic");
  const handleUnderline = () => execCommand("underline");
  const handleStrikethrough = () => execCommand("strikeThrough");

  const handleHeading = (level: number) => {
    execCommand("formatBlock", `h${level}`);
  };

  const handleParagraph = () => {
    execCommand("formatBlock", "p");
  };

  const handleBulletList = () => execCommand("insertUnorderedList");
  const handleNumberedList = () => execCommand("insertOrderedList");

  const handleIndent = () => execCommand("indent");
  const handleOutdent = () => execCommand("outdent");

  const handleUndo = () => execCommand("undo");
  const handleRedo = () => execCommand("redo");

  const handleClearFormatting = () => execCommand("removeFormat");

  // Keyboard shortcuts
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          break;
        case "i":
          e.preventDefault();
          handleItalic();
          break;
        case "u":
          e.preventDefault();
          handleUnderline();
          break;
        case "z":
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
          break;
        case "y":
          e.preventDefault();
          handleRedo();
          break;
      }
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
          {isSaving && !isStreaming && (
            <span style={styles.savingIndicator}>Saving...</span>
          )}
        </div>
        <div style={styles.canvasHeaderRight}>
          <button
            style={styles.canvasHeaderBtn}
            onClick={() => {
              if (contentRef.current) {
                const markdown = convertHtmlToMarkdown(contentRef.current.innerHTML);
                navigator.clipboard.writeText(markdown);
              }
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

      {/* Formatting Toolbar */}
      {!isStreaming && (
        <div style={styles.toolbar}>
          <div style={styles.toolbarGroup}>
            <button
              style={styles.toolbarBtn}
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6"></path>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6"></path>
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
              </svg>
            </button>
          </div>

          <div style={styles.toolbarDivider}></div>

          <div style={styles.toolbarGroup}>
            <select
              style={styles.toolbarSelect}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "p") handleParagraph();
                else handleHeading(parseInt(value.replace("h", "")));
                e.target.value = "";
              }}
              defaultValue=""
            >
              <option value="" disabled>Heading</option>
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
          </div>

          <div style={styles.toolbarDivider}></div>

          <div style={styles.toolbarGroup}>
            <button
              style={styles.toolbarBtn}
              onClick={handleBold}
              title="Bold (Ctrl+B)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleItalic}
              title="Italic (Ctrl+I)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleUnderline}
              title="Underline (Ctrl+U)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleStrikethrough}
              title="Strikethrough"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.1 2.6 3.3 3.3"></path>
                <path d="M4 12h16"></path>
                <path d="M6.7 19.1c2.3.6 4.4 1 6.2.9 2.7 0 5.3-.7 5.3-3.6 0-1.5-1.1-2.6-3.3-3.3"></path>
              </svg>
            </button>
          </div>

          <div style={styles.toolbarDivider}></div>

          <div style={styles.toolbarGroup}>
            <button
              style={styles.toolbarBtn}
              onClick={handleBulletList}
              title="Bullet List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <circle cx="3" cy="6" r="1" fill="currentColor"></circle>
                <circle cx="3" cy="12" r="1" fill="currentColor"></circle>
                <circle cx="3" cy="18" r="1" fill="currentColor"></circle>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleNumberedList}
              title="Numbered List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="21" y2="6"></line>
                <line x1="10" y1="12" x2="21" y2="12"></line>
                <line x1="10" y1="18" x2="21" y2="18"></line>
                <text x="2" y="7" fontSize="8" fill="currentColor">1</text>
                <text x="2" y="13" fontSize="8" fill="currentColor">2</text>
                <text x="2" y="19" fontSize="8" fill="currentColor">3</text>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleOutdent}
              title="Decrease Indent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="6" x2="11" y2="6"></line>
                <line x1="21" y1="12" x2="11" y2="12"></line>
                <line x1="21" y1="18" x2="11" y2="18"></line>
                <polyline points="7 8 3 12 7 16"></polyline>
              </svg>
            </button>
            <button
              style={styles.toolbarBtn}
              onClick={handleIndent}
              title="Increase Indent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="6" x2="11" y2="6"></line>
                <line x1="21" y1="12" x2="11" y2="12"></line>
                <line x1="21" y1="18" x2="11" y2="18"></line>
                <polyline points="3 8 7 12 3 16"></polyline>
              </svg>
            </button>
          </div>

          <div style={styles.toolbarDivider}></div>

          <div style={styles.toolbarGroup}>
            <button
              style={styles.toolbarBtn}
              onClick={handleClearFormatting}
              title="Clear Formatting"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        style={{
          ...styles.canvasContent,
          cursor: isStreaming ? "default" : "text",
        }}
        contentEditable={!isStreaming}
        suppressContentEditableWarning
        onInput={handleContentInput}
        onKeyDown={handleEditorKeyDown}
      />
      <div style={styles.canvasFooter}>
        <span style={styles.wordCount}>
          {content.split(/\s+/).filter(Boolean).length} words
        </span>
        {!isStreaming && (
          <span style={styles.editHint}>
            {isSaving ? "Auto-saving..." : "Auto-save enabled"}
          </span>
        )}
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Rich text editor styles */
        [contenteditable] h1 {
          font-size: 1.75em;
          font-weight: 600;
          margin: 0.67em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.75em 0;
        }
        [contenteditable] h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.83em 0;
        }
        [contenteditable] p {
          margin: 0.5em 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        [contenteditable] li {
          margin: 0.25em 0;
        }
        [contenteditable] strong, [contenteditable] b {
          font-weight: 600;
        }
        [contenteditable] em, [contenteditable] i {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
        [contenteditable] strike, [contenteditable] s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}

// Convert markdown to HTML for initial display
function formatMarkdownToHtml(content: string): string {
  let html = content
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    // Lists (basic)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Paragraphs - wrap remaining text in p tags
    .split('\n\n')
    .map(block => {
      if (block.startsWith('<h') || block.startsWith('<li') || block.startsWith('<ul') || block.startsWith('<ol')) {
        return block;
      }
      return block ? `<p>${block.replace(/\n/g, '<br>')}</p>` : '';
    })
    .join('');

  // Wrap consecutive li elements in ul
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  return html || '<p></p>';
}

// Convert HTML back to markdown for storage
function convertHtmlToMarkdown(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(processNode).join('');

    switch (tagName) {
      case 'h1':
        return `# ${children}\n\n`;
      case 'h2':
        return `## ${children}\n\n`;
      case 'h3':
        return `### ${children}\n\n`;
      case 'p':
        return `${children}\n\n`;
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'u':
        return `__${children}__`;
      case 's':
      case 'strike':
        return `~~${children}~~`;
      case 'ul':
      case 'ol':
        return children;
      case 'li':
        return `- ${children}\n`;
      case 'div':
        return `${children}\n`;
      default:
        return children;
    }
  }

  let markdown = Array.from(temp.childNodes).map(processNode).join('');

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return markdown;
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
  savingIndicator: {
    fontSize: "0.75rem",
    color: "var(--muted)",
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
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.5rem 1rem",
    borderBottom: "1px solid var(--border)",
    background: "#1f1f1f",
    flexWrap: "wrap",
  },
  toolbarGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.125rem",
  },
  toolbarDivider: {
    width: "1px",
    height: "24px",
    background: "var(--border)",
    margin: "0 0.5rem",
  },
  toolbarBtn: {
    background: "transparent",
    border: "none",
    color: "var(--foreground)",
    cursor: "pointer",
    padding: "0.375rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  toolbarSelect: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--foreground)",
    padding: "0.25rem 0.5rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    outline: "none",
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
