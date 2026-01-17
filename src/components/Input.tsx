// User text input component with slash command autocomplete and image paste

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { ImagePreview } from './ImagePreview.tsx';
import { useClipboard, isImagePath } from '../hooks/useClipboard.ts';
import type { PendingImage } from '../types.ts';

interface InputProps {
  onSubmit: (value: string, images?: PendingImage[]) => void;
  disabled?: boolean;
}

const PROMPT = '>';
const CURSOR = '|';

// Available slash commands
const SLASH_COMMANDS = [
  { command: '/config', description: 'Open settings' },
  { command: '/settings', description: 'Open settings' },
  { command: '/mcp', description: 'Manage MCP servers' },
  { command: '/undo', description: 'Undo last file changes' },
  { command: '/image', description: 'Attach image by path' },
  { command: '/help', description: 'Show help' },
];

const MAX_PENDING_IMAGES = 5;

export const Input: React.FC<InputProps> = ({ onSubmit, disabled = false }) => {
  const [value, setValue] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const prevValueRef = useRef('');
  const processingPathRef = useRef(false);

  const { getClipboardImage, getImageFromPath, error: clipboardError, clearError } = useClipboard();

  // Show clipboard errors briefly
  useEffect(() => {
    if (clipboardError) {
      setStatusMessage(clipboardError);
      const timer = setTimeout(() => {
        setStatusMessage(null);
        clearError();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [clipboardError, clearError]);

  // Detect pasted image paths and load them automatically
  // Use a debounce to wait for the paste to complete
  useEffect(() => {
    // Skip if already processing or disabled or empty
    if (processingPathRef.current || disabled || !value.trim()) return;

    // Check if this looks like an image path (starts with / or ~ and ends with image ext)
    const trimmedValue = value.trim();
    if (!isImagePath(trimmedValue)) return;
    if (!trimmedValue.startsWith('/') && !trimmedValue.startsWith('~')) return;

    // Debounce to wait for paste to complete
    const timer = setTimeout(async () => {
      // Re-check conditions after debounce
      if (processingPathRef.current || !isImagePath(value.trim())) return;

      if (pendingImages.length >= MAX_PENDING_IMAGES) {
        setStatusMessage(`Max ${MAX_PENDING_IMAGES} images allowed`);
        setTimeout(() => setStatusMessage(null), 2000);
        return;
      }

      processingPathRef.current = true;
      setStatusMessage('Loading image...');

      const image = await getImageFromPath(value.trim());
      if (image) {
        setPendingImages(prev => [...prev, image]);
        setValue(''); // Clear the path from input
        prevValueRef.current = '';
        setStatusMessage('Image added');
        setTimeout(() => setStatusMessage(null), 1500);
      } else {
        // Keep the path if loading failed so user can see what happened
        // Error message is set by getImageFromPath via clipboardError
        setTimeout(() => setStatusMessage(null), 3000);
      }

      processingPathRef.current = false;
    }, 300); // Wait 300ms for paste to complete

    return () => clearTimeout(timer);
  }, [value, disabled, getImageFromPath, pendingImages.length]);

  // Handle /image command to manually add image by path
  const handleImageCommand = useCallback(async (path: string) => {
    if (pendingImages.length >= MAX_PENDING_IMAGES) {
      setStatusMessage(`Max ${MAX_PENDING_IMAGES} images allowed`);
      setTimeout(() => setStatusMessage(null), 2000);
      return;
    }

    setStatusMessage('Loading image...');
    const image = await getImageFromPath(path);
    if (image) {
      setPendingImages(prev => [...prev, image]);
      setStatusMessage('Image added');
    } else {
      setStatusMessage('Failed to load image');
    }
    setTimeout(() => setStatusMessage(null), 1500);
  }, [getImageFromPath, pendingImages.length]);

  // Handle pasting images from clipboard
  const handlePaste = useCallback(async () => {
    if (pendingImages.length >= MAX_PENDING_IMAGES) {
      setStatusMessage(`Max ${MAX_PENDING_IMAGES} images allowed`);
      setTimeout(() => setStatusMessage(null), 2000);
      return;
    }

    const image = await getClipboardImage();
    if (image) {
      setPendingImages(prev => [...prev, image]);
      setStatusMessage('Image added');
      setTimeout(() => setStatusMessage(null), 1500);
    }
  }, [getClipboardImage, pendingImages.length]);

  // Remove an image by index
  const removeImage = useCallback((index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    if (disabled) {
      setCursorVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);

    return () => clearInterval(interval);
  }, [disabled]);

  // Get matching suggestions when input starts with /
  const suggestions = useMemo(() => {
    if (!value.startsWith('/') || value.includes(' ')) {
      return [];
    }
    const query = value.toLowerCase();
    return SLASH_COMMANDS.filter(cmd =>
      cmd.command.toLowerCase().startsWith(query)
    );
  }, [value]);

  // Reset selection when suggestions change
  useMemo(() => {
    setSelectedSuggestion(0);
  }, [suggestions.length]);

  useInput((input, key) => {
    if (disabled) return;

    // Handle Cmd+V or Ctrl+V for paste
    if ((key.meta || key.ctrl) && input === 'v') {
      handlePaste();
      return;
    }

    // Handle Ctrl+1-9 to remove images
    if (key.ctrl && input >= '1' && input <= '9') {
      const index = parseInt(input, 10) - 1;
      if (index < pendingImages.length) {
        removeImage(index);
      }
      return;
    }

    // Handle tab completion
    if (key.tab && suggestions.length > 0) {
      const suggestion = suggestions[selectedSuggestion];
      if (suggestion) {
        setValue(suggestion.command);
      }
      return;
    }

    // Navigate suggestions with up/down arrows
    if (key.upArrow && suggestions.length > 0) {
      setSelectedSuggestion(prev =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
      return;
    }

    if (key.downArrow && suggestions.length > 0) {
      setSelectedSuggestion(prev =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (key.return) {
      // If we have suggestions and user presses enter, use the selected one
      if (suggestions.length > 0 && value === suggestions[selectedSuggestion]?.command.slice(0, value.length)) {
        const selected = suggestions[selectedSuggestion];
        if (selected && value !== selected.command) {
          // Complete the command first
          setValue(selected.command);
          return;
        }
      }

      // Handle /image command locally
      if (value.trim().toLowerCase().startsWith('/image ')) {
        const imagePath = value.trim().slice(7).trim();
        if (imagePath) {
          handleImageCommand(imagePath);
          setValue('');
          prevValueRef.current = '';
          setSelectedSuggestion(0);
        }
        return;
      }

      // Submit if there's text or images
      if (value.trim() || pendingImages.length > 0) {
        const imagesToSend = pendingImages.length > 0 ? [...pendingImages] : undefined;
        onSubmit(value.trim(), imagesToSend);
        setValue('');
        prevValueRef.current = '';
        setPendingImages([]);
        setSelectedSuggestion(0);
      }
      return;
    }

    if (key.backspace || key.delete) {
      // Command+Backspace: delete entire line (but not on Ctrl since we use that for paste)
      if (key.meta) {
        setValue('');
        return;
      }
      // Option+Backspace (Alt): delete previous word
      if (key.alt) {
        setValue(v => {
          const trimmed = v.trimEnd();
          const lastSpace = trimmed.lastIndexOf(' ');
          if (lastSpace === -1) return '';
          return v.slice(0, lastSpace + 1);
        });
        return;
      }
      // Regular backspace: delete one character
      setValue(v => v.slice(0, -1));
      return;
    }

    if (key.ctrl || key.meta || key.escape || key.leftArrow || key.rightArrow) {
      return;
    }

    setValue(v => v + input);
  });

  const showSuggestions = suggestions.length > 0 && value.length > 0;

  return (
    <Box flexDirection="column" marginTop={1}>
      {/* Show pending images */}
      <ImagePreview images={pendingImages} onRemove={removeImage} />

      {/* Show status message (e.g., clipboard errors) */}
      {statusMessage && (
        <Box marginBottom={1}>
          <Text color="yellow">{statusMessage}</Text>
        </Box>
      )}

      <Box>
        <Text color="green" bold>{PROMPT} </Text>
        <Text>{value}</Text>
        <Text color="green">{cursorVisible ? CURSOR : ' '}</Text>
      </Box>
      {showSuggestions && (
        <Box flexDirection="column" marginTop={1}>
          {suggestions.map((suggestion, index) => (
            <Box key={suggestion.command}>
              <Text
                color={index === selectedSuggestion ? 'cyan' : undefined}
                bold={index === selectedSuggestion}
              >
                {index === selectedSuggestion ? '> ' : '  '}
                {suggestion.command}
              </Text>
              <Text dimColor> - {suggestion.description}</Text>
            </Box>
          ))}
          <Box marginTop={0}>
            <Text dimColor italic>up/down navigate | tab complete | enter select</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
