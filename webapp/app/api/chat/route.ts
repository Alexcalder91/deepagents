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

Be concise but thorough. Use markdown formatting when helpful.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = JSON.stringify({ content: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
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
