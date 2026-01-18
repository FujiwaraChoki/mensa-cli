// Scrollable message history component

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { Message } from './Message.tsx';
import type { Message as MessageType, ContentBlock, ToolContent } from '../types.ts';

interface MessageListProps {
  messages: MessageType[];
  isInputFocused?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isInputFocused = true }) => {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // Reserve lines for input, status bar, tool indicator, and some padding
  const reservedLines = 6;
  const visibleHeight = Math.max(5, (stdout?.rows || 24) - reservedLines);

  // Calculate total "weight" of messages (approximate lines each takes)
  const messageWeights = useMemo(() => {
    return messages.map((msg) => {
      // Handle array content (with text + tool blocks)
      if (Array.isArray(msg.content)) {
        return msg.content.reduce((weight, block: ContentBlock) => {
          if (block.type === 'text') {
            return weight + Math.ceil(block.text.length / 80) + 1;
          }
          if (block.type === 'tool') {
            // Estimate: Edit tools are ~10 lines (diff), others ~3
            return weight + ((block as ToolContent).tool.name === 'Edit' ? 10 : 3);
          }
          // Image blocks
          return weight + 1;
        }, 0);
      }
      // Rough estimate: 1 base + content length / 80 chars per line
      const contentLength = msg.content?.length || 0;
      return Math.max(1, Math.ceil(contentLength / 80) + 1);
    });
  }, [messages]);

  const totalWeight = messageWeights.reduce((a, b) => a + b, 0);
  const maxScroll = Math.max(0, totalWeight - visibleHeight);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      setScrollOffset(maxScroll);
    }
  }, [messages.length, maxScroll, autoScroll]);

  // Handle scroll input (when input is not focused or Shift is held)
  useInput((input, key) => {
    if (key.upArrow && key.shift) {
      setAutoScroll(false);
      setScrollOffset((prev) => Math.max(0, prev - 3));
    } else if (key.downArrow && key.shift) {
      setScrollOffset((prev) => {
        const newOffset = Math.min(maxScroll, prev + 3);
        if (newOffset >= maxScroll) {
          setAutoScroll(true);
        }
        return newOffset;
      });
    } else if (key.pageUp) {
      setAutoScroll(false);
      setScrollOffset((prev) => Math.max(0, prev - visibleHeight));
    } else if (key.pageDown) {
      setScrollOffset((prev) => {
        const newOffset = Math.min(maxScroll, prev + visibleHeight);
        if (newOffset >= maxScroll) {
          setAutoScroll(true);
        }
        return newOffset;
      });
    }
  });

  // Determine which messages to show based on scroll offset
  const visibleMessages = useMemo(() => {
    if (messages.length === 0) return [];

    let accumulated = 0;
    let startIdx = 0;
    let endIdx = messages.length;

    // Find start index based on scroll offset
    for (let i = 0; i < messages.length; i++) {
      if (accumulated >= scrollOffset) {
        startIdx = i;
        break;
      }
      accumulated += messageWeights[i];
    }

    // Find end index based on visible height
    accumulated = 0;
    for (let i = startIdx; i < messages.length; i++) {
      accumulated += messageWeights[i];
      if (accumulated > visibleHeight) {
        endIdx = i + 1;
        break;
      }
    }

    return messages.slice(startIdx, endIdx);
  }, [messages, messageWeights, scrollOffset, visibleHeight]);

  const showScrollIndicator = maxScroll > 0 && scrollOffset < maxScroll;

  return (
    <Box flexDirection="column" flexGrow={1}>
      {visibleMessages.map((message, index) => (
        <Message key={`${scrollOffset}-${index}`} message={message} />
      ))}
      {showScrollIndicator && (
        <Box justifyContent="center">
          <Box borderStyle="round" borderColor="gray" paddingX={1}>
            <Text>↑↓ Shift+Arrows to scroll • Page Up/Down</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
