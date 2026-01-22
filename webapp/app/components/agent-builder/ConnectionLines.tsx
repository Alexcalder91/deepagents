"use client";

import { useAgentBuilder } from "@/app/contexts/AgentBuilderContext";

export default function ConnectionLines() {
  const { agent } = useAgentBuilder();

  if (!agent) return null;

  // Calculate connection points based on panel positions
  // These are relative positions matching the canvas layout
  const agentCenter = { x: 500, y: 400 };
  const triggersBottom = { x: 500, y: 200 };
  const toolsLeft = { x: 700, y: 300 };
  const subagentsLeft = { x: 700, y: 450 };
  const skillsLeft = { x: 700, y: 580 };

  // Create bezier curve path
  const createPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cx1 = from.x + dx * 0.5;
    const cy1 = from.y;
    const cx2 = to.x - dx * 0.5;
    const cy2 = to.y;
    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  };

  // Only show connections if there are items in each panel
  const showTriggerConnection = agent.triggers.length > 0;
  const showToolsConnection = agent.tools.length > 0;
  const showSubagentsConnection = agent.subagents.length > 0;
  const showSkillsConnection = agent.skills.length > 0;

  return (
    <svg
      style={styles.svg}
      width="100%"
      height="100%"
      viewBox="0 0 1000 800"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradient for trigger connection */}
        <linearGradient id="triggerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
        </linearGradient>

        {/* Gradient for tools connection */}
        <linearGradient id="toolsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>

        {/* Gradient for subagents connection */}
        <linearGradient id="subagentsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>

        {/* Gradient for skills connection */}
        <linearGradient id="skillsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Trigger to Agent connection */}
      {showTriggerConnection && (
        <g>
          <path
            d={createPath(triggersBottom, { x: agentCenter.x, y: agentCenter.y - 100 })}
            stroke="url(#triggerGradient)"
            strokeWidth={2}
            strokeDasharray="8 4"
            fill="none"
            className="animate-dash"
          />
          <circle
            cx={agentCenter.x}
            cy={agentCenter.y - 100}
            r={4}
            fill="#ec4899"
          />
        </g>
      )}

      {/* Agent to Tools connection */}
      {showToolsConnection && (
        <g>
          <path
            d={createPath({ x: agentCenter.x + 160, y: agentCenter.y - 30 }, toolsLeft)}
            stroke="url(#toolsGradient)"
            strokeWidth={2}
            strokeDasharray="8 4"
            fill="none"
            className="animate-dash"
          />
          <circle cx={toolsLeft.x} cy={toolsLeft.y} r={4} fill="#10b981" />
        </g>
      )}

      {/* Agent to Subagents connection */}
      {showSubagentsConnection && (
        <g>
          <path
            d={createPath({ x: agentCenter.x + 160, y: agentCenter.y + 30 }, subagentsLeft)}
            stroke="url(#subagentsGradient)"
            strokeWidth={2}
            strokeDasharray="8 4"
            fill="none"
            className="animate-dash"
          />
          <circle
            cx={subagentsLeft.x}
            cy={subagentsLeft.y}
            r={4}
            fill="#3b82f6"
          />
        </g>
      )}

      {/* Agent to Skills connection */}
      {showSkillsConnection && (
        <g>
          <path
            d={createPath({ x: agentCenter.x + 100, y: agentCenter.y + 100 }, skillsLeft)}
            stroke="url(#skillsGradient)"
            strokeWidth={2}
            strokeDasharray="8 4"
            fill="none"
            className="animate-dash"
          />
          <circle cx={skillsLeft.x} cy={skillsLeft.y} r={4} fill="#f59e0b" />
        </g>
      )}
    </svg>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
};
