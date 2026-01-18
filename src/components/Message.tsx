// Single message component

import React from 'react';
import { Box, Text } from 'ink';
import { Markdown } from './Markdown.tsx';
import { ToolBlock } from './ToolBlock.tsx';
import type { Message as MessageType, ContentBlock, ToolContent } from '../types.ts';

interface MessageProps {
  message: MessageType;
}

const CURSOR = '▍';

// Helper to extract text from content (string or ContentBlock[])
const getTextContent = (content: string | ContentBlock[]): string => {
  if (typeof content === 'string') {
    return content;
  }
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('\n');
};

// Helper to extract images from content
const getImageBlocks = (content: string | ContentBlock[]): Array<{ id: string; data: string; mediaType: string }> => {
  if (typeof content === 'string') {
    return [];
  }
  return content
    .filter((block): block is { type: 'image'; source: { type: 'base64'; media_type: string; data: string } } =>
      block.type === 'image'
    )
    .map((block, i) => ({
      id: `msg-img-${i}-${block.source.data.slice(0, 20)}`,
      data: block.source.data,
      mediaType: block.source.media_type,
    }));
};

// Format file size for display
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

// Component to render images from message content (text-only fallback)
const MessageImages: React.FC<{ images: Array<{ id: string; data: string; mediaType: string }> }> = ({ images }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="row" gap={2} marginBottom={1}>
      {images.map((img) => {
        const ext = img.mediaType.split('/')[1] || 'image';
        const size = formatSize(Math.ceil(img.data.length * 0.75));
        return (
          <Box key={img.id} borderStyle="round" paddingX={1}>
            <Text color="cyan">[{ext.toUpperCase()}]</Text>
            <Text dimColor> {size}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const { role, content } = message;

  if (role === 'user') {
    const textContent = getTextContent(content);
    const images = getImageBlocks(content);
    const lines = textContent.split('\n');

    return (
      <Box flexDirection="column" marginTop={1}>
        {/* Render images first */}
        <MessageImages images={images} />
        {/* Render text content */}
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
    const textContent = getTextContent(content);
    const lines = textContent.split('\n');
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

  // Assistant messages - handle mixed content (text + tools)
  if (Array.isArray(content)) {
    return (
      <Box flexDirection="column" marginTop={1}>
        {content.map((block, i) => {
          if (block.type === 'text') {
            return (
              <Box key={i} flexDirection="column">
                <Markdown>{block.text}</Markdown>
              </Box>
            );
          }
          if (block.type === 'tool') {
            return <ToolBlock key={i} tool={(block as ToolContent).tool} />;
          }
          // Image blocks in assistant messages (rare)
          return null;
        })}
      </Box>
    );
  }

  // String content fallback
  return (
    <Box flexDirection="column" marginTop={1}>
      <Markdown>{content}</Markdown>
    </Box>
  );
};
