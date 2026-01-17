// Single message component

import React, { useEffect, useState, useRef } from 'react';
import { Box, Text } from 'ink';
import Image from 'ink-picture';
import { tmpdir } from 'os';
import { join } from 'path';
import { Markdown } from './Markdown.tsx';
import type { Message as MessageType, ContentBlock } from '../types.ts';

interface MessageProps {
  message: MessageType;
}

const CURSOR = '|';

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
      // Use stable ID based on data hash prefix to avoid re-renders
      id: `msg-img-${i}-${block.source.data.slice(0, 20)}`,
      data: block.source.data,
      mediaType: block.source.media_type,
    }));
};

// Save base64 image to temp file and return path
const saveToTempFile = async (id: string, data: string, mediaType: string): Promise<string> => {
  const ext = mediaType.split('/')[1] || 'png';
  const tempPath = join(tmpdir(), `mensa-${id}.${ext}`);
  const buffer = Buffer.from(data, 'base64');
  await Bun.write(tempPath, buffer);
  return tempPath;
};

// Component to render images from message content
const MessageImages: React.FC<{ images: Array<{ id: string; data: string; mediaType: string }> }> = ({ images }) => {
  const [tempPaths, setTempPaths] = useState<Record<string, string>>({});
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saveTempFiles = async () => {
      const newPaths: Record<string, string> = { ...tempPaths };
      let hasNew = false;

      for (const img of images) {
        if (!processedRef.current.has(img.id)) {
          processedRef.current.add(img.id);
          newPaths[img.id] = await saveToTempFile(img.id, img.data, img.mediaType);
          hasNew = true;
        }
      }

      if (hasNew) {
        setTempPaths(newPaths);
      }
    };

    if (images.length > 0) {
      saveTempFiles();
    }
  }, [images.map(i => i.id).join(',')]);

  if (images.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="row" gap={2} marginBottom={1}>
      {images.map((img) => (
        <Box key={img.id}>
          {tempPaths[img.id] ? (
            <Image
              src={tempPaths[img.id]}
              alt=""
              width={30}
              height={15}
            />
          ) : (
            <Text dimColor>[Image]</Text>
          )}
        </Box>
      ))}
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

  // Assistant messages get markdown rendering
  const textContent = getTextContent(content);
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text dimColor>{CURSOR} </Text>
        <Box flexDirection="column">
          <Markdown>{textContent}</Markdown>
        </Box>
      </Box>
    </Box>
  );
};
