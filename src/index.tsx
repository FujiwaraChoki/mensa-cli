#!/usr/bin/env bun
// Entry point for mensa-cli

import React from 'react';
import { render } from 'ink';
import { App } from './App.tsx';
import {
  addMcpServer,
  removeMcpServer,
  listMcpServers,
  getLastSessionId,
  setBudgetLimit,
  getBudgetLimit,
} from './utils/config.ts';
import type { McpServerConfig } from './types.ts';

// Parse CLI arguments
const args = process.argv.slice(2);

// Handle MCP CLI commands (non-interactive)
const handleMcpCommands = async () => {
  if (args[0] !== 'mcp') return false;

  const subcommand = args[1];

  switch (subcommand) {
    case 'add': {
      // mensa mcp add <name> --command <cmd> [--args <args>] [--env <KEY=value>]
      // mensa mcp add <name> --url <url> [--type sse|http] [--header <Key: value>]
      const name = args[2];
      if (!name) {
        console.error('Usage: mensa mcp add <name> --command <cmd> [--args <args>] [--env <KEY=value>]');
        console.error('       mensa mcp add <name> --url <url> [--type sse|http] [--header <Key: value>]');
        process.exit(1);
      }

      const commandIdx = args.indexOf('--command');
      const urlIdx = args.indexOf('--url');
      const typeIdx = args.indexOf('--type');
      const argsIdx = args.indexOf('--args');

      // Parse all --header flags
      const parseHeaders = (): Record<string, string> | undefined => {
        const headers: Record<string, string> = {};
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '--header' && args[i + 1]) {
            const headerStr = args[i + 1];
            const colonIdx = headerStr.indexOf(':');
            if (colonIdx > 0) {
              const key = headerStr.slice(0, colonIdx).trim();
              const value = headerStr.slice(colonIdx + 1).trim();
              headers[key] = value;
            }
          }
        }
        return Object.keys(headers).length > 0 ? headers : undefined;
      };

      // Parse all --env flags
      const parseEnv = (): Record<string, string> | undefined => {
        const env: Record<string, string> = {};
        for (let i = 0; i < args.length; i++) {
          if (args[i] === '--env' && args[i + 1]) {
            const envStr = args[i + 1];
            const eqIdx = envStr.indexOf('=');
            if (eqIdx > 0) {
              const key = envStr.slice(0, eqIdx);
              const value = envStr.slice(eqIdx + 1);
              env[key] = value;
            }
          }
        }
        return Object.keys(env).length > 0 ? env : undefined;
      };

      if (commandIdx !== -1) {
        // stdio server
        const command = args[commandIdx + 1];
        if (!command) {
          console.error('--command requires a value');
          process.exit(1);
        }

        const serverArgs = argsIdx !== -1 ? args[argsIdx + 1]?.split(/\s+/) : undefined;
        const env = parseEnv();
        const config: McpServerConfig = { command, args: serverArgs, env };

        try {
          await addMcpServer(name, config);
          console.log(`Added MCP server: ${name}`);
        } catch (err) {
          console.error(`Failed to add server: ${err instanceof Error ? err.message : err}`);
          process.exit(1);
        }
      } else if (urlIdx !== -1) {
        // sse or http server
        const url = args[urlIdx + 1];
        const type = typeIdx !== -1 ? args[typeIdx + 1] : 'sse';

        if (!url) {
          console.error('--url requires a value');
          process.exit(1);
        }

        if (type !== 'sse' && type !== 'http') {
          console.error('--type must be "sse" or "http"');
          process.exit(1);
        }

        const headers = parseHeaders();
        const config: McpServerConfig = { type, url, headers };

        try {
          await addMcpServer(name, config);
          console.log(`Added MCP server: ${name}`);
        } catch (err) {
          console.error(`Failed to add server: ${err instanceof Error ? err.message : err}`);
          process.exit(1);
        }
      } else {
        console.error('Must specify either --command or --url');
        process.exit(1);
      }

      return true;
    }

    case 'remove':
    case 'rm': {
      const name = args[2];
      if (!name) {
        console.error('Usage: mensa mcp remove <name>');
        process.exit(1);
      }

      const success = await removeMcpServer(name);
      if (success) {
        console.log(`Removed MCP server: ${name}`);
      } else {
        console.error(`Server not found: ${name}`);
        process.exit(1);
      }
      return true;
    }

    case 'list':
    case 'ls': {
      const servers = await listMcpServers();
      const names = Object.keys(servers);

      if (names.length === 0) {
        console.log('No MCP servers configured');
      } else {
        console.log('MCP Servers:');
        for (const name of names) {
          const server = servers[name];
          const typeLabel = 'type' in server && server.type ? server.type : 'stdio';
          const detail = 'command' in server ? server.command : ('url' in server ? server.url : '');
          console.log(`  ${name} (${typeLabel}): ${detail}`);
        }
      }
      return true;
    }

    case 'help':
    default:
      console.log(`Usage: mensa mcp <command>

Commands:
  add <name> --command <cmd> [options]    Add a stdio MCP server
  add <name> --url <url> [options]        Add a remote MCP server
  remove <name>                           Remove an MCP server
  list                                    List configured MCP servers

Options for stdio servers:
  --args <args>           Arguments to pass (space-separated)
  --env <KEY=value>       Environment variable (can be repeated)

Options for remote servers:
  --type <sse|http>       Transport type (default: sse)
  --header <Key: value>   HTTP header (can be repeated)

Examples:
  mensa mcp add filesystem --command "npx" --args "@modelcontextprotocol/server-filesystem /home"
  mensa mcp add github --command "npx @modelcontextprotocol/server-github" --env GITHUB_TOKEN=xxx
  mensa mcp add remote --url "https://mcp.example.com/sse" --type sse
  mensa mcp add context7 --url "https://mcp.context7.com/mcp" --type http --header "CONTEXT7_API_KEY: xxx"
  mensa mcp remove filesystem
  mensa mcp list`);
      return true;
  }
};

// Handle budget CLI commands
const handleBudgetCommands = async () => {
  if (args[0] !== 'budget') return false;

  const subcommand = args[1];

  switch (subcommand) {
    case 'set': {
      const amount = parseFloat(args[2]);
      if (isNaN(amount) || amount <= 0) {
        console.error('Usage: mensa budget set <amount>');
        console.error('Example: mensa budget set 10.00');
        process.exit(1);
      }

      await setBudgetLimit(amount);
      console.log(`Budget limit set to $${amount.toFixed(2)}`);
      return true;
    }

    case 'clear': {
      await setBudgetLimit(0);
      console.log('Budget limit cleared');
      return true;
    }

    case 'show':
    default: {
      const budget = await getBudgetLimit();
      if (budget && budget > 0) {
        console.log(`Budget limit: $${budget.toFixed(2)}`);
      } else {
        console.log('No budget limit set');
      }
      return true;
    }
  }
};

// Handle help command
const handleHelp = () => {
  if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    console.log(`mensa - Terminal chat interface for Claude AI

Usage: mensa [options] [command]

Options:
  --continue, -c     Continue the most recent conversation
  --resume <id>      Resume a specific session by ID
  --help, -h         Show this help message

Commands:
  mcp                Manage MCP servers (add, remove, list)
  budget             Manage budget limits (set, clear, show)

In-app Commands:
  /config, /settings Open settings
  /mcp               Manage MCP servers
  /undo              Undo last file changes
  /help              Show help
  exit, quit         Exit mensa

Examples:
  mensa                      Start a new session
  mensa --continue           Continue last session
  mensa mcp add fs --command "npx @modelcontextprotocol/server-filesystem ."
  mensa budget set 5.00`);
    return true;
  }
  return false;
};

// Main entry point
const main = async () => {
  // Handle non-interactive CLI commands
  if (handleHelp()) {
    process.exit(0);
  }

  if (await handleMcpCommands()) {
    process.exit(0);
  }

  if (await handleBudgetCommands()) {
    process.exit(0);
  }

  // Parse flags for interactive mode
  const continueSession = args.includes('--continue') || args.includes('-c');
  const resumeIdx = args.indexOf('--resume');
  const resumeSessionId = resumeIdx !== -1 ? args[resumeIdx + 1] : undefined;

  // If --continue and no explicit session ID, try to get the last session
  let finalResumeId = resumeSessionId;
  if (continueSession && !resumeSessionId) {
    finalResumeId = (await getLastSessionId()) || undefined;
  }

  // Handle uncaught errors gracefully
  process.on('uncaughtException', (error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });

  process.on('unhandledRejection', (error) => {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  });

  // Render the app
  const { waitUntilExit, clear } = render(
    <App
      continueSession={continueSession}
      resumeSessionId={finalResumeId}
    />
  );

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clear();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clear();
    process.exit(0);
  });

  // Wait for app to exit
  await waitUntilExit();
  process.exit(0);
};

main();
