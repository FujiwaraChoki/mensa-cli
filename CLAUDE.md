# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mensa-cli is a terminal-based chat interface for Claude AI, built with Bun, React, and Ink (React for CLI). It uses the Claude Agent SDK to provide an agentic chat experience with tool use capabilities.

## Commands

```bash
bun run dev          # Run in development mode
bun run build        # Build to dist/index.js for npm distribution
bun run src/index.tsx  # Run directly without build step
```

### CLI Commands

```bash
mensa                      # Start a new session
mensa --continue, -c       # Continue the most recent conversation
mensa --resume <id>        # Resume a specific session by ID
mensa --help, -h           # Show help

# MCP Server Management
mensa mcp list             # List configured MCP servers
mensa mcp add <name> --command <cmd> [--args <args>]  # Add stdio server
mensa mcp add <name> --url <url> [--type sse|http]    # Add remote server
mensa mcp remove <name>    # Remove a server

# Budget Management
mensa budget show          # Show current budget limit
mensa budget set <amount>  # Set budget limit (e.g., 5.00)
mensa budget clear         # Remove budget limit
```

### In-App Commands

- `/config`, `/settings` - Open settings screen
- `/mcp` - Manage MCP servers (TUI)
- `/undo` - Undo last file changes
- `/help` - Show help
- `exit`, `quit` - Exit mensa

## Architecture

**Runtime**: Bun (not Node.js) - uses Bun-specific APIs like `Bun.file()` and `Bun.write()`

**UI Framework**: Ink v6 with React 19 - renders React components to the terminal. Components use `ink` primitives (`Box`, `Text`) and `@inkjs/ui` for interactive elements (`Select`).

**State Management**: React hooks only, no external state library

**Markdown Rendering**: Uses `marked` + `marked-terminal` for rendering markdown in assistant responses

### Key Files

- `src/index.tsx` - Entry point with CLI argument parsing and Ink renderer
- `src/App.tsx` - Root component with screen routing (onboarding → chat ↔ config ↔ mcp)
- `src/hooks/useChat.ts` - Claude Agent SDK integration with session management, costs, and undo
- `src/utils/config.ts` - Persists config to `~/.mensa/config.json` including MCP servers
- `src/types.ts` - Shared types including MCP, session, and usage types
- `src/components/Markdown.tsx` - Terminal markdown rendering component
- `src/components/Input.tsx` - Text input with slash command autocomplete
- `src/screens/Mcp.tsx` - MCP server management TUI

### Screen Flow

1. First run → Onboarding (welcome → model select → complete)
2. Normal run → Chat screen
3. `/config` → Config screen (model selection)
4. `/mcp` → MCP screen (server management)

### Claude Agent SDK Usage

The `useChat` hook wraps `query()` from `@anthropic-ai/claude-agent-sdk`:
- Streams responses via async iterator
- Handles `assistant` messages (text blocks + tool use blocks)
- Handles `result` messages with usage/cost tracking
- Handles `system` init messages for session ID
- Allowed tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, TodoWrite
- Permission mode: `acceptEdits` (auto-accepts file edits)
- File checkpointing enabled for undo functionality
- MCP server integration via `mcpServers` option
- Session resume via `continue` and `resume` options
- Budget limits via `maxBudgetUsd` option

### Config Structure

```typescript
interface Config {
  model: string;              // Selected Claude model ID
  createdAt: string;          // ISO timestamp
  mcpServers?: Record<string, McpServerConfig>;  // MCP servers
  maxBudgetUsd?: number;      // Budget limit
  lastSessionId?: string;     // For session resume
}
```
