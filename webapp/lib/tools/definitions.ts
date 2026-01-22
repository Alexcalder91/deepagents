// Shared tool definitions used by both chat and agent builder

export interface ToolDefinition {
  name: string;
  type: "builtin" | "mcp" | "custom";
  description: string;
  inputSchema: Record<string, unknown>;
  category:
    | "filesystem"
    | "execution"
    | "canvas"
    | "planning"
    | "subagent"
    | "other";
  icon?: string;
}

export const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    name: "create_canvas",
    type: "builtin",
    description:
      "Creates a document canvas in the UI to display long-form content like articles, blog posts, proposals, code files, reports, etc.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're creating this document",
        },
        title: {
          type: "string",
          description: "The title of the document",
        },
        content: {
          type: "string",
          description: "The full content to display in the canvas",
        },
      },
      required: ["reasoning", "title", "content"],
    },
    category: "canvas",
    icon: "FileText",
  },
  {
    name: "ls",
    type: "builtin",
    description: "Lists all files in a directory. Use this to explore the filesystem and find files.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're listing this directory",
        },
        path: {
          type: "string",
          description: "The directory path to list. Defaults to current working directory.",
        },
      },
      required: ["reasoning"],
    },
    category: "filesystem",
    icon: "Folder",
  },
  {
    name: "read_file",
    type: "builtin",
    description: "Read the contents of a file from the filesystem.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're reading this file",
        },
        path: {
          type: "string",
          description: "The path to the file to read",
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
    category: "filesystem",
    icon: "FileCode",
  },
  {
    name: "write_file",
    type: "builtin",
    description: "Write content to a new file. Use for creating new files.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're writing this file",
        },
        path: {
          type: "string",
          description: "The path to the file to create",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
      },
      required: ["reasoning", "path", "content"],
    },
    category: "filesystem",
    icon: "FilePlus",
  },
  {
    name: "edit_file",
    type: "builtin",
    description: "Create or update a file. Use this to save information or modify existing files.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're editing this file",
        },
        path: {
          type: "string",
          description: "The path to the file to edit",
        },
        content: {
          type: "string",
          description: "The new content for the file",
        },
        old_string: {
          type: "string",
          description: "For partial edits: the string to replace",
        },
        new_string: {
          type: "string",
          description: "For partial edits: the replacement string",
        },
      },
      required: ["reasoning", "path"],
    },
    category: "filesystem",
    icon: "FileEdit",
  },
  {
    name: "glob",
    type: "builtin",
    description: "Find files matching a glob pattern. Supports patterns like **/*.py, *.txt, etc.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're searching for these files",
        },
        pattern: {
          type: "string",
          description: "The glob pattern to match (e.g., '**/*.py', '*.txt')",
        },
        path: {
          type: "string",
          description: "Base directory for the search. Defaults to current directory.",
        },
      },
      required: ["reasoning", "pattern"],
    },
    category: "filesystem",
    icon: "Search",
  },
  {
    name: "grep",
    type: "builtin",
    description: "Search for text patterns across files. Returns matching files or content.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're searching for this pattern",
        },
        pattern: {
          type: "string",
          description: "The text pattern to search for",
        },
        path: {
          type: "string",
          description: "File or directory to search in",
        },
        glob_pattern: {
          type: "string",
          description: "Optional glob pattern to filter files",
        },
        output_mode: {
          type: "string",
          enum: ["files_with_matches", "content", "count"],
          description: "Output mode",
        },
      },
      required: ["reasoning", "pattern"],
    },
    category: "filesystem",
    icon: "FileSearch",
  },
  {
    name: "execute",
    type: "builtin",
    description: "Execute a shell command. Returns stdout, stderr, and exit code.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're executing this command",
        },
        command: {
          type: "string",
          description: "The shell command to execute",
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
    category: "execution",
    icon: "Terminal",
  },
  {
    name: "task",
    type: "builtin",
    description: "Launch a subagent to handle a complex task. The subagent runs autonomously and returns results.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "A brief explanation of why you're launching this subagent",
        },
        description: {
          type: "string",
          description: "A short (3-5 word) description of the task",
        },
        prompt: {
          type: "string",
          description: "Detailed instructions for the subagent",
        },
        subagent_type: {
          type: "string",
          enum: ["general-purpose", "explore", "research"],
          description: "Type of subagent to use",
        },
        shared_doc_id: {
          type: "string",
          description: "If a shared document was created, pass the document ID",
        },
      },
      required: ["reasoning", "description", "prompt"],
    },
    category: "subagent",
    icon: "Bot",
  },
  {
    name: "create_shared_doc",
    type: "builtin",
    description: "Create a shared document that multiple subagents can write to collaboratively.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of why you're creating this shared document",
        },
        title: {
          type: "string",
          description: "The title for the document",
        },
      },
      required: ["reasoning", "title"],
    },
    category: "subagent",
    icon: "FileSymlink",
  },
  {
    name: "get_shared_doc",
    type: "builtin",
    description: "Get the current content of a shared document after subagents have written to it.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of why you're retrieving this document",
        },
        doc_id: {
          type: "string",
          description: "The ID of the shared document to retrieve",
        },
      },
      required: ["reasoning", "doc_id"],
    },
    category: "subagent",
    icon: "FileOutput",
  },
  {
    name: "todo_list",
    type: "builtin",
    description: "Create or update a todo list that appears inline in the chat.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of what you're planning to do",
        },
        title: {
          type: "string",
          description: "A title for the todo list",
        },
        items: {
          type: "array",
          description: "Array of todo items",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              content: { type: "string" },
              activeForm: { type: "string" },
              status: {
                type: "string",
                enum: ["pending", "in_progress", "completed", "failed"],
              },
            },
            required: ["id", "content", "status"],
          },
        },
      },
      required: ["reasoning", "items"],
    },
    category: "planning",
    icon: "ListTodo",
  },
  {
    name: "update_todo",
    type: "builtin",
    description: "Update the status of a specific todo item.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of this status update",
        },
        item_id: {
          type: "string",
          description: "The ID of the todo item to update",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "failed"],
          description: "New status for the item",
        },
      },
      required: ["reasoning", "item_id", "status"],
    },
    category: "planning",
    icon: "ListChecks",
  },
  {
    name: "create_plan",
    type: "builtin",
    description: "Create a structured plan for completing a complex task.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of why you're creating this plan",
        },
        title: {
          type: "string",
          description: "A concise title for the plan",
        },
        goal: {
          type: "string",
          description: "The overall goal this plan aims to achieve",
        },
        steps: {
          type: "array",
          description: "Array of plan steps",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              type: {
                type: "string",
                enum: ["task", "subagent", "manual", "checkpoint"],
              },
              assignee: { type: "string" },
              dependencies: { type: "array", items: { type: "string" } },
            },
            required: ["id", "title", "description", "type"],
          },
        },
      },
      required: ["reasoning", "title", "goal", "steps"],
    },
    category: "planning",
    icon: "ClipboardList",
  },
  {
    name: "update_plan",
    type: "builtin",
    description: "Update the status of a plan step.",
    inputSchema: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of this status update",
        },
        step_id: {
          type: "string",
          description: "The ID of the step to update",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "failed", "skipped"],
          description: "New status for the step",
        },
        output: {
          type: "string",
          description: "Optional output or result from completing this step",
        },
      },
      required: ["reasoning", "step_id", "status"],
    },
    category: "planning",
    icon: "ClipboardCheck",
  },
];

// Get tools by category
export function getToolsByCategory(
  category: ToolDefinition["category"]
): ToolDefinition[] {
  return BUILTIN_TOOLS.filter((tool) => tool.category === category);
}

// Get tool by name
export function getToolByName(name: string): ToolDefinition | undefined {
  return BUILTIN_TOOLS.find((tool) => tool.name === name);
}

// Get all categories
export function getToolCategories(): ToolDefinition["category"][] {
  return [...new Set(BUILTIN_TOOLS.map((tool) => tool.category))];
}
