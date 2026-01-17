// Image preview component for pending images above the input

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Image from 'ink-picture';
import { tmpdir } from 'os';
import { join } from 'path';
import type { PendingImage } from '../types.ts';

interface ImagePreviewProps {
  images: PendingImage[];
  onRemove?: (index: number) => void;
}

// Save base64 image to temp file and return path
const saveToTempFile = async (image: PendingImage): Promise<string> => {
  const ext = image.mediaType.split('/')[1] || 'png';
  const tempPath = join(tmpdir(), `mensa-${image.id}.${ext}`);
  const buffer = Buffer.from(image.data, 'base64');
  await Bun.write(tempPath, buffer);
  return tempPath;
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ images }) => {
  const [tempPaths, setTempPaths] = useState<Record<string, string>>({});

  // Save images to temp files when they change
  useEffect(() => {
    const saveTempFiles = async () => {
      const newPaths: Record<string, string> = {};
      for (const image of images) {
        if (!tempPaths[image.id]) {
          newPaths[image.id] = await saveToTempFile(image);
        } else {
          newPaths[image.id] = tempPaths[image.id];
        }
      }
      setTempPaths(newPaths);
    };
    saveTempFiles();
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row" gap={2}>
        {images.map((image, index) => (
          <Box key={image.id} flexDirection="column" alignItems="center">
            {tempPaths[image.id] ? (
              <Image
                src={tempPaths[image.id]}
                alt=""
                width={20}
                height={10}
              />
            ) : (
              <Text dimColor>Loading...</Text>
            )}
          </Box>
        ))}
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
