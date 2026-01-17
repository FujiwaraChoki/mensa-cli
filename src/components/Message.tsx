// Single message component

import React from 'react';
import { Box, Text } from 'ink';
import { Markdown } from './Markdown.tsx';
import type { Message as MessageType } from '../types.ts';

interface MessageProps {
  message: MessageType;
}

const CURSOR = '|';

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { role, content } = message;

  if (role === 'user') {
    const lines = content.split('\n');
    return (
      <Box flexDirection="column" marginTop={1}>
        {lines.map((line, i) => (
          <Box key={i}>
            <Text>{CURSOR} </Text>
            <Text bold>{line}</Text>
          </Box>
        ))}
      </Box>
    );
  }

  if (role === 'system') {
    const lines = content.split('\n');
    return (
      <Box flexDirection="column" marginTop={1}>
        {lines.map((line, i) => (
          <Box key={i}>
            <Text>{CURSOR} </Text>
            <Text dimColor>{line}</Text>
          </Box>
        ))}
      </Box>
    );
  }

  // Assistant messages get markdown rendering
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text dimColor>{CURSOR} </Text>
        <Box flexDirection="column">
          <Markdown>{content}</Markdown>
        </Box>
      </Box>
    </Box>
  );
};
