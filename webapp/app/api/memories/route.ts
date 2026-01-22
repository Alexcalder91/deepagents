import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/memories - Get all memories
export async function GET() {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // Transform to match frontend interface
    const transformedMemories = memories.map((memory) => ({
      id: memory.id,
      name: memory.name,
      content: memory.content,
      createdAt: memory.createdAt.getTime(),
      updatedAt: memory.updatedAt.getTime(),
    }));

    return NextResponse.json(transformedMemories);
  } catch (error) {
    console.error("Error fetching memories:", error);
    return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
  }
}

// POST /api/memories - Create a new memory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const memory = await prisma.memory.create({
      data: {
        name,
        content: content || "",
      },
    });

    return NextResponse.json({
      id: memory.id,
      name: memory.name,
      content: memory.content,
      createdAt: memory.createdAt.getTime(),
      updatedAt: memory.updatedAt.getTime(),
    });
  } catch (error) {
    console.error("Error creating memory:", error);
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
  }
}

// PUT /api/memories - Update a memory (batch update all memories)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { memories } = body;

    if (!Array.isArray(memories)) {
      return NextResponse.json({ error: "Memories array is required" }, { status: 400 });
    }

    // Delete all existing memories and recreate
    await prisma.memory.deleteMany({});

    if (memories.length > 0) {
      await prisma.memory.createMany({
        data: memories.map((memory: { id?: string; name: string; content: string }) => ({
          id: memory.id,
          name: memory.name,
          content: memory.content,
        })),
      });
    }

    // Fetch and return all memories
    const updatedMemories = await prisma.memory.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      updatedMemories.map((memory) => ({
        id: memory.id,
        name: memory.name,
        content: memory.content,
        createdAt: memory.createdAt.getTime(),
        updatedAt: memory.updatedAt.getTime(),
      }))
    );
  } catch (error) {
    console.error("Error updating memories:", error);
    return NextResponse.json({ error: "Failed to update memories" }, { status: 500 });
  }
}
