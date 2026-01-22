import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

// GET /api/chats - Get all chats
export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform to match frontend interface
    const transformedChats = chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.getTime(),
      updatedAt: chat.updatedAt.getTime(),
      messages: chat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        toolSteps: msg.toolSteps,
        canvas: msg.canvas,
      })),
    }));

    return NextResponse.json(transformedChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// POST /api/chats - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title = "New Chat" } = body;

    const chat = await prisma.chat.create({
      data: { title },
      include: { messages: true },
    });

    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.getTime(),
      updatedAt: chat.updatedAt.getTime(),
      messages: [],
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
