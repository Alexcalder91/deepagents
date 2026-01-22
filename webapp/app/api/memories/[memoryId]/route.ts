import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/memories/[memoryId] - Get a specific memory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;

    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: memory.id,
      name: memory.name,
      content: memory.content,
      createdAt: memory.createdAt.getTime(),
      updatedAt: memory.updatedAt.getTime(),
    });
  } catch (error) {
    console.error("Error fetching memory:", error);
    return NextResponse.json({ error: "Failed to fetch memory" }, { status: 500 });
  }
}

// PUT /api/memories/[memoryId] - Update a specific memory
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const body = await request.json();
    const { name, content } = body;

    const updateData: { name?: string; content?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;

    const memory = await prisma.memory.update({
      where: { id: memoryId },
      data: updateData,
    });

    return NextResponse.json({
      id: memory.id,
      name: memory.name,
      content: memory.content,
      createdAt: memory.createdAt.getTime(),
      updatedAt: memory.updatedAt.getTime(),
    });
  } catch (error) {
    console.error("Error updating memory:", error);
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
  }
}

// DELETE /api/memories/[memoryId] - Delete a specific memory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;

    await prisma.memory.delete({
      where: { id: memoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
