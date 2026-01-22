"use client";

import ReactMarkdown from "react-markdown";

interface CanvasPreviewProps {
  title: string;
  content: string;
  onOpen: () => void;
}

export default function CanvasPreview({ title, content, onOpen }: CanvasPreviewProps) {
  // Get first ~200 characters for preview, try to break at a word boundary
  const getPreviewContent = () => {
    if (content.length <= 200) return content;
    const truncated = content.slice(0, 200);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 150 ? truncated.slice(0, lastSpace) : truncated) + "...";
  };

  return (
    <div style={styles.container} className="canvas-preview" onClick={onOpen}>
      <div style={styles.header}>
        <div style={styles.iconWrapper}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <span style={styles.title}>{title}</span>
        <button style={styles.moreButton} onClick={(e) => e.stopPropagation()}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>

      <div style={styles.preview}>
        <div style={styles.previewContent} className="markdown-content">
          <ReactMarkdown>{getPreviewContent()}</ReactMarkdown>
        </div>
        <div style={styles.fadeOverlay} />
      </div>

      <div style={styles.footer}>
        <span style={styles.clickHint}>Click to open</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={styles.expandIcon}
        >
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "0.75rem",
    maxWidth: "500px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  iconWrapper: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #4285f4 0%, #5a9cf4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  title: {
    flex: 1,
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--foreground)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  moreButton: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
    transition: "opacity 0.2s",
  },
  preview: {
    position: "relative",
    padding: "0.75rem 1rem",
    maxHeight: "150px",
    overflow: "hidden",
  },
  previewContent: {
    fontSize: "0.8rem",
    lineHeight: 1.5,
    color: "var(--muted)",
  },
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40px",
    background: "linear-gradient(transparent, var(--card))",
    pointerEvents: "none",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 1rem",
    borderTop: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  clickHint: {
    fontSize: "0.7rem",
    color: "var(--muted)",
    opacity: 0.7,
  },
  expandIcon: {
    color: "var(--muted)",
    opacity: 0.5,
  },
};
