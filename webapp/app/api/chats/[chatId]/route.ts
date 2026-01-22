import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// GET /api/chats/[chatId] - Get a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

// PUT /api/chats/[chatId] - Update a chat (title and/or messages)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const body = await request.json();
    const { title, messages } = body;

    // Update chat title if provided
    if (title !== undefined) {
      await prisma.chat.update({
        where: { id: chatId },
        data: { title },
      });
    }

    // Update messages if provided
    if (messages !== undefined) {
      // Delete existing messages and recreate them
      await prisma.message.deleteMany({
        where: { chatId },
      });

      if (messages.length > 0) {
        await prisma.message.createMany({
          data: messages.map((msg: { id: string; role: string; content: string; toolSteps?: unknown; canvas?: unknown }) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            chatId,
            toolSteps: msg.toolSteps || null,
            canvas: msg.canvas || null,
          })),
        });
      }

      // Update the chat's updatedAt timestamp
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    }

    // Fetch and return updated chat
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!updatedChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedChat.id,
      title: updatedChat.title,
      createdAt: updatedChat.createdAt.getTime(),
      updatedAt: updatedChat.updatedAt.getTime(),
      messages: updatedChat.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        toolSteps: msg.toolSteps,
        canvas: msg.canvas,
      })),
    });
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json({ error: "Failed to update chat" }, { status: 500 });
  }
}

// DELETE /api/chats/[chatId] - Delete a chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
