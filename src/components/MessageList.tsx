// Scrollable message history component

import React from 'react';
import { Box } from 'ink';
import { Message } from './Message.tsx';
import type { Message as MessageType } from '../types.ts';

interface MessageListProps {
  messages: MessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => (
  <Box flexDirection="column" flexGrow={1}>
    {messages.map((message, index) => (
      <Message key={index} message={message} />
    ))}
  </Box>
);
