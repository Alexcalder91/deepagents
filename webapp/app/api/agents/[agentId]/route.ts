import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/agents/[agentId] - Get agent by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        tools: true,
        subagents: true,
        skills: true,
        triggers: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[agentId] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();

    const {
      name,
      description,
      instructions,
      model,
      isActive,
      canvasState,
      tools,
      subagents,
      skills,
      triggers,
    } = body;

    // Update agent with nested relations
    const agent = await prisma.$transaction(async (tx) => {
      // Update base agent fields
      const updatedAgent = await tx.agent.update({
        where: { id: agentId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(instructions !== undefined && { instructions }),
          ...(model !== undefined && { model }),
          ...(isActive !== undefined && { isActive }),
          ...(canvasState !== undefined && { canvasState }),
        },
      });

      // Update tools if provided
      if (tools !== undefined) {
        // Delete existing tools
        await tx.agentTool.deleteMany({ where: { agentId } });

        // Create new tools
        if (tools.length > 0) {
          await tx.agentTool.createMany({
            data: tools.map((tool: Record<string, unknown>) => ({
              agentId,
              toolType: tool.toolType as string,
              toolName: tool.toolName as string,
              toolConfig: tool.toolConfig ?? null,
              requiresReview: (tool.requiresReview as boolean) || false,
              reviewDestination: (tool.reviewDestination as string) || null,
              reviewConfig: tool.reviewConfig ?? null,
              positionX: (tool.positionX as number) || 0,
              positionY: (tool.positionY as number) || 0,
            })),
          });
        }
      }

      // Update subagents if provided
      if (subagents !== undefined) {
        await tx.agentSubagent.deleteMany({ where: { agentId } });

        if (subagents.length > 0) {
          await tx.agentSubagent.createMany({
            data: subagents.map((sa: Record<string, unknown>) => ({
              agentId,
              name: sa.name as string,
              description: sa.description as string,
              systemPrompt: sa.systemPrompt as string,
              model: (sa.model as string) || null,
              toolIds: (sa.toolIds as string[]) || [],
              positionX: (sa.positionX as number) || 0,
              positionY: (sa.positionY as number) || 0,
            })),
          });
        }
      }

      // Update skills if provided
      if (skills !== undefined) {
        await tx.agentSkill.deleteMany({ where: { agentId } });

        if (skills.length > 0) {
          await tx.agentSkill.createMany({
            data: skills.map((skill: Record<string, unknown>) => ({
              agentId,
              skillPath: skill.skillPath as string,
              skillName: skill.skillName as string,
              skillDescription: (skill.skillDescription as string) || null,
              positionX: (skill.positionX as number) || 0,
              positionY: (skill.positionY as number) || 0,
            })),
          });
        }
      }

      // Update triggers if provided
      if (triggers !== undefined) {
        await tx.agentTrigger.deleteMany({ where: { agentId } });

        if (triggers.length > 0) {
          await tx.agentTrigger.createMany({
            data: triggers.map((trigger: Record<string, unknown>) => ({
              agentId,
              triggerType: trigger.triggerType as string,
              name: trigger.name as string,
              description: (trigger.description as string) || null,
              config: trigger.config as Record<string, unknown>,
              isEnabled: (trigger.isEnabled as boolean) ?? true,
              positionX: (trigger.positionX as number) || 0,
              positionY: (trigger.positionY as number) || 0,
            })),
          });
        }
      }

      return updatedAgent;
    });

    // Fetch the complete agent with relations
    const fullAgent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        tools: true,
        subagents: true,
        skills: true,
        triggers: true,
      },
    });

    return NextResponse.json(fullAgent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[agentId] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    await prisma.agent.delete({
      where: { id: agentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
