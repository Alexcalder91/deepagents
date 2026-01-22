import { NextResponse } from "next/server";
import { BUILTIN_TOOLS } from "@/lib/tools/definitions";

// GET /api/tools/available - Get all available tools
export async function GET() {
  try {
    // For now, return builtin tools
    // In the future, this can be extended to include MCP tools
    return NextResponse.json(BUILTIN_TOOLS);
  } catch (error) {
    console.error("Error fetching available tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch available tools" },
      { status: 500 }
    );
  }
}
