import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are DeepAgent, an AI assistant powered by Claude and the DeepAgents framework.

DeepAgents is a Python-based agent framework built on LangChain and LangGraph that enables:
- Intelligent task planning and execution
- Filesystem operations (read, write, edit files)
- Sub-agent delegation for complex tasks
- Middleware-based extensibility
- Integration with multiple LLM providers

You are helpful, knowledgeable, and can assist with:
- General questions and conversations
- Coding and technical problems
- Explaining concepts
- Creative writing
- Analysis and reasoning

## Canvas Tool

You have access to a canvas tool that creates a document-like artifact in a split-screen view. USE THE CANVAS TOOL when the user asks you to create, write, or draft any of the following:

- Blog posts, articles, or essays
- Reports or documentation
- Proposals or plans
- Stories or creative writing
- Emails or letters
- Code files or scripts
- Lists, outlines, or structured content
- Any content that would benefit from being displayed in a dedicated document view

When to use canvas:
- User says "write me...", "create a...", "draft a...", "make a..."
- User asks for any substantial written content (more than a paragraph)
- User requests something that looks like a document or artifact

When NOT to use canvas:
- Simple Q&A or explanations
- Short code snippets in conversation
- Quick answers that fit naturally in chat

To use the canvas, call the create_canvas tool with:
- reasoning: A brief (5-10 word) explanation of why you're using this tool
- title: A descriptive title for the document
- content: The full content to write to the canvas

Write the complete content in one tool call. The content supports basic markdown formatting (headers, bold, italic, lists).

Be concise but thorough. Use markdown formatting when helpful.`;

// Define the canvas tool with reasoning parameter
const tools: Anthropic.Tool[] = [
  {
    name: "create_canvas",
    description:
      "Creates a document canvas in the UI to display long-form content like articles, blog posts, proposals, code files, reports, etc. Use this when the user asks you to write, create, or draft substantial content that would benefit from a dedicated document view.",
    input_schema: {
      type: "object" as const,
      properties: {
        reasoning: {
          type: "string",
          description:
            "A brief (5-10 word) explanation of why you're creating this document. E.g., 'Writing blog post about AI trends' or 'Creating project proposal as requested'",
        },
        title: {
          type: "string",
          description: "The title of the document",
        },
        content: {
          type: "string",
          description:
            "The full content to display in the canvas. Supports markdown formatting.",
        },
      },
      required: ["reasoning", "title", "content"],
    },
  },
];

// Generate a reasoning message for tool usage
function getToolReasoning(toolName: string, input: Record<string, unknown>): string {
  if (toolName === "create_canvas" && input.reasoning) {
    return input.reasoning as string;
  }
  // Default reasoning messages for other tools
  const defaults: Record<string, string> = {
    create_canvas: "Creating document for user request",
  };
  return defaults[toolName] || "Processing request";
}

export async function POST(req: Request) {
  try {
    const { messages, canvasContent } = await req.json();

    // Add canvas context if there's existing content
    let systemPrompt = SYSTEM_PROMPT;
    if (canvasContent) {
      systemPrompt += `\n\n## Current Canvas Content\nThe user has a canvas open with the following content:\n\`\`\`\n${canvasContent}\n\`\`\`\nYou can reference or modify this content if the user asks.`;
    }

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial thinking step
          const thinkingStep = JSON.stringify({
            type: "tool_step",
            id: `step_${Date.now()}`,
            tool: "thinking",
            reasoning: "Analyzing request and planning response",
            status: "running",
          });
          controller.enqueue(encoder.encode(`data: ${thinkingStep}\n\n`));

          // Initial API call with tools
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8192,
            system: systemPrompt,
            tools: tools,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          });

          // Mark thinking as complete
          const thinkingComplete = JSON.stringify({
            type: "tool_step_complete",
            id: `step_${Date.now() - 1}`,
            tool: "thinking",
          });
          controller.enqueue(encoder.encode(`data: ${thinkingComplete}\n\n`));

          // Process the response
          for (const block of response.content) {
            if (block.type === "text") {
              // Stream text content
              const data = JSON.stringify({ content: block.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (block.type === "tool_use" && block.name === "create_canvas") {
              const input = block.input as { reasoning: string; title: string; content: string };
              const stepId = `step_${Date.now()}`;

              // Send tool step start with reasoning
              const toolStep = JSON.stringify({
                type: "tool_step",
                id: stepId,
                tool: "create_canvas",
                reasoning: getToolReasoning("create_canvas", input),
                status: "running",
              });
              controller.enqueue(encoder.encode(`data: ${toolStep}\n\n`));

              // Signal canvas creation
              const createData = JSON.stringify({
                type: "canvas_create",
                title: input.title,
              });
              controller.enqueue(encoder.encode(`data: ${createData}\n\n`));

              // Stream canvas content in chunks for smooth animation
              const content = input.content;
              const chunkSize = 20; // Characters per chunk
              for (let i = 0; i < content.length; i += chunkSize) {
                const chunk = content.slice(i, i + chunkSize);
                const contentData = JSON.stringify({
                  type: "canvas_content",
                  content: chunk,
                });
                controller.enqueue(encoder.encode(`data: ${contentData}\n\n`));
                // Small delay for streaming effect
                await new Promise((resolve) => setTimeout(resolve, 10));
              }

              // Signal canvas completion
              const doneData = JSON.stringify({ type: "canvas_done" });
              controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

              // Mark tool step as complete
              const toolComplete = JSON.stringify({
                type: "tool_step_complete",
                id: stepId,
                tool: "create_canvas",
              });
              controller.enqueue(encoder.encode(`data: ${toolComplete}\n\n`));

              // Send a chat message about the canvas
              const chatData = JSON.stringify({
                content: `I've created "${input.title}" in the canvas. You can view and edit it on the right side of the screen.`,
              });
              controller.enqueue(encoder.encode(`data: ${chatData}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({
            content: "Sorry, there was an error processing your request.",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
