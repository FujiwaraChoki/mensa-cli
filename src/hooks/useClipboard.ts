// Hook for accessing clipboard images on macOS

import { useCallback, useState } from 'react';
import type { PendingImage } from '../types.ts';

interface UseClipboardReturn {
  getClipboardImage: () => Promise<PendingImage | null>;
  getImageFromPath: (filePath: string) => Promise<PendingImage | null>;
  error: string | null;
  clearError: () => void;
}

// Image file extensions we support
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif'];

// Check if a string looks like an image file path
export const isImagePath = (str: string): boolean => {
  const cleaned = str.trim();
  const lower = cleaned.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
};

// AppleScript to check if clipboard contains image and extract it as base64 PNG
const CLIPBOARD_SCRIPT = `
use framework "AppKit"
use framework "Foundation"
use scripting additions

set pb to current application's NSPasteboard's generalPasteboard()
set imgTypes to {current application's NSPasteboardTypePNG, current application's NSPasteboardTypeTIFF, "public.jpeg"}

set hasImage to false
repeat with imgType in imgTypes
  if (pb's canReadItemWithDataConformingToTypes:{imgType}) as boolean then
    set hasImage to true
    exit repeat
  end if
end repeat

if not hasImage then
  return "NO_IMAGE"
end if

-- Try to get image data
set imgData to missing value
set imgType to ""

-- Try PNG first
set pngData to pb's dataForType:(current application's NSPasteboardTypePNG)
if pngData is not missing value then
  set imgData to pngData
  set imgType to "image/png"
else
  -- Try TIFF
  set tiffData to pb's dataForType:(current application's NSPasteboardTypeTIFF)
  if tiffData is not missing value then
    -- Convert TIFF to PNG
    set img to current application's NSImage's alloc()'s initWithData:tiffData
    if img is not missing value then
      set tiffRep to img's TIFFRepresentation()
      set bmpRep to current application's NSBitmapImageRep's imageRepWithData:tiffRep
      set imgData to (bmpRep's representationUsingType:(current application's NSPNGFileType) |properties|:(missing value))
      set imgType to "image/png"
    end if
  end if
end if

if imgData is missing value then
  return "NO_IMAGE"
end if

-- Convert to base64
set base64 to (imgData's base64EncodedStringWithOptions:0) as text
return imgType & ":" & base64
`;

export const useClipboard = (): UseClipboardReturn => {
  const [error, setError] = useState<string | null>(null);

  // Read image from a file path
  const getImageFromPath = useCallback(async (filePath: string): Promise<PendingImage | null> => {
    try {
      // Clean up the path:
      // - Trim whitespace
      // - Handle escaped spaces (\ ) -> space
      // - Handle quoted paths
      let cleanPath = filePath.trim();

      // Remove surrounding quotes if present
      if ((cleanPath.startsWith('"') && cleanPath.endsWith('"')) ||
          (cleanPath.startsWith("'") && cleanPath.endsWith("'"))) {
        cleanPath = cleanPath.slice(1, -1);
      }

      // Handle shell-escaped spaces
      cleanPath = cleanPath.replace(/\\ /g, ' ');

      // Also handle URL-encoded spaces
      cleanPath = cleanPath.replace(/%20/g, ' ');

      const file = Bun.file(cleanPath);
      const exists = await file.exists();

      if (!exists) {
        setError(`File not found: ${cleanPath.slice(-50)}`);
        return null;
      }

      const buffer = await file.arrayBuffer();
      const data = Buffer.from(buffer).toString('base64');

      // Determine media type from extension
      const ext = cleanPath.toLowerCase().split('.').pop() || 'png';
      const mediaTypeMap: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
      };
      const mediaType = mediaTypeMap[ext] || 'image/png';

      setError(null);

      return {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        data,
        mediaType,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read image');
      return null;
    }
  }, []);

  const getClipboardImage = useCallback(async (): Promise<PendingImage | null> => {
    // Check if we're on macOS
    if (process.platform !== 'darwin') {
      setError('Image paste only supported on macOS');
      return null;
    }

    try {
      const proc = Bun.spawn(['osascript', '-e', CLIPBOARD_SCRIPT], {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      const output = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      await proc.exited;

      if (stderr.trim()) {
        setError('Failed to access clipboard');
        return null;
      }

      const result = output.trim();

      if (result === 'NO_IMAGE') {
        setError('No image in clipboard');
        return null;
      }

      // Parse the result: "mediaType:base64data"
      const colonIndex = result.indexOf(':');
      if (colonIndex === -1) {
        setError('Failed to parse clipboard data');
        return null;
      }

      const mediaType = result.slice(0, colonIndex);
      const data = result.slice(colonIndex + 1);

      if (!data) {
        setError('Empty image data');
        return null;
      }

      setError(null);

      return {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        data,
        mediaType,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clipboard error');
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getClipboardImage,
    getImageFromPath,
    error,
    clearError,
  };
};
