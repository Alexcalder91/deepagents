"use client";

import { useRef, useCallback, useState } from "react";
import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";
import AgentNode from "./AgentNode";
import ToolsPanel from "./ToolsPanel";
import SubagentsPanel from "./SubagentsPanel";
import SkillsPanel from "./SkillsPanel";
import TriggersPanel from "./TriggersPanel";
import ConnectionLines from "./ConnectionLines";

export default function AgentBuilderCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { zoom, pan, setZoom, setPan, selectNode } = useAgentBuilder();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle zoom with mouse wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    },
    [zoom, setZoom]
  );

  // Handle pan with mouse drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan if clicking on the canvas background
      if (e.target === canvasRef.current || e.target === e.currentTarget) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        selectNode(null, null);
      }
    },
    [pan, selectNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, setPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={canvasRef}
      style={styles.canvas}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid background */}
      <div style={styles.gridBackground} />

      {/* Canvas viewport with transform */}
      <div
        style={{
          ...styles.viewport,
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
        }}
      >
        {/* SVG layer for connection lines */}
        <ConnectionLines />

        {/* Triggers Panel (top) */}
        <div style={styles.triggersArea}>
          <TriggersPanel />
        </div>

        {/* Central Agent Node */}
        <div style={styles.agentArea}>
          <AgentNode />
        </div>

        {/* Tools Panel (right) */}
        <div style={styles.toolsArea}>
          <ToolsPanel />
        </div>

        {/* Subagents Panel (right, below tools) */}
        <div style={styles.subagentsArea}>
          <SubagentsPanel />
        </div>

        {/* Skills Panel (bottom right) */}
        <div style={styles.skillsArea}>
          <SkillsPanel />
        </div>
      </div>

      {/* Zoom controls */}
      <div style={styles.zoomControls}>
        <button onClick={handleZoomOut} style={styles.zoomButton} title="Zoom out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} style={styles.zoomButton} title="Zoom in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button onClick={handleZoomReset} style={styles.zoomButton} title="Reset zoom">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  canvas: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    cursor: "grab",
    background: "#0a0a0a",
  },
  gridBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  viewport: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transformOrigin: "center center",
  },
  triggersArea: {
    position: "absolute",
    top: "80px",
    left: "50%",
    transform: "translateX(-50%)",
  },
  agentArea: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  toolsArea: {
    position: "absolute",
    top: "30%",
    right: "80px",
  },
  subagentsArea: {
    position: "absolute",
    top: "55%",
    right: "80px",
  },
  skillsArea: {
    position: "absolute",
    bottom: "100px",
    right: "80px",
  },
  zoomControls: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    zIndex: 100,
  },
  zoomButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "4px",
    border: "none",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  zoomLabel: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    minWidth: "40px",
    textAlign: "center",
  },
};
