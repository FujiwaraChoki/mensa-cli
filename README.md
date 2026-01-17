# mensa-cli Documentation

mensa is a terminal-based chat interface for Claude AI, built with Bun, React, and Ink. It uses the Claude Agent SDK to provide an agentic chat experience with tool use capabilities.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Configuration](#configuration)
- [Commands Reference](./COMMANDS.md)
- [MCP Servers](./MCP.md)

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
- Logged into Claude Code

### From Source

```bash
git clone <repository-url>
cd mensa-cli
bun install
bun run build
bun install --global .
```

### From npm (when published)

```bash
bun install -g mensa-cli
```

## Quick Start

1. Make sure you're authenticated with Claude Code.

2. Run mensa:
   ```bash
   mensa
   ```

3. On first run, you'll be guided through model selection.

4. Start chatting! Type your message and press Enter.

## Features

### Agentic Tools

mensa gives Claude access to powerful tools:
- **Read/Write/Edit** - File operations
- **Bash** - Execute shell commands
- **Glob/Grep** - Search files and content
- **WebFetch/WebSearch** - Browse the web
- **TodoWrite** - Track tasks

### Session Management

Continue previous conversations:
```bash
mensa --continue       # Resume most recent session
mensa --resume <id>    # Resume specific session by ID
```

### Undo Support

Made a mistake? Use `/undo` to revert file changes from the last assistant response.

### MCP Integration

Connect to Model Context Protocol servers for extended capabilities. See [MCP documentation](./MCP.md).

### Budget Limits

Set spending limits to control costs:
```bash
mensa budget set 5.00   # Set $5 limit
mensa budget show       # View current limit
mensa budget clear      # Remove limit
```

### Markdown Rendering

Assistant responses are rendered with proper markdown formatting including:
- Code blocks with syntax highlighting
- Headers, lists, and emphasis
- Links and inline code

### Slash Commands

Type `/` to see available commands with autocomplete:
- `/config` - Open settings
- `/mcp` - Manage MCP servers
- `/undo` - Revert file changes
- `/help` - Show help

## Configuration

Configuration is stored at `~/.mensa/config.json`:

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "mcpServers": {},
  "maxBudgetUsd": 10.00,
  "lastSessionId": "session-uuid"
}
```

### Changing Models

Use `/config` or `/settings` in the app to change the Claude model.

Available models:
- Claude Sonnet 4.5 (Recommended)
- Claude Opus 4.5
- Claude Haiku 4.5

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit message |
| `Ctrl+C` | Interrupt current operation |
| `Backspace` | Delete character |
| `Option+Backspace` | Delete word |
| `Cmd+Backspace` | Delete line |
| `Tab` | Complete slash command |
| `Up/Down` | Navigate suggestions |

## Troubleshooting

### Session not resuming

Sessions are stored locally. If you clear `~/.mensa/`, session history is lost.

### MCP server not connecting

1. Check the server is running: `mensa mcp list`
2. Verify the URL/command is correct
3. Check authentication headers if required

## License

MIT
