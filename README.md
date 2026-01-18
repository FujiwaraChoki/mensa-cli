# mensa-cli

[![npm version](https://img.shields.io/npm/v/mensa-cli.svg)](https://www.npmjs.com/package/mensa-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful terminal-based chat interface for Claude AI, built with Bun, React, and Ink. Powered by the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) for an agentic experience with full tool use capabilities.

> **Think Claude Code, but in your terminal with a clean TUI.**

## ✨ Highlights

- 🤖 **Agentic AI** - Claude can read/write files, run commands, search the web, and more
- 💬 **Session Management** - Continue conversations across terminal sessions
- 🔌 **MCP Support** - Connect to Model Context Protocol servers for extended capabilities
- 💰 **Budget Controls** - Set spending limits to manage costs
- ↩️ **Undo Support** - Revert file changes made by Claude
- 🎨 **Beautiful TUI** - Markdown rendering, syntax highlighting, and a polished interface

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [Configuration](#configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0+)
- An active [Claude Code](https://claude.ai/code) subscription (mensa uses your Claude Code authentication)

### From npm

```bash
bun install -g mensa-cli
```

### From Source

```bash
git clone https://github.com/FujiwaraChoki/mensa-cli.git
cd mensa-cli
bun install
bun run build
bun link
```

## Quick Start

1. **Authenticate** - Make sure you're logged into [Claude Code](https://claude.ai/code). mensa uses the same authentication.

2. **Launch mensa:**
   ```bash
   mensa
   ```

3. **First run** - You'll be guided through model selection (Sonnet 4.5 recommended).

4. **Start chatting!** Type your message and press Enter.

## Features

### Agentic Tools

mensa gives Claude access to powerful tools:

| Tool | Description |
|------|-------------|
| **Read/Write/Edit** | File operations with undo support |
| **Bash** | Execute shell commands |
| **Glob/Grep** | Search files and content |
| **WebFetch/WebSearch** | Browse the web |
| **TodoWrite** | Track tasks |

### Session Management

Continue previous conversations seamlessly:

```bash
mensa                    # Start new session
mensa --continue         # Resume most recent session
mensa -c                 # Short form
mensa --resume <id>      # Resume specific session by ID
```

### Undo Support

Made a mistake? Use `/undo` to revert file changes from the last assistant response. The status bar shows when undo is available.

### MCP Integration

Connect to [Model Context Protocol](https://modelcontextprotocol.io/) servers for extended capabilities:

```bash
# Add a filesystem MCP server
mensa mcp add fs --command "npx" --args "@modelcontextprotocol/server-filesystem ."

# Add a remote HTTP MCP server
mensa mcp add api --url "https://api.example.com/mcp" --type http

# List configured servers
mensa mcp list
```

See the full [MCP documentation](./docs/MCP.md) for more details.

### Budget Limits

Set spending limits to control costs:

```bash
mensa budget set 5.00   # Set $5 limit
mensa budget show       # View current limit
mensa budget clear      # Remove limit
```

The status bar shows your current spend vs. budget limit.

### Slash Commands

Type `/` in the chat to see available commands:

| Command | Description |
|---------|-------------|
| `/config` | Open settings (change model) |
| `/mcp` | Manage MCP servers |
| `/undo` | Revert file changes |
| `/help` | Show help |

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

### Available Models

Use `/config` or `/settings` in the app to change models:

| Model | Best For |
|-------|----------|
| Claude Sonnet 4.5 | Recommended for most tasks |
| Claude Opus 4.5 | Complex reasoning tasks |
| Claude Haiku 4.5 | Fast, simple tasks |

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

## Documentation

- [Commands Reference](./docs/COMMANDS.md) - Full list of CLI and in-app commands
- [MCP Servers](./docs/MCP.md) - Setting up Model Context Protocol servers

## Development

### Running Locally

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build the binary
bun run build
```

### Project Structure

```
mensa-cli/
├── src/
│   ├── index.tsx        # Entry point
│   ├── App.tsx          # Main app component
│   ├── components/      # React/Ink components
│   ├── hooks/           # Custom React hooks
│   ├── screens/         # Screen components
│   ├── utils/           # Utility functions
│   └── types.ts         # TypeScript types
├── docs/                # Documentation
└── dist/                # Compiled binary
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Authentication Issues

mensa uses your Claude Code authentication. Make sure you're logged in:
1. Install [Claude Code](https://claude.ai/code) if you haven't
2. Complete the authentication flow in Claude Code
3. Try running `mensa` again

### Session Not Resuming

Sessions are stored locally in `~/.mensa/`. If you clear this directory, session history is lost.

### MCP Server Not Connecting

1. Check the server is configured: `mensa mcp list`
2. Verify the command/URL is correct
3. Check authentication headers if required
4. See [MCP documentation](./docs/MCP.md) for detailed troubleshooting

## License

[MIT](./LICENSE) © [FujiwaraChoki](https://github.com/FujiwaraChoki)
