// Image preview component for pending images above the input

import React from 'react';
import { Box, Text } from 'ink';
import type { PendingImage } from '../types.ts';

interface ImagePreviewProps {
  images: PendingImage[];
  onRemove?: (index: number) => void;
}

// Format file size for display
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ images }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row" gap={2}>
        {images.map((image, index) => {
          const ext = image.mediaType.split('/')[1] || 'image';
          const size = formatSize(Math.ceil(image.data.length * 0.75)); // base64 to bytes
          return (
            <Box key={image.id} borderStyle="round" paddingX={1}>
              <Text color="cyan">[{ext.toUpperCase()}]</Text>
              <Text dimColor> {size}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor italic>
          {images.length} image{images.length !== 1 ? 's' : ''} attached
          {images.length > 0 && ' | Ctrl+1-9 to remove'}
        </Text>
      </Box>
    </Box>
  );
};
