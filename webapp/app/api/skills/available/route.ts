import { NextResponse } from "next/server";

// GET /api/skills/available - Get all available skills
export async function GET() {
  try {
    // For now, return an empty array
    // In the future, this can scan for SKILL.md files in the codebase
    const skills: {
      path: string;
      name: string;
      description: string;
      allowedTools?: string[];
    }[] = [];

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching available skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch available skills" },
      { status: 500 }
    );
  }
}
