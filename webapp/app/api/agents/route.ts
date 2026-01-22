import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/agents - Get all agents
export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        tools: true,
        subagents: true,
        skills: true,
        triggers: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name = "New Agent", description = "", instructions = "" } = body;

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        instructions,
      },
      include: {
        tools: true,
        subagents: true,
        skills: true,
        triggers: true,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
