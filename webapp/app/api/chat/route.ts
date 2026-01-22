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
const MEMORY_SYSTEM_PROMPT = `## Memory System (Ambient Memory)

You have access to a persistent memory file that stores information across conversations. You should PROACTIVELY and AUTOMATICALLY update memory whenever you learn something about the user - don't wait for them to ask.

### IMPORTANT: Ambient Memory Behavior
When the user shares ANY personal information, preferences, or context about themselves, you MUST automatically save it to memory using the edit_file tool. Do this silently alongside your response - don't ask permission.

Examples of information to automatically save:
- "I'm in 12th grade" → Save: User is in 12th grade (high school senior)
- "I work at Google" → Save: User works at Google
- "I prefer Python over JavaScript" → Save: User prefers Python over JavaScript
- "My name is Alex" → Save: User's name is Alex
- "I'm working on a startup" → Save: User is working on a startup
- "I have a deadline Friday" → Save: User has a deadline on Friday
- "I'm learning React" → Save: User is learning React
- "I like ducks" → Save: User likes ducks

### When to update memory (ALWAYS do this automatically):
- User mentions their name, age, grade level, or occupation
- User shares preferences (languages, tools, styles, interests)
- User mentions what they're working on or learning
- User shares deadlines, goals, or constraints
- User reveals hobbies, interests, or things they like/dislike
- User provides any context that would be useful to remember
- User explicitly asks you to remember something

### Memory file format:
The memory file (AGENTS.md) uses markdown with sections:
- **User Profile**: Name, age/grade, occupation, location
- **Preferences**: Likes, dislikes, preferred tools/languages
- **Current Focus**: What they're working on, learning, or interested in
- **Projects**: Ongoing work, goals, deadlines
- **Notes**: Other useful information

### How to update memory:
Use the edit_file tool with path "AGENTS.md". If the file doesn't exist, create it with initial structure. When adding new information, append to the appropriate section or update existing entries.

CRITICAL: Do this automatically in the background. When you detect user information, include an edit_file tool call alongside your response. Don't mention that you're saving to memory unless the user asks.`;

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

Be concise but thorough. Use markdown formatting when helpful.

## Planning Tool

You have access to a planning tool for complex, multi-step tasks. USE THE PLANNING TOOL when:
- User asks you to "plan", "break down", or "organize" a task
- User requests work that involves multiple steps or phases
- User asks you to coordinate multiple subagents
- You need to tackle a complex problem that benefits from structured thinking
- User wants visibility into how you'll approach a task

### How to use the planning tool:

1. **Create a plan** with \`create_plan\`:
   - title: Concise name for the plan
   - goal: What the plan aims to achieve
   - steps: Array of steps, each with:
     - id: Unique identifier (e.g., "step-1", "research-phase")
     - title: Short title
     - description: What this step involves
     - type: "task" (you do it), "subagent" (delegate), "manual" (user action), or "checkpoint" (review point)
     - assignee: For subagent steps, name the agent (e.g., "Research Agent")
     - dependencies: Array of step IDs that must complete first

2. **Execute the plan** by:
   - Mark steps as "in_progress" when starting with \`update_plan\`
   - Execute the actual work (use tools, call subagents, etc.)
   - Mark steps as "completed" when done, including any output
   - Mark steps as "failed" if something goes wrong

3. **Coordinate subagents** by:
   - Creating plan steps with type "subagent"
   - Launching the subagent with the \`task\` tool
   - Updating the plan step with the subagent's results

### Example workflow:
\`\`\`
User: "Research and write reports about 5 duck species"

1. create_plan with steps:
   - step-1: "Research Mallard" (type: subagent)
   - step-2: "Research Wood Duck" (type: subagent)
   - step-3: "Research Mandarin" (type: subagent)
   - step-4: "Research Teal" (type: subagent)
   - step-5: "Research Pintail" (type: subagent)
   - step-6: "Compile final report" (type: task, dependencies: [1-5])

2. update_plan step-1 status: "in_progress"
3. task: Launch research subagent for Mallard
4. update_plan step-1 status: "completed" with output
... repeat for other steps ...
5. Compile results and present to user
\`\`\`

The plan appears in the UI sidebar so users can track progress in real-time.`;

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
          shared_doc_id: {
            type: "string",
            description: "If a shared document was created, pass the document ID so the subagent can write to it.",
          },
        },
        required: ["reasoning", "description", "prompt"],
      },
    },
    {
      name: "create_shared_doc",
      description: `Create a shared document that multiple subagents can write to collaboratively. Use this BEFORE launching subagents when you need them to contribute sections to a single document. Each subagent will write to their own section, and you can then present the full document to the user.`,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of why you're creating this shared document.",
          },
          title: {
            type: "string",
            description: "The title for the document (e.g., '12th Grade Algebra Research').",
          },
        },
        required: ["reasoning", "title"],
      },
    },
    {
      name: "get_shared_doc",
      description: `Get the current content of a shared document after subagents have written to it. Use this to retrieve the compiled document and present it to the user via create_canvas.`,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of why you're retrieving this document.",
          },
          doc_id: {
            type: "string",
            description: "The ID of the shared document to retrieve.",
          },
        },
        required: ["reasoning", "doc_id"],
      },
    },
    {
      name: "todo_list",
      description: `Create or update a todo list that appears inline in the chat. Use this FIRST when starting any multi-step task to show the user what you're working on. The todo list displays in the chat window with real-time progress tracking. Update individual items as you complete them.`,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of what you're planning to do.",
          },
          title: {
            type: "string",
            description: "A title for the todo list (e.g., 'Duck Species Research', 'Building API').",
          },
          items: {
            type: "array",
            description: "Array of todo items.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for this item (e.g., 'item-1', 'research-mallard').",
                },
                content: {
                  type: "string",
                  description: "What needs to be done (imperative form, e.g., 'Research mallard ducks').",
                },
                activeForm: {
                  type: "string",
                  description: "Present continuous form shown when in progress (e.g., 'Researching mallard ducks').",
                },
                status: {
                  type: "string",
                  enum: ["pending", "in_progress", "completed", "failed"],
                  description: "Current status of this item.",
                },
              },
              required: ["id", "content", "status"],
            },
          },
        },
        required: ["reasoning", "items"],
      },
    },
    {
      name: "update_todo",
      description: `Update the status of a specific todo item. Use this to mark items as in_progress when starting work, and completed when done.`,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of this status update.",
          },
          item_id: {
            type: "string",
            description: "The ID of the todo item to update.",
          },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "failed"],
            description: "New status for the item.",
          },
        },
        required: ["reasoning", "item_id", "status"],
      },
    },
    {
      name: "create_plan",
      description: `Create a structured plan for completing a complex task. Use this when the user asks you to plan something, break down a task, or when you need to coordinate multiple steps or subagents. The plan will be displayed in the UI as a checklist that tracks progress.`,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of why you're creating this plan.",
          },
          title: {
            type: "string",
            description: "A concise title for the plan (e.g., 'Research Duck Species', 'Build Landing Page').",
          },
          goal: {
            type: "string",
            description: "The overall goal or objective this plan aims to achieve.",
          },
          steps: {
            type: "array",
            description: "Array of plan steps to execute.",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for this step (e.g., 'step-1', 'research-mallard').",
                },
                title: {
                  type: "string",
                  description: "Short title for this step.",
                },
                description: {
                  type: "string",
                  description: "Detailed description of what this step involves.",
                },
                type: {
                  type: "string",
                  enum: ["task", "subagent", "manual", "checkpoint"],
                  description: "Type of step: 'task' (you'll do it), 'subagent' (delegate to subagent), 'manual' (user action needed), 'checkpoint' (review point).",
                },
                assignee: {
                  type: "string",
                  description: "For subagent steps, a descriptive name for the subagent (e.g., 'Research Agent', 'Writer Agent').",
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of step IDs that must complete before this step can start.",
                },
              },
              required: ["id", "title", "description", "type"],
            },
          },
        },
        required: ["reasoning", "title", "goal", "steps"],
      },
    },
    {
      name: "update_plan",
      description: `Update the status of a plan step. Use this to mark steps as in_progress, completed, or failed as you work through the plan.`,
      input_schema: {
        type: "object" as const,
        properties: {
          reasoning: {
            type: "string",
            description: "Brief explanation of this status update.",
          },
          step_id: {
            type: "string",
            description: "The ID of the step to update.",
          },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "failed", "skipped"],
            description: "New status for the step.",
          },
          output: {
            type: "string",
            description: "Optional output or result from completing this step.",
          },
        },
        required: ["reasoning", "step_id", "status"],
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
    create_plan: "Creating execution plan",
    update_plan: "Updating plan progress",
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

// Shared document state for coordinating subagent writes
interface SharedDocument {
  id: string;
  title: string;
  sections: { [sectionId: string]: { title: string; content: string; author: string; timestamp: number } };
  order: string[]; // Section IDs in order
}

// Global shared document storage (in production, use Redis or similar)
const sharedDocuments: { [docId: string]: SharedDocument } = {};

// Create a new shared document
function createSharedDocument(id: string, title: string): SharedDocument {
  const doc: SharedDocument = {
    id,
    title,
    sections: {},
    order: [],
  };
  sharedDocuments[id] = doc;
  return doc;
}

// Callback type for notifying about document updates
type DocumentUpdateCallback = (docId: string, fullContent: string) => void;

// Add or update a section in the shared document (thread-safe with locking)
function writeDocumentSection(
  docId: string,
  sectionId: string,
  sectionTitle: string,
  content: string,
  author: string,
  onUpdate?: DocumentUpdateCallback
): { success: boolean; message: string } {
  const doc = sharedDocuments[docId];
  if (!doc) {
    return { success: false, message: `Document ${docId} not found` };
  }

  // Add section
  doc.sections[sectionId] = {
    title: sectionTitle,
    content,
    author,
    timestamp: Date.now(),
  };

  // Add to order if new
  if (!doc.order.includes(sectionId)) {
    doc.order.push(sectionId);
  }

  // Notify about update
  if (onUpdate) {
    const fullContent = getSharedDocumentContent(docId);
    if (fullContent) {
      onUpdate(docId, fullContent);
    }
  }

  return { success: true, message: `Section "${sectionTitle}" written successfully` };
}

// Get the full document content as markdown
function getSharedDocumentContent(docId: string): string | null {
  const doc = sharedDocuments[docId];
  if (!doc) return null;

  let content = `# ${doc.title}\n\n`;

  for (const sectionId of doc.order) {
    const section = doc.sections[sectionId];
    if (section) {
      content += `## ${section.title}\n\n${section.content}\n\n`;
    }
  }

  return content.trim();
}

// Subagent tools - these are the tools available to subagents
function createSubagentTools(docId: string): Anthropic.Tool[] {
  return [
    {
      name: "write_section",
      description: `Write your research findings to a specific section of the shared document. Each subagent should write to their own unique section. The section will be added to the collaborative document that will be presented to the user.`,
      input_schema: {
        type: "object" as const,
        properties: {
          section_id: {
            type: "string",
            description: "A unique identifier for this section (e.g., 'polynomial-functions', 'exponential-logs'). Use lowercase with hyphens.",
          },
          section_title: {
            type: "string",
            description: "The title for this section (e.g., 'Polynomial Functions & Analysis').",
          },
          content: {
            type: "string",
            description: "The full content to write to this section. Use markdown formatting. Include all your research findings, explanations, formulas, examples, etc.",
          },
        },
        required: ["section_id", "section_title", "content"],
      },
    },
    {
      name: "read_document",
      description: `Read the current state of the shared document to see what other subagents have written.`,
      input_schema: {
        type: "object" as const,
        properties: {},
      },
    },
  ];
}

// Execute subagent task with shared document access
async function executeSubagentTask(
  description: string,
  prompt: string,
  subagentType: string,
  systemPrompt: string,
  sharedDocId?: string,
  onDocumentUpdate?: DocumentUpdateCallback
): Promise<string> {
  try {
    const hasSharedDoc = sharedDocId && sharedDocuments[sharedDocId];
    const subagentTools = hasSharedDoc ? createSubagentTools(sharedDocId) : [];

    const subagentSystemPrompt = `You are a specialized subagent (${subagentType}) helping with the following task.

Your role: ${description}

${systemPrompt}

${hasSharedDoc ? `
## CRITICAL: Writing to the Shared Document

You have access to a SHARED DOCUMENT (ID: ${sharedDocId}) where you MUST write your research findings.

**You MUST use the write_section tool to write your complete research to the document.**

DO NOT just return your findings as text. Instead:
1. Do your research
2. Call the write_section tool with your complete findings
3. Then confirm that you've written to the document

The write_section tool takes:
- section_id: A unique identifier for your section (e.g., 'polynomial-functions')
- section_title: The title for your section
- content: Your complete research content in markdown format

Write comprehensive, detailed content. This is what the user will see in the final document.
` : ''}

Provide a clear, concise response that directly addresses the task. Focus on delivering actionable results.`;

    // If no shared doc, use simple subagent
    if (!hasSharedDoc) {
      const subagentResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: subagentSystemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlocks = subagentResponse.content.filter((b) => b.type === "text");
      return textBlocks.map((b) => b.text).join("\n");
    }

    // With shared doc, use agentic loop so subagent can use tools
    let conversationMessages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
    let continueLoop = true;
    let finalOutput = "";

    while (continueLoop) {
      const subagentResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: subagentSystemPrompt,
        tools: subagentTools,
        messages: conversationMessages,
      });

      const textBlocks = subagentResponse.content.filter((b) => b.type === "text");
      const toolUseBlocks = subagentResponse.content.filter((b) => b.type === "tool_use");

      // Collect text output
      finalOutput += textBlocks.map((b) => b.text).join("\n");

      if (toolUseBlocks.length > 0) {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of toolUseBlocks) {
          if (block.type === "tool_use") {
            let result = "";

            if (block.name === "write_section") {
              const input = block.input as { section_id: string; section_title: string; content: string };
              const writeResult = writeDocumentSection(
                sharedDocId,
                input.section_id,
                input.section_title,
                input.content,
                description, // Use description as author
                onDocumentUpdate // Pass callback for live updates
              );
              result = writeResult.message;
            } else if (block.name === "read_document") {
              const content = getSharedDocumentContent(sharedDocId);
              result = content || "Document is empty.";
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        // Add to conversation and continue
        conversationMessages = [
          ...conversationMessages,
          { role: "assistant" as const, content: subagentResponse.content },
          { role: "user" as const, content: toolResults },
        ];
      } else {
        continueLoop = false;
      }

      if (subagentResponse.stop_reason === "end_turn" && toolUseBlocks.length === 0) {
        continueLoop = false;
      }
    }

    return finalOutput || "Research completed and written to shared document.";
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return `Subagent error: ${errMsg}`;
  }
}

interface MemoryFiles {
  [path: string]: string;
}

// Helper to execute a single tool and return result
async function executeTool(
  toolName: string,
  toolId: string,
  input: Record<string, unknown>,
  config: ExtendedPromptConfig,
  updatedMemoryFiles: MemoryFiles,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<{ toolId: string; toolName: string; output: string; stepId: string; memoryUpdate?: { path: string; content: string } }> {
  const stepId = `step_${Date.now()}_${toolName}_${toolId}`;

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
  let memoryUpdate: { path: string; content: string } | undefined;

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
      memoryUpdate = result.memoryUpdate;
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
      memoryUpdate = result.memoryUpdate;
      break;
    }

    case "edit_file": {
      const result = await executeFilesystemOp("edit", input, updatedMemoryFiles);
      output = result.result;
      memoryUpdate = result.memoryUpdate;
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
      const sharedDocId = input.shared_doc_id as string | undefined;
      const subagentSystemPrompt = config.defaultSubagentPrompt || "You are a helpful assistant.";

      // Create callback for live document updates
      const onDocUpdate: DocumentUpdateCallback = (docId: string, fullContent: string) => {
        // Stream the updated document content to the canvas
        const updateData = JSON.stringify({
          type: "shared_doc_update",
          docId: docId,
          content: fullContent,
        });
        controller.enqueue(encoder.encode(`data: ${updateData}\n\n`));
      };

      output = await executeSubagentTask(description, prompt, subagentType, subagentSystemPrompt, sharedDocId, onDocUpdate);
      break;
    }

    case "create_shared_doc": {
      const title = input.title as string;
      const docId = `doc_${Date.now()}`;
      createSharedDocument(docId, title);

      // Signal canvas creation immediately so the document opens while work is happening
      const createData = JSON.stringify({
        type: "canvas_create",
        title: title,
        isSharedDoc: true,
        docId: docId,
      });
      controller.enqueue(encoder.encode(`data: ${createData}\n\n`));

      // Send initial placeholder content
      const initialContent = `# ${title}\n\n*Document is being prepared by subagents...*\n\n---\n\n`;
      const contentData = JSON.stringify({
        type: "canvas_content",
        content: initialContent,
      });
      controller.enqueue(encoder.encode(`data: ${contentData}\n\n`));

      output = `Created shared document "${title}" with ID: ${docId}. The document is now open in the canvas. Pass this doc_id to your task calls using the shared_doc_id parameter so subagents can write to it.`;
      break;
    }

    case "get_shared_doc": {
      const docId = input.doc_id as string;
      const content = getSharedDocumentContent(docId);
      if (content) {
        output = content;
      } else {
        output = `Document ${docId} not found or is empty.`;
      }
      break;
    }

    case "todo_list": {
      const todoInput = input as {
        title?: string;
        items: Array<{
          id: string;
          content: string;
          activeForm?: string;
          status: string;
        }>;
      };

      // Send todo list event to the UI
      const todoData = JSON.stringify({
        type: "todo_list_create",
        todoList: {
          id: `todo_${Date.now()}`,
          title: todoInput.title,
          items: todoInput.items.map((item) => ({
            ...item,
            status: item.status || "pending",
          })),
          createdAt: Date.now(),
        },
      });
      controller.enqueue(encoder.encode(`data: ${todoData}\n\n`));

      output = `Created todo list with ${todoInput.items.length} items. The list is now visible in the chat. I will now begin working through the items.`;
      break;
    }

    case "update_todo": {
      const updateTodoInput = input as {
        item_id: string;
        status: string;
      };

      // Send todo update event to the UI
      const todoUpdateData = JSON.stringify({
        type: "todo_update",
        item_id: updateTodoInput.item_id,
        status: updateTodoInput.status,
      });
      controller.enqueue(encoder.encode(`data: ${todoUpdateData}\n\n`));

      output = `Updated todo item "${updateTodoInput.item_id}" to status "${updateTodoInput.status}".`;
      break;
    }

    case "create_plan": {
      const planInput = input as {
        title: string;
        goal: string;
        steps: Array<{
          id: string;
          title: string;
          description: string;
          type: string;
          assignee?: string;
          dependencies?: string[];
        }>;
      };

      // Send plan creation event to the UI
      const planData = JSON.stringify({
        type: "plan_create",
        plan: {
          id: `plan_${Date.now()}`,
          title: planInput.title,
          goal: planInput.goal,
          steps: planInput.steps.map((step) => ({
            ...step,
            status: "pending",
            output: null,
          })),
          createdAt: new Date().toISOString(),
        },
      });
      controller.enqueue(encoder.encode(`data: ${planData}\n\n`));

      output = `Created plan "${planInput.title}" with ${planInput.steps.length} steps. The plan is now visible in the UI sidebar. I will now begin executing the plan steps.`;
      break;
    }

    case "update_plan": {
      const updateInput = input as {
        step_id: string;
        status: string;
        output?: string;
      };

      // Send plan update event to the UI
      const updateData = JSON.stringify({
        type: "plan_update",
        step_id: updateInput.step_id,
        status: updateInput.status,
        output: updateInput.output || null,
      });
      controller.enqueue(encoder.encode(`data: ${updateData}\n\n`));

      output = `Updated step "${updateInput.step_id}" to status "${updateInput.status}"${updateInput.output ? ` with output.` : "."}`;
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

  return { toolId, toolName, output, stepId, memoryUpdate };
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

    // Add instruction about planning-first workflow and parallel subagents
    systemPrompt += `\n\n## CRITICAL: Planning-First Workflow

**ALWAYS start complex tasks with a todo list.** When a user asks you to do anything that involves multiple steps:

### Step 1: Create a Todo List FIRST
Use the \`todo_list\` tool immediately to show the user what you're going to do. This appears inline in the chat.

Example for "Research 10 duck species":
\`\`\`
todo_list({
  title: "Duck Species Research",
  items: [
    { id: "setup", content: "Create shared document", activeForm: "Creating shared document", status: "pending" },
    { id: "mallard", content: "Research Mallard ducks", activeForm: "Researching Mallard ducks", status: "pending" },
    { id: "wood", content: "Research Wood Ducks", activeForm: "Researching Wood Ducks", status: "pending" },
    // ... more items
    { id: "compile", content: "Compile final report", activeForm: "Compiling final report", status: "pending" }
  ]
})
\`\`\`

### Step 2: Update Todo Status as You Work
Before starting each task, call \`update_todo\` to mark it as "in_progress".
After completing each task, call \`update_todo\` to mark it as "completed".

### Step 3: For Multi-Subagent Tasks
When you need multiple subagents to work on a document:

1. **Create a shared document** using \`create_shared_doc\` - this opens the canvas immediately
2. **Launch ALL subagents IN PARALLEL** - call multiple \`task\` tools in the SAME response
3. **Wait for completion** - all subagents run concurrently
4. **Retrieve and finalize** - use \`get_shared_doc\` to get the compiled content

### IMPORTANT: Parallel Execution
To run tasks in parallel, you MUST include multiple \`task\` tool calls in a single response.

Example (correct - runs in parallel):
\`\`\`
[In a single response:]
task({ description: "Research Mallard", prompt: "...", shared_doc_id: "doc_123" })
task({ description: "Research Wood Duck", prompt: "...", shared_doc_id: "doc_123" })
task({ description: "Research Mandarin", prompt: "...", shared_doc_id: "doc_123" })
\`\`\`

Example (WRONG - runs sequentially):
\`\`\`
[Response 1:] task({ description: "Research Mallard", ... })
[Response 2:] task({ description: "Research Wood Duck", ... })
[Response 3:] task({ description: "Research Mandarin", ... })
\`\`\`

### Complete Example Workflow

User: "Research and write about 5 duck species"

**Your Response 1:**
1. Call \`todo_list\` with all tasks
2. Call \`update_todo\` to mark "Create shared document" as in_progress
3. Call \`create_shared_doc\` with title "Duck Species Research"
4. Call \`update_todo\` to mark "Create shared document" as completed
5. Call \`update_todo\` to mark ALL research items as in_progress (since they'll run in parallel)
6. Call FIVE \`task\` tools in the SAME response with shared_doc_id

**Your Response 2:** (after subagents complete)
1. Call \`update_todo\` to mark all research items as completed
2. Call \`get_shared_doc\` to retrieve the compiled document
3. Call \`update_todo\` to mark "Compile final report" as completed
4. Summarize the work done

### Key Rules:
- ALWAYS create a todo list first for any multi-step task
- ALWAYS update todo status as you work (gives user visibility)
- ALWAYS launch parallel tasks in a SINGLE response
- The shared document opens immediately in the canvas so users see progress
- Subagents write directly to the shared document
- You synthesize and summarize at the end`;

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

          // Build conversation history for the API
          let conversationMessages = messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          }));

          // Agentic loop - continue until we get a response without tool calls
          let continueLoop = true;
          let isFirstIteration = true;
          while (continueLoop) {
            // API call with tools
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 8192,
              system: systemPrompt,
              tools: tools,
              messages: conversationMessages,
            });

            // Mark thinking as complete (only on first iteration)
            if (isFirstIteration && thinkingStepId) {
              const thinkingComplete = JSON.stringify({
                type: "tool_step_complete",
                id: thinkingStepId,
                tool: "thinking",
                output: `Generated ${response.content.length} content block(s)`,
              });
              controller.enqueue(encoder.encode(`data: ${thinkingComplete}\n\n`));
              isFirstIteration = false;
            }

            // Separate text blocks and tool use blocks
            const textBlocks = response.content.filter((b) => b.type === "text");
            const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

            // Only stream text content if this is the FINAL response (no more tool calls)
            // This ensures only the master agent's final synthesized response is shown to the user
            const isFinalResponse = toolUseBlocks.length === 0;

            if (isFinalResponse) {
              for (const block of textBlocks) {
                if (block.type === "text") {
                  const text = block.text;
                  const chunkSize = 5;
                  for (let i = 0; i < text.length; i += chunkSize) {
                    const chunk = text.slice(i, i + chunkSize);
                    const data = JSON.stringify({ content: chunk });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    await new Promise((resolve) => setTimeout(resolve, 5));
                  }
                }
              }
            }

            // If there are tool calls, execute them
            if (toolUseBlocks.length > 0) {
              // Check if we have multiple subagent (task) calls - these should run in parallel
              const taskCalls = toolUseBlocks.filter((b) => b.type === "tool_use" && b.name === "task");
              const otherCalls = toolUseBlocks.filter((b) => b.type === "tool_use" && b.name !== "task");

              const toolResults: { toolId: string; toolName: string; output: string; stepId: string }[] = [];

              // Execute non-task tools sequentially (they may have side effects/dependencies)
              for (const block of otherCalls) {
                if (block.type === "tool_use") {
                  const result = await executeTool(
                    block.name,
                    block.id,
                    block.input as Record<string, unknown>,
                    config,
                    updatedMemoryFiles,
                    controller,
                    encoder
                  );
                  toolResults.push(result);

                  // Handle memory updates
                  if (result.memoryUpdate) {
                    updatedMemoryFiles[result.memoryUpdate.path] = result.memoryUpdate.content;
                    const memoryUpdate = JSON.stringify({
                      type: "memory_update",
                      path: result.memoryUpdate.path,
                      content: result.memoryUpdate.content,
                    });
                    controller.enqueue(encoder.encode(`data: ${memoryUpdate}\n\n`));
                  }
                }
              }

              // Execute task (subagent) calls in parallel
              if (taskCalls.length > 0) {
                // Notify that we're running subagents in parallel
                if (taskCalls.length > 1) {
                  const parallelNotice = JSON.stringify({
                    type: "parallel_subagents",
                    count: taskCalls.length,
                    message: `Running ${taskCalls.length} subagents in parallel...`,
                  });
                  controller.enqueue(encoder.encode(`data: ${parallelNotice}\n\n`));
                }

                // First, send all tool_step events for subagents (so UI shows them all starting)
                const subagentStepIds: { [toolId: string]: string } = {};
                for (const block of taskCalls) {
                  if (block.type === "tool_use") {
                    const stepId = `step_${Date.now()}_task_${block.id}`;
                    subagentStepIds[block.id] = stepId;
                    const toolStep = JSON.stringify({
                      type: "tool_step",
                      id: stepId,
                      tool: "task",
                      reasoning: getToolReasoning("task", block.input as Record<string, unknown>),
                      status: "running",
                      input: block.input,
                    });
                    controller.enqueue(encoder.encode(`data: ${toolStep}\n\n`));
                  }
                }

                // Create callback for live document updates during parallel execution
                const onDocUpdate: DocumentUpdateCallback = (docId: string, fullContent: string) => {
                  const updateData = JSON.stringify({
                    type: "shared_doc_update",
                    docId: docId,
                    content: fullContent,
                  });
                  controller.enqueue(encoder.encode(`data: ${updateData}\n\n`));
                };

                // Now execute all subagent API calls truly in parallel
                const taskPromises = taskCalls.map(async (block) => {
                  if (block.type === "tool_use") {
                    const input = block.input as Record<string, unknown>;
                    const description = input.description as string;
                    const prompt = input.prompt as string;
                    const subagentType = (input.subagent_type as string) || "general-purpose";
                    const sharedDocId = input.shared_doc_id as string | undefined;
                    const subagentSystemPrompt = config.defaultSubagentPrompt || "You are a helpful assistant.";

                    // Execute subagent with live update callback (this is the actual parallel work)
                    const output = await executeSubagentTask(description, prompt, subagentType, subagentSystemPrompt, sharedDocId, onDocUpdate);

                    return {
                      toolId: block.id,
                      toolName: "task",
                      output,
                      stepId: subagentStepIds[block.id],
                    };
                  }
                  return { toolId: "", toolName: "", output: "", stepId: "" };
                });

                // Wait for all subagents to complete in parallel
                const taskResults = await Promise.all(taskPromises);

                // Now send completion events for all subagents
                for (const result of taskResults) {
                  if (result.stepId) {
                    const toolComplete = JSON.stringify({
                      type: "tool_step_complete",
                      id: result.stepId,
                      tool: "task",
                      output: result.output.length > 500 ? result.output.slice(0, 500) + "..." : result.output,
                    });
                    controller.enqueue(encoder.encode(`data: ${toolComplete}\n\n`));
                  }
                }

                toolResults.push(...taskResults);
              }

              // Build tool result messages to send back to the model
              const toolResultContent = toolResults.map((result) => ({
                type: "tool_result" as const,
                tool_use_id: result.toolId,
                content: result.output,
              }));

              // Add assistant's response and tool results to conversation
              conversationMessages = [
                ...conversationMessages,
                { role: "assistant" as const, content: response.content },
                { role: "user" as const, content: toolResultContent },
              ];

              // Continue the loop to let the model process tool results
              continueLoop = true;
            } else {
              // No tool calls - we're done
              continueLoop = false;
            }

            // Check stop reason - if end_turn or stop, we're done
            if (response.stop_reason === "end_turn" && toolUseBlocks.length === 0) {
              continueLoop = false;
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
