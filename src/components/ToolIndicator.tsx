// Shows when Claude uses a tool

import React from 'react';
import { Box, Text } from 'ink';
import type { Tool } from '../types.ts';

interface ToolIndicatorProps {
  tool: Tool;
}

const CURSOR = '|';

const formatToolInput = (input: unknown): string => {
  if (typeof input === 'string') return input.slice(0, 60);
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, unknown>;
    if ('file_path' in obj) return String(obj.file_path);
    if ('command' in obj) {
      const cmd = String(obj.command);
      return cmd.length > 50 ? cmd.slice(0, 47) + '...' : cmd;
    }
    if ('pattern' in obj) return String(obj.pattern);
    if ('path' in obj) return String(obj.path);
  }
  return '';
};

export const ToolIndicator: React.FC<ToolIndicatorProps> = ({ tool }) => {
  const target = formatToolInput(tool.input);
  return (
    <Box marginTop={1}>
      <Text>{CURSOR} </Text>
      <Text dimColor>{tool.name}{target ? ` ${target}` : ''}</Text>
    </Box>
  );
};
