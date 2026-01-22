"use client";

import { useState, useMemo } from "react";
import type { ToolDefinition } from "@/lib/agent-builder/types";

interface ToolPickerProps {
  tools: ToolDefinition[];
  onSelect: (tool: ToolDefinition) => void;
  onClose: () => void;
}

export default function ToolPicker({ tools, onSelect, onClose }: ToolPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = [...new Set(tools.map((t) => t.category))];
    return cats.sort();
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !selectedCategory || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tools, search, selectedCategory]);

  const groupedTools = useMemo(() => {
    const groups: Record<string, ToolDefinition[]> = {};
    filteredTools.forEach((tool) => {
      if (!groups[tool.category]) {
        groups[tool.category] = [];
      }
      groups[tool.category].push(tool);
    });
    return groups;
  }, [filteredTools]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Add Tool</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.searchContainer}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={styles.searchIcon}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            style={styles.searchInput}
            autoFocus
          />
        </div>

        <div style={styles.categories}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              ...styles.categoryButton,
              ...(selectedCategory === null ? styles.activeCategoryButton : {}),
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === cat ? styles.activeCategoryButton : {}),
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.toolList}>
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category} style={styles.categoryGroup}>
              <h4 style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>
              {categoryTools.map((tool) => (
                <div
                  key={tool.name}
                  style={styles.toolItem}
                  onClick={() => onSelect(tool)}
                >
                  <div style={styles.toolIcon}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <div style={styles.toolInfo}>
                    <span style={styles.toolName}>{tool.name}</span>
                    <span style={styles.toolDescription}>
                      {tool.description.length > 80
                        ? tool.description.substring(0, 80) + "..."
                        : tool.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {filteredTools.length === 0 && (
            <p style={styles.emptyText}>No tools found</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    width: "480px",
    maxHeight: "70vh",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "transparent",
    color: "var(--muted)",
    cursor: "pointer",
  },
  searchContainer: {
    position: "relative",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
  },
  searchIcon: {
    position: "absolute",
    left: "1.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--muted)",
  },
  searchInput: {
    width: "100%",
    padding: "0.5rem 0.5rem 0.5rem 2.5rem",
    background: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--foreground)",
    fontSize: "0.875rem",
    outline: "none",
  },
  categories: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border)",
    overflowX: "auto",
  },
  categoryButton: {
    padding: "0.375rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: "0.75rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  activeCategoryButton: {
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "white",
  },
  toolList: {
    flex: 1,
    overflowY: "auto",
    padding: "0.5rem",
  },
  categoryGroup: {
    marginBottom: "0.5rem",
  },
  categoryTitle: {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "0.5rem",
    margin: 0,
  },
  toolItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "0.75rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  toolIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "var(--accent)",
    color: "white",
    flexShrink: 0,
  },
  toolInfo: {
    flex: 1,
    minWidth: 0,
  },
  toolName: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginBottom: "0.25rem",
  },
  toolDescription: {
    display: "block",
    fontSize: "0.75rem",
    color: "var(--muted)",
    lineHeight: 1.4,
  },
  emptyText: {
    textAlign: "center",
    color: "var(--muted)",
    padding: "2rem",
    margin: 0,
  },
};
