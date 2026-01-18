// Persistent tool execution block in message history

import React from 'react';
import { Box, Text } from 'ink';
import { DiffView } from './DiffView.tsx';
import type { ToolExecution, EditToolInput, TaskToolInput } from '../types.ts';

interface ToolBlockProps {
  tool: ToolExecution;
}

const isEditToolInput = (input: unknown): input is EditToolInput => {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return 'file_path' in obj && 'old_string' in obj && 'new_string' in obj;
};

const isTaskToolInput = (input: unknown): input is TaskToolInput => {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return 'description' in obj && 'prompt' in obj;
};

const formatToolSummary = (name: string, input: unknown): string => {
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
    if ('url' in obj) return String(obj.url);
    if ('query' in obj) return String(obj.query);
  }
  return '';
};

export const ToolBlock: React.FC<ToolBlockProps> = ({ tool }) => {
  const { name, input, status } = tool;

  // Edit tool - show diff visualization
  if (name === 'Edit' && isEditToolInput(input)) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="cyan">{name}</Text>
          <Text dimColor> {input.file_path}</Text>
          {status === 'running' && <Text dimColor> ...</Text>}
        </Box>
        <Box marginLeft={2}>
          <DiffView
            filePath={input.file_path}
            oldString={input.old_string}
            newString={input.new_string}
          />
        </Box>
      </Box>
    );
  }

  // Task tool - show only description
  if (name === 'Task' && isTaskToolInput(input)) {
    return (
      <Box marginTop={1}>
        <Text color="magenta">{name}</Text>
        <Text dimColor>: {input.description}</Text>
        {status === 'running' && <Text dimColor> ...</Text>}
      </Box>
    );
  }

  // Other tools - show name + formatted summary
  const summary = formatToolSummary(name, input);
  return (
    <Box marginTop={1}>
      <Text color="yellow">{name}</Text>
      {summary && <Text dimColor> {summary}</Text>}
      {status === 'running' && <Text dimColor> ...</Text>}
    </Box>
  );
};
