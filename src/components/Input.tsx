// User text input component with slash command autocomplete

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface InputProps {
  onSubmit: (value: string) => void;
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
  { command: '/help', description: 'Show help' },
];

export const Input: React.FC<InputProps> = ({ onSubmit, disabled = false }) => {
  const [value, setValue] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

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

      if (value.trim()) {
        onSubmit(value.trim());
        setValue('');
        setSelectedSuggestion(0);
      }
      return;
    }

    if (key.backspace || key.delete) {
      // Command+Backspace or Ctrl+Backspace: delete entire line
      if (key.meta || key.ctrl) {
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
