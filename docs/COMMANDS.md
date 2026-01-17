# Commands Reference

## CLI Commands

Commands you run from your terminal.

### Starting mensa

```bash
mensa                    # Start new session
mensa --continue         # Continue most recent session
mensa -c                 # Short form of --continue
mensa --resume <id>      # Resume specific session by ID
mensa --help             # Show help
mensa -h                 # Short form of --help
```

### MCP Server Management

```bash
mensa mcp                # Show MCP help
mensa mcp list           # List configured servers
mensa mcp ls             # Alias for list

# Add stdio server
mensa mcp add <name> --command <cmd> [--args <args>] [--env <KEY=value>]

# Add remote server
mensa mcp add <name> --url <url> [--type sse|http] [--header <Key: value>]

# Remove server
mensa mcp remove <name>
mensa mcp rm <name>      # Alias for remove
```

**Examples:**

```bash
# Local filesystem MCP
mensa mcp add fs --command "npx" --args "@modelcontextprotocol/server-filesystem ."

# Remote HTTP MCP with auth
mensa mcp add api --url "https://api.example.com/mcp" --type http --header "Authorization: Bearer token"

# Multiple environment variables
mensa mcp add myserver --command "./server" --env API_KEY=xxx --env DEBUG=1
```

### Budget Management

```bash
mensa budget             # Show current budget
mensa budget show        # Same as above
mensa budget set <amt>   # Set budget limit in USD
mensa budget clear       # Remove budget limit
```

**Examples:**

```bash
mensa budget set 5.00    # Limit spending to $5
mensa budget set 0.50    # Limit to 50 cents
mensa budget clear       # No limit
```

## In-App Commands

Commands you type in the chat interface. All start with `/`.

### Settings

| Command | Description |
|---------|-------------|
| `/config` | Open settings screen |
| `/settings` | Alias for /config |

Change your Claude model selection.

### MCP

| Command | Description |
|---------|-------------|
| `/mcp` | Open MCP server manager |

Interactive TUI for adding, viewing, and removing MCP servers.

### Undo

| Command | Description |
|---------|-------------|
| `/undo` | Revert last file changes |

Reverts any file modifications made by the last assistant response. Only available when changes can be undone (shown in status bar).

### Help

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |

### Exit

| Command | Description |
|---------|-------------|
| `exit` | Exit mensa |
| `quit` | Alias for exit |

## Keyboard Shortcuts

### Text Input

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit message |
| `Backspace` | Delete one character |
| `Option+Backspace` | Delete previous word |
| `Cmd+Backspace` | Delete entire line |
| `Ctrl+Backspace` | Delete entire line (alternative) |

### Slash Command Autocomplete

| Shortcut | Action |
|----------|--------|
| `Tab` | Complete selected suggestion |
| `Up Arrow` | Previous suggestion |
| `Down Arrow` | Next suggestion |
| `Enter` | Select and submit command |

### During Generation

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Interrupt current operation |

## Status Bar

The status bar at the bottom shows:

```
mensa · Sonnet 4.5 · 12.5K tokens · $0.02/$5.00 · 2 MCP · /undo
```

| Element | Description |
|---------|-------------|
| `mensa` | App name |
| `Sonnet 4.5` | Current model |
| `12.5K tokens` | Tokens used this session |
| `$0.02/$5.00` | Cost / budget limit |
| `2 MCP` | Number of MCP servers configured |
| `/undo` | Undo is available |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (invalid arguments, missing config, etc.) |
