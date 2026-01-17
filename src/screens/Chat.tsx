// Main chat interface
// Codex-style layout with vertical bars

import React, { useEffect } from 'react';
import { Box, useApp, useInput } from 'ink';
import { MessageList } from '../components/MessageList.tsx';
import { Input } from '../components/Input.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { ToolIndicator } from '../components/ToolIndicator.tsx';
import { StatusBar } from '../components/StatusBar.tsx';
import { useChat } from '../hooks/useChat.ts';
import type { Config, McpServerStatus } from '../types.ts';

interface ChatProps {
  config: Config;
  continueSession?: boolean;
  resumeSessionId?: string;
  onOpenConfig: () => void;
  onOpenMcp: () => void;
  onMcpStatusChange?: (status: McpServerStatus[]) => void;
}

const formatModelName = (model: string): string => {
  // Extract readable model name from model ID
  // e.g., "claude-sonnet-4-5-20250514" -> "Sonnet 4.5"
  // e.g., "claude-opus-4-20250514" -> "Opus 4"
  const parts = model.split('-');
  if (parts.length >= 4) {
    const name = parts[1];
    const major = parts[2];
    const possibleMinor = parts[3];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    // Check if parts[3] is a date (all digits, 8 chars) or a version number
    if (/^\d{8}$/.test(possibleMinor)) {
      // No minor version, just major
      return `${capitalized} ${major}`;
    }
    return `${capitalized} ${major}.${possibleMinor}`;
  }
  return model;
};

export const Chat: React.FC<ChatProps> = ({
  config,
  continueSession,
  resumeSessionId,
  onOpenConfig,
  onOpenMcp,
  onMcpStatusChange,
}) => {
  const {
    messages,
    isLoading,
    currentTool,
    usage,
    session,
    mcpStatus,
    sendMessage,
    undo,
    interrupt,
  } = useChat(config, { continueSession, resumeSessionId });
  const { exit } = useApp();

  // Notify parent of MCP status changes
  useEffect(() => {
    if (onMcpStatusChange && mcpStatus.length > 0) {
      onMcpStatusChange(mcpStatus);
    }
  }, [mcpStatus, onMcpStatusChange]);

  // Handle Ctrl+C to interrupt
  useInput((input, key) => {
    if (key.ctrl && input === 'c' && isLoading) {
      interrupt();
    }
  });

  const handleSubmit = async (value: string) => {
    const cmd = value.toLowerCase().trim();

    // Exit commands
    if (cmd === 'exit' || cmd === 'quit') {
      exit();
      return;
    }

    // Settings commands
    if (cmd === '/config' || cmd === '/settings') {
      onOpenConfig();
      return;
    }

    // MCP commands
    if (cmd === '/mcp') {
      onOpenMcp();
      return;
    }

    // Undo command
    if (cmd === '/undo') {
      await undo();
      return;
    }

    // Help command
    if (cmd === '/help') {
      const helpMessage = `Available commands:
/config, /settings - Open settings
/mcp - Manage MCP servers
/undo - Undo last action (revert file changes)
/help - Show this help
exit, quit - Exit mensa

Shortcuts:
Ctrl+C - Interrupt current operation`;

      // Add help as a system message (we'll need to handle this specially)
      sendMessage('/help');
      return;
    }

    sendMessage(value);
  };

  const mcpCount = config.mcpServers ? Object.keys(config.mcpServers).length : 0;

  return (
    <Box flexDirection="column">
      <MessageList messages={messages} />
      {currentTool && <ToolIndicator tool={currentTool} />}
      {isLoading && !currentTool && <Spinner />}
      {isLoading && currentTool && <Spinner description={`Using ${currentTool.name}...`} />}
      <Input onSubmit={handleSubmit} disabled={isLoading} />
      <StatusBar
        model={formatModelName(config.model)}
        usage={usage}
        maxBudgetUsd={config.maxBudgetUsd}
        canUndo={session.canUndo}
        mcpCount={mcpCount}
      />
    </Box>
  );
};
