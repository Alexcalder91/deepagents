import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/prompt-config - Get the active prompt config
export async function GET() {
  try {
    let config = await prisma.promptConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    // If no config exists, create a default one
    if (!config) {
      config = await prisma.promptConfig.create({
        data: {
          systemPrompt: "",
          customInstructs: "",
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      systemPrompt: config.systemPrompt,
      customInstructs: config.customInstructs,
      isActive: config.isActive,
      createdAt: config.createdAt.getTime(),
      updatedAt: config.updatedAt.getTime(),
    });
  } catch (error) {
    console.error("Error fetching prompt config:", error);
    return NextResponse.json({ error: "Failed to fetch prompt config" }, { status: 500 });
  }
}

// PUT /api/prompt-config - Update the prompt config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemPrompt, customInstructs } = body;

    // Find or create the active config
    let config = await prisma.promptConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    const updateData: { systemPrompt?: string; customInstructs?: string } = {};
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (customInstructs !== undefined) updateData.customInstructs = customInstructs;

    if (config) {
      config = await prisma.promptConfig.update({
        where: { id: config.id },
        data: updateData,
      });
    } else {
      config = await prisma.promptConfig.create({
        data: {
          systemPrompt: systemPrompt || "",
          customInstructs: customInstructs || "",
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      systemPrompt: config.systemPrompt,
      customInstructs: config.customInstructs,
      isActive: config.isActive,
      createdAt: config.createdAt.getTime(),
      updatedAt: config.updatedAt.getTime(),
    });
  } catch (error) {
    console.error("Error updating prompt config:", error);
    return NextResponse.json({ error: "Failed to update prompt config" }, { status: 500 });
  }
}
