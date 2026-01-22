import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { glob } from "glob";

const execAsync = promisify(exec);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Memory system prompt - based on DeepAgents framework
const MEMORY_SYSTEM_PROMPT = `## Memory System

You have access to a persistent memory file that stores information across conversations. Use this to remember:
- User preferences and context
- Important facts about the user
- Ongoing projects or tasks
- Decisions made in previous conversations
- Anything the user asks you to remember

### When to update memory:
- User explicitly asks you to remember something
- You learn important context about the user (name, preferences, goals)
- A significant decision is made that should be recalled later
- User shares project details, deadlines, or requirements
- Any information that would be valuable in future conversations

### Memory file format:
The memory file (AGENTS.md) uses markdown with sections:
- **User Context**: Name, preferences, communication style
- **Projects**: Ongoing work, goals, deadlines
- **Decisions**: Important choices made
- **Notes**: Miscellaneous remembered information

To update memory, use the edit_file tool with path "AGENTS.md".
To read current memory, use the read_file tool with path "AGENTS.md".

Always check memory at the start of conversations when relevant context might exist.`;

// Default system prompt - can be overridden by client config
const DEFAULT_SYSTEM_PROMPT = `You are DeepAgent, an AI assistant powered by Claude and the DeepAgents framework.

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

const DEFAULT_CANVAS_TOOL_DESCRIPTION = `Creates a document canvas in the UI to display long-form content like articles, blog posts, proposals, code files, reports, etc. Use this when the user asks you to write, create, or draft substantial content that would benefit from a dedicated document view.`;

// Extended prompt config interface
interface ExtendedPromptConfig {
  systemPrompt?: string;
  canvasToolDescription?: string;
  // Filesystem tool descriptions
  listFilesDescription?: string;
  readFileDescription?: string;
  writeFileDescription?: string;
  editFileDescription?: string;
  globDescription?: string;
  grepDescription?: string;
  executeDescription?: string;
  // System prompts
  filesystemSystemPrompt?: string;
  executionSystemPrompt?: string;
  // Subagent config
  taskToolDescription?: string;
  taskSystemPrompt?: string;
  defaultSubagentPrompt?: string;
  // Feature prompts
  skillsSystemPrompt?: string;
  memorySystemPrompt?: string;
}

// Default tool descriptions
const DEFAULT_TOOL_DESCRIPTIONS = {
  listFiles: `Lists all files in a directory. Use this to explore the filesystem and find files.`,
  readFile: `Read the contents of a file from the filesystem. Can read both memory files (like AGENTS.md) and actual filesystem files.`,
  writeFile: `Write content to a new file. Use for creating new files. Prefer edit_file for existing files.`,
  editFile: `Create or update a file. Use this to save information or modify existing files.`,
  glob: `Find files matching a glob pattern. Supports patterns like **/*.py, *.txt, etc.`,
  grep: `Search for text patterns across files. Returns matching files or content.`,
  execute: `Execute a shell command. Returns stdout, stderr, and exit code.`,
  task: `Launch a subagent to handle a complex task. The subagent runs autonomously and returns results.`,
};

// Create tools with configurable descriptions
function createTools(config: ExtendedPromptConfig = {}): Anthropic.Tool[] {
  return [
    {
      name: "create_canvas",
      description: config.canvasToolDescription || DEFAULT_CANVAS_TOOL_DESCRIPTION,
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
    {
      name: "ls",
      description: config.listFilesDescription || DEFAULT_TOOL_DESCRIPTIONS.listFiles,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're listing this directory.",
          },
          path: {
            type: "string",
            description: "The directory path to list. Defaults to current working directory.",
          },
        },
        required: ["reasoning"],
      },
    },
    {
      name: "read_file",
      description: config.readFileDescription || DEFAULT_TOOL_DESCRIPTIONS.readFile,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're reading this file.",
          },
          path: {
            type: "string",
            description: "The path to the file to read.",
          },
          offset: {
            type: "number",
            description: "Line number to start reading from (1-indexed). Optional.",
          },
          limit: {
            type: "number",
            description: "Maximum number of lines to read. Optional, defaults to 100.",
          },
        },
        required: ["reasoning", "path"],
      },
    },
    {
      name: "write_file",
      description: config.writeFileDescription || DEFAULT_TOOL_DESCRIPTIONS.writeFile,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're writing this file.",
          },
          path: {
            type: "string",
            description: "The path to the file to create.",
          },
          content: {
            type: "string",
            description: "The content to write to the file.",
          },
        },
        required: ["reasoning", "path", "content"],
      },
    },
    {
      name: "edit_file",
      description: config.editFileDescription || DEFAULT_TOOL_DESCRIPTIONS.editFile,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're editing this file.",
          },
          path: {
            type: "string",
            description: "The path to the file to edit.",
          },
          content: {
            type: "string",
            description: "The new content for the file.",
          },
          old_string: {
            type: "string",
            description: "For partial edits: the string to replace. If not provided, replaces entire file.",
          },
          new_string: {
            type: "string",
            description: "For partial edits: the replacement string.",
          },
        },
        required: ["reasoning", "path"],
      },
    },
    {
      name: "glob",
      description: config.globDescription || DEFAULT_TOOL_DESCRIPTIONS.glob,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're searching for these files.",
          },
          pattern: {
            type: "string",
            description: "The glob pattern to match (e.g., '**/*.py', '*.txt').",
          },
          path: {
            type: "string",
            description: "Base directory for the search. Defaults to current directory.",
          },
        },
        required: ["reasoning", "pattern"],
      },
    },
    {
      name: "grep",
      description: config.grepDescription || DEFAULT_TOOL_DESCRIPTIONS.grep,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're searching for this pattern.",
          },
          pattern: {
            type: "string",
            description: "The text pattern to search for.",
          },
          path: {
            type: "string",
            description: "File or directory to search in. Defaults to current directory.",
          },
          glob_pattern: {
            type: "string",
            description: "Optional glob pattern to filter files (e.g., '*.py').",
          },
          output_mode: {
            type: "string",
            enum: ["files_with_matches", "content", "count"],
            description: "Output mode: 'files_with_matches' (default), 'content', or 'count'.",
          },
        },
        required: ["reasoning", "pattern"],
      },
    },
    {
      name: "execute",
      description: config.executeDescription || DEFAULT_TOOL_DESCRIPTIONS.execute,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're executing this command.",
          },
          command: {
            type: "string",
            description: "The shell command to execute.",
          },
          cwd: {
            type: "string",
            description: "Working directory for the command. Optional.",
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds. Defaults to 30000 (30 seconds).",
          },
        },
        required: ["reasoning", "command"],
      },
    },
    {
      name: "task",
      description: config.taskToolDescription || DEFAULT_TOOL_DESCRIPTIONS.task,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "A brief explanation of why you're launching this subagent.",
          },
          description: {
            type: "string",
            description: "A short (3-5 word) description of the task.",
          },
          prompt: {
            type: "string",
            description: "Detailed instructions for the subagent. Be specific about expected output.",
          },
          subagent_type: {
            type: "string",
            enum: ["general-purpose", "explore", "research"],
            description: "Type of subagent to use. Defaults to 'general-purpose'.",
          },
        },
        required: ["reasoning", "description", "prompt"],
      },
    },
  ];
}

// Generate a reasoning message for tool usage
function getToolReasoning(toolName: string, input: Record<string, unknown>): string {
  if (input.reasoning) {
    return input.reasoning as string;
  }
  // Default reasoning messages for other tools
  const defaults: Record<string, string> = {
    create_canvas: "Creating document for user request",
    read_file: "Reading file",
    write_file: "Writing file",
    edit_file: "Editing file",
    ls: "Listing directory",
    glob: "Finding files",
    grep: "Searching for pattern",
    execute: "Executing command",
    task: "Launching subagent",
  };
  return defaults[toolName] || "Processing request";
}

// Sandbox base directory - files are sandboxed to this directory
const SANDBOX_BASE = process.env.SANDBOX_DIR || process.cwd();

// Helper to resolve and validate paths within sandbox
function resolveSandboxPath(inputPath: string): string {
  // Handle memory files specially
  if (inputPath === "AGENTS.md" || inputPath.startsWith("memory/")) {
    return inputPath;
  }

  // Normalize the path
  let normalizedPath = inputPath;
  if (!path.isAbsolute(inputPath)) {
    normalizedPath = path.join(SANDBOX_BASE, inputPath);
  }

  // Resolve to absolute path
  const resolvedPath = path.resolve(normalizedPath);

  // Security check: ensure path is within sandbox
  if (!resolvedPath.startsWith(SANDBOX_BASE)) {
    throw new Error(`Path "${inputPath}" is outside the sandbox directory`);
  }

  return resolvedPath;
}

// Helper to execute filesystem operations
async function executeFilesystemOp(
  op: string,
  params: Record<string, unknown>,
  memoryFiles: MemoryFiles
): Promise<{ result: string; memoryUpdate?: { path: string; content: string } }> {
  const inputPath = params.path as string || ".";

  // Check if this is a memory file operation
  if (inputPath === "AGENTS.md" || inputPath.startsWith("memory/")) {
    switch (op) {
      case "read": {
        const content = memoryFiles[inputPath];
        if (content) {
          return { result: `File content:\n${content}` };
        }
        return { result: `File "${inputPath}" does not exist yet.` };
      }
      case "write":
      case "edit": {
        const content = params.content as string;
        if (!content && !params.old_string) {
          return { result: `Error: content is required for ${op}` };
        }

        // Handle partial edits
        if (params.old_string && params.new_string !== undefined) {
          const existingContent = memoryFiles[inputPath] || "";
          const oldStr = params.old_string as string;
          const newStr = params.new_string as string;
          if (!existingContent.includes(oldStr)) {
            return { result: `Error: old_string not found in file` };
          }
          const newContent = existingContent.replace(oldStr, newStr);
          return {
            result: `Updated ${inputPath} (${newContent.length} characters)`,
            memoryUpdate: { path: inputPath, content: newContent },
          };
        }

        return {
          result: `${op === "write" ? "Created" : "Updated"} ${inputPath} (${content.length} characters)`,
          memoryUpdate: { path: inputPath, content },
        };
      }
      case "ls": {
        const files = Object.keys(memoryFiles);
        if (files.length === 0) {
          return { result: "No memory files exist yet." };
        }
        return { result: `Memory files:\n${files.join("\n")}` };
      }
      default:
        return { result: `Operation "${op}" not supported for memory files` };
    }
  }

  // Real filesystem operations
  try {
    const resolvedPath = resolveSandboxPath(inputPath);

    switch (op) {
      case "ls": {
        const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
        const formatted = entries.map((e) => {
          const type = e.isDirectory() ? "d" : e.isFile() ? "f" : "?";
          return `[${type}] ${e.name}`;
        });
        return { result: `Contents of ${inputPath}:\n${formatted.join("\n")}` };
      }
      case "read": {
        const content = await fs.readFile(resolvedPath, "utf-8");
        const lines = content.split("\n");
        const offset = (params.offset as number) || 1;
        const limit = (params.limit as number) || 100;
        const startIdx = Math.max(0, offset - 1);
        const endIdx = startIdx + limit;
        const selectedLines = lines.slice(startIdx, endIdx);
        const numbered = selectedLines.map((line, idx) => `${startIdx + idx + 1}\t${line}`);
        return { result: numbered.join("\n") };
      }
      case "write": {
        const content = params.content as string;
        if (!content) {
          return { result: "Error: content is required" };
        }
        // Ensure parent directory exists
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, content, "utf-8");
        return { result: `Created ${inputPath} (${content.length} characters)` };
      }
      case "edit": {
        // Handle partial edits
        if (params.old_string && params.new_string !== undefined) {
          const existingContent = await fs.readFile(resolvedPath, "utf-8");
          const oldStr = params.old_string as string;
          const newStr = params.new_string as string;
          if (!existingContent.includes(oldStr)) {
            return { result: `Error: old_string not found in file` };
          }
          const newContent = existingContent.replace(oldStr, newStr);
          await fs.writeFile(resolvedPath, newContent, "utf-8");
          return { result: `Updated ${inputPath} (${newContent.length} characters)` };
        }

        // Full file replacement
        const content = params.content as string;
        if (!content) {
          return { result: "Error: content or old_string/new_string is required" };
        }
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, content, "utf-8");
        return { result: `Updated ${inputPath} (${content.length} characters)` };
      }
      default:
        return { result: `Unknown operation: ${op}` };
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { result: `Error: ${errMsg}` };
  }
}

// Execute glob search
async function executeGlob(pattern: string, basePath?: string): Promise<string> {
  try {
    const cwd = basePath ? resolveSandboxPath(basePath) : SANDBOX_BASE;
    const matches = await glob(pattern, { cwd, nodir: false });
    if (matches.length === 0) {
      return `No files match pattern "${pattern}"`;
    }
    return `Found ${matches.length} files:\n${matches.slice(0, 100).join("\n")}${matches.length > 100 ? `\n... and ${matches.length - 100} more` : ""}`;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return `Error: ${errMsg}`;
  }
}

// Execute grep search
async function executeGrep(
  pattern: string,
  searchPath?: string,
  globPattern?: string,
  outputMode: string = "files_with_matches"
): Promise<string> {
  try {
    const basePath = searchPath ? resolveSandboxPath(searchPath) : SANDBOX_BASE;

    // Use glob to find files
    const filePattern = globPattern || "**/*";
    const files = await glob(filePattern, { cwd: basePath, nodir: true });

    const matches: { file: string; line?: number; content?: string }[] = [];

    for (const file of files.slice(0, 1000)) {
      try {
        const filePath = path.join(basePath, file);
        const content = await fs.readFile(filePath, "utf-8");

        if (content.includes(pattern)) {
          if (outputMode === "files_with_matches") {
            matches.push({ file });
          } else if (outputMode === "content") {
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              if (line.includes(pattern)) {
                matches.push({ file, line: idx + 1, content: line });
              }
            });
          } else if (outputMode === "count") {
            const count = (content.match(new RegExp(pattern, "g")) || []).length;
            matches.push({ file, content: `${count} matches` });
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    if (matches.length === 0) {
      return `No matches found for "${pattern}"`;
    }

    if (outputMode === "files_with_matches") {
      return `Found ${matches.length} files with matches:\n${matches.map((m) => m.file).join("\n")}`;
    } else if (outputMode === "content") {
      return `Found ${matches.length} matches:\n${matches.slice(0, 50).map((m) => `${m.file}:${m.line}: ${m.content}`).join("\n")}${matches.length > 50 ? `\n... and ${matches.length - 50} more` : ""}`;
    } else {
      return matches.map((m) => `${m.file}: ${m.content}`).join("\n");
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return `Error: ${errMsg}`;
  }
}

// Execute shell command
async function executeCommand(
  command: string,
  cwd?: string,
  timeout: number = 30000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const workingDir = cwd ? resolveSandboxPath(cwd) : SANDBOX_BASE;
    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    if (error && typeof error === "object" && "killed" in error) {
      const execError = error as { stdout?: string; stderr?: string; code?: number; killed?: boolean };
      return {
        stdout: execError.stdout || "",
        stderr: execError.stderr || (execError.killed ? "Command timed out" : "Command failed"),
        exitCode: execError.code || 1,
      };
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    return { stdout: "", stderr: errMsg, exitCode: 1 };
  }
}

// Execute subagent task
async function executeSubagentTask(
  description: string,
  prompt: string,
  subagentType: string,
  systemPrompt: string
): Promise<string> {
  try {
    // Create a simplified subagent that uses the same model
    const subagentResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `You are a specialized subagent (${subagentType}) helping with the following task.

Your role: ${description}

${systemPrompt}

Provide a clear, concise response that directly addresses the task. Focus on delivering actionable results.`,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from response
    const textBlocks = subagentResponse.content.filter((b) => b.type === "text");
    return textBlocks.map((b) => b.text).join("\n");
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return `Subagent error: ${errMsg}`;
  }
}

interface MemoryFiles {
  [path: string]: string;
}

export async function POST(req: Request) {
  try {
    const { messages, canvasContent, promptConfig, memoryFiles } = await req.json();

    // Track memory file updates during this request
    const updatedMemoryFiles: MemoryFiles = { ...(memoryFiles || {}) };

    // Use custom prompts from config if provided, otherwise use defaults
    const config: ExtendedPromptConfig = promptConfig || {};
    let systemPrompt = config.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    // Add filesystem system prompt if provided
    if (config.filesystemSystemPrompt) {
      systemPrompt += "\n\n" + config.filesystemSystemPrompt;
    }

    // Add execution system prompt if provided
    if (config.executionSystemPrompt) {
      systemPrompt += "\n\n" + config.executionSystemPrompt;
    }

    // Add task/subagent system prompt if provided
    if (config.taskSystemPrompt) {
      systemPrompt += "\n\n" + config.taskSystemPrompt;
    }

    // Add skills system prompt if provided
    if (config.skillsSystemPrompt) {
      systemPrompt += "\n\n" + config.skillsSystemPrompt;
    }

    // Add memory system prompt (use config or default)
    systemPrompt += "\n\n" + (config.memorySystemPrompt || MEMORY_SYSTEM_PROMPT);

    // Add current memory content to system prompt if it exists
    if (updatedMemoryFiles["AGENTS.md"]) {
      systemPrompt += `\n\n## Current Memory (AGENTS.md)\n\`\`\`markdown\n${updatedMemoryFiles["AGENTS.md"]}\n\`\`\``;
    } else {
      systemPrompt += `\n\n## Current Memory\nNo memory file exists yet. Create one using edit_file with path "AGENTS.md" when you need to remember information.`;
    }

    const tools = createTools(config);
    if (canvasContent) {
      systemPrompt += `\n\n## Current Canvas Content\nThe user has a canvas open with the following content:\n\`\`\`\n${canvasContent}\n\`\`\`\nYou can reference or modify this content if the user asks.`;
    }

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial thinking step
          const thinkingStepId = `step_${Date.now()}`;
          const thinkingStep = JSON.stringify({
            type: "tool_step",
            id: thinkingStepId,
            tool: "thinking",
            reasoning: "Analyzing request and planning response",
            status: "running",
            input: { messages: messages.length },
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
            id: thinkingStepId,
            tool: "thinking",
            output: `Generated ${response.content.length} content block(s)`,
          });
          controller.enqueue(encoder.encode(`data: ${thinkingComplete}\n\n`));

          // Process the response
          for (const block of response.content) {
            if (block.type === "text") {
              // Stream text content in chunks for smooth animation
              const text = block.text;
              const chunkSize = 5; // Characters per chunk for chat text
              for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize);
                const data = JSON.stringify({ content: chunk });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                // Small delay for streaming effect
                await new Promise((resolve) => setTimeout(resolve, 5));
              }
            } else if (block.type === "tool_use") {
              const toolName = block.name;
              const input = block.input as Record<string, unknown>;
              const stepId = `step_${Date.now()}_${toolName}`;

              // Send tool step start with reasoning
              const toolStep = JSON.stringify({
                type: "tool_step",
                id: stepId,
                tool: toolName,
                reasoning: getToolReasoning(toolName, input),
                status: "running",
                input: input,
              });
              controller.enqueue(encoder.encode(`data: ${toolStep}\n\n`));

              let output = "";

              // Handle each tool type
              switch (toolName) {
                case "create_canvas": {
                  const canvasInput = input as { title: string; content: string };
                  // Signal canvas creation
                  const createData = JSON.stringify({
                    type: "canvas_create",
                    title: canvasInput.title,
                  });
                  controller.enqueue(encoder.encode(`data: ${createData}\n\n`));

                  // Stream canvas content in chunks for smooth animation
                  const content = canvasInput.content;
                  const chunkSize = 20;
                  for (let i = 0; i < content.length; i += chunkSize) {
                    const chunk = content.slice(i, i + chunkSize);
                    const contentData = JSON.stringify({
                      type: "canvas_content",
                      content: chunk,
                    });
                    controller.enqueue(encoder.encode(`data: ${contentData}\n\n`));
                    await new Promise((resolve) => setTimeout(resolve, 10));
                  }

                  // Signal canvas completion
                  const doneData = JSON.stringify({ type: "canvas_done" });
                  controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

                  output = `Created "${canvasInput.title}" (${canvasInput.content.length} characters)`;

                  // Send a chat message about the canvas
                  const chatData = JSON.stringify({
                    content: `I've created "${canvasInput.title}" in the canvas. You can view and edit it on the right side of the screen.`,
                  });
                  controller.enqueue(encoder.encode(`data: ${chatData}\n\n`));
                  break;
                }

                case "ls": {
                  const result = await executeFilesystemOp("ls", input, updatedMemoryFiles);
                  output = result.result;
                  break;
                }

                case "read_file": {
                  const result = await executeFilesystemOp("read", input, updatedMemoryFiles);
                  output = result.result;
                  break;
                }

                case "write_file": {
                  const result = await executeFilesystemOp("write", input, updatedMemoryFiles);
                  output = result.result;
                  if (result.memoryUpdate) {
                    updatedMemoryFiles[result.memoryUpdate.path] = result.memoryUpdate.content;
                    const memoryUpdate = JSON.stringify({
                      type: "memory_update",
                      path: result.memoryUpdate.path,
                      content: result.memoryUpdate.content,
                    });
                    controller.enqueue(encoder.encode(`data: ${memoryUpdate}\n\n`));
                  }
                  break;
                }

                case "edit_file": {
                  const result = await executeFilesystemOp("edit", input, updatedMemoryFiles);
                  output = result.result;
                  if (result.memoryUpdate) {
                    updatedMemoryFiles[result.memoryUpdate.path] = result.memoryUpdate.content;
                    const memoryUpdate = JSON.stringify({
                      type: "memory_update",
                      path: result.memoryUpdate.path,
                      content: result.memoryUpdate.content,
                    });
                    controller.enqueue(encoder.encode(`data: ${memoryUpdate}\n\n`));
                  }
                  break;
                }

                case "glob": {
                  const pattern = input.pattern as string;
                  const basePath = input.path as string | undefined;
                  output = await executeGlob(pattern, basePath);
                  break;
                }

                case "grep": {
                  const pattern = input.pattern as string;
                  const searchPath = input.path as string | undefined;
                  const globPattern = input.glob_pattern as string | undefined;
                  const outputMode = (input.output_mode as string) || "files_with_matches";
                  output = await executeGrep(pattern, searchPath, globPattern, outputMode);
                  break;
                }

                case "execute": {
                  const command = input.command as string;
                  const cwd = input.cwd as string | undefined;
                  const timeout = (input.timeout as number) || 30000;
                  const result = await executeCommand(command, cwd, timeout);
                  output = `Exit code: ${result.exitCode}\n`;
                  if (result.stdout) output += `stdout:\n${result.stdout}\n`;
                  if (result.stderr) output += `stderr:\n${result.stderr}`;
                  break;
                }

                case "task": {
                  const description = input.description as string;
                  const prompt = input.prompt as string;
                  const subagentType = (input.subagent_type as string) || "general-purpose";
                  const subagentSystemPrompt = config.defaultSubagentPrompt || "You are a helpful assistant.";
                  output = await executeSubagentTask(description, prompt, subagentType, subagentSystemPrompt);
                  break;
                }

                default:
                  output = `Unknown tool: ${toolName}`;
              }

              // Mark tool step as complete
              const toolComplete = JSON.stringify({
                type: "tool_step_complete",
                id: stepId,
                tool: toolName,
                output: output.length > 500 ? output.slice(0, 500) + "..." : output,
              });
              controller.enqueue(encoder.encode(`data: ${toolComplete}\n\n`));
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
