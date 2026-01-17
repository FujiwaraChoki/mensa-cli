# MCP Server Configuration

mensa supports the Model Context Protocol (MCP) for connecting to external tool servers. MCP servers can provide additional capabilities like database access, API integrations, file system access, and more.

## Server Types

### stdio (Local Process)

Runs a local command that communicates via stdin/stdout.

```bash
mensa mcp add <name> --command <cmd> [--args <args>] [--env <KEY=value>]
```

**Examples:**

```bash
# Filesystem access
mensa mcp add filesystem --command "npx" --args "@modelcontextprotocol/server-filesystem /home/user/projects"

# GitHub integration
mensa mcp add github --command "npx" --args "@modelcontextprotocol/server-github" --env GITHUB_TOKEN=ghp_xxx

# Slack integration
mensa mcp add slack --command "npx" --args "@anthropic/mcp-server-slack" --env SLACK_TOKEN=xoxb-xxx
```

### SSE (Server-Sent Events)

Connects to a remote server using Server-Sent Events transport.

```bash
mensa mcp add <name> --url <url> --type sse [--header <Key: value>]
```

**Example:**

```bash
mensa mcp add remote-tools --url "https://mcp.example.com/sse" --type sse
```

### HTTP (Streamable HTTP)

Connects to a remote server using HTTP transport.

```bash
mensa mcp add <name> --url <url> --type http [--header <Key: value>]
```

**Example:**

```bash
mensa mcp add context7 --url "https://mcp.context7.com/mcp" --type http \
  --header "CONTEXT7_API_KEY: ctx7sk-xxx"
```

## CLI Commands

### Add a server

```bash
# stdio server
mensa mcp add <name> --command <cmd> [--args <args>] [--env <KEY=value>]

# Remote server
mensa mcp add <name> --url <url> [--type sse|http] [--header <Key: value>]
```

Options can be repeated for multiple values:
```bash
mensa mcp add myserver --command "myserver" \
  --env API_KEY=xxx \
  --env DEBUG=true
```

### List servers

```bash
mensa mcp list
# or
mensa mcp ls
```

Output:
```
MCP Servers:
  filesystem (stdio): npx
  context7 (http): https://mcp.context7.com/mcp
```

### Remove a server

```bash
mensa mcp remove <name>
# or
mensa mcp rm <name>
```

### Help

```bash
mensa mcp help
# or
mensa mcp
```

## TUI Management

Use `/mcp` in the chat interface for a graphical server manager:

1. View all configured servers with status
2. Add new servers with a guided wizard
3. Remove servers interactively

Server status indicators:
- **connected** - Server is running and responding
- **pending** - Connecting...
- **failed** - Connection error
- **needs-auth** - Authentication required

## Configuration File

MCP servers are stored in `~/.mensa/config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home"]
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "ctx7sk-xxx"
      }
    }
  }
}
```

## Popular MCP Servers

### Official Anthropic Servers

| Server | Command | Description |
|--------|---------|-------------|
| Filesystem | `npx @modelcontextprotocol/server-filesystem <path>` | File access |
| GitHub | `npx @modelcontextprotocol/server-github` | GitHub API |
| Slack | `npx @anthropic/mcp-server-slack` | Slack integration |
| PostgreSQL | `npx @modelcontextprotocol/server-postgres` | Database access |

### Third-Party Servers

| Server | URL | Description |
|--------|-----|-------------|
| Context7 | `https://mcp.context7.com/mcp` | Library documentation |

## Troubleshooting

### Server shows "failed" status

1. Check if the command/URL is correct
2. For stdio servers, ensure the package is installed
3. For remote servers, check network connectivity
4. Verify authentication headers/env vars

### Permission denied

For stdio servers, ensure the command is executable:
```bash
which npx  # Should return a path
```

### Authentication errors

Double-check your API keys and tokens. For headers, use the format:
```bash
--header "Header-Name: header-value"
```

Note the space after the colon.

### Server not appearing in tools

1. Restart mensa after adding a server
2. Check `mensa mcp list` to verify configuration
3. Look for error messages in the status bar
