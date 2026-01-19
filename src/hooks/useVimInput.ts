// Vim mode input handling hook
// Provides vim-like keybindings for terminal input

import { useState, useCallback } from 'react';

export type VimMode = 'normal' | 'insert';

interface VimInputState {
  value: string;
  cursorPos: number;
  mode: VimMode;
  pendingCommand: string; // For multi-key commands like 'dw'
}

interface VimInputActions {
  handleInput: (input: string, key: KeyInfo) => boolean; // Returns true if handled
  setValue: (value: string) => void;
  reset: () => void;
}

// Minimal key info needed for vim input - compatible with Ink's Key type
interface KeyInfo {
  upArrow?: boolean;
  downArrow?: boolean;
  leftArrow?: boolean;
  rightArrow?: boolean;
  return?: boolean;
  escape?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  tab?: boolean;
  backspace?: boolean;
  delete?: boolean;
}

export interface UseVimInputResult extends VimInputState, VimInputActions {}

// Find word boundaries
function findNextWordStart(text: string, pos: number): number {
  // Skip current word
  while (pos < text.length && !/\s/.test(text.charAt(pos))) {
    pos++;
  }
  // Skip whitespace
  while (pos < text.length && /\s/.test(text.charAt(pos))) {
    pos++;
  }
  return Math.min(pos, text.length);
}

function findPrevWordStart(text: string, pos: number): number {
  if (pos <= 0) return 0;
  pos--;
  // Skip whitespace
  while (pos > 0 && /\s/.test(text.charAt(pos))) {
    pos--;
  }
  // Skip current word
  while (pos > 0 && !/\s/.test(text.charAt(pos - 1))) {
    pos--;
  }
  return Math.max(pos, 0);
}

function findWordEnd(text: string, pos: number): number {
  if (pos >= text.length) return text.length;
  // Skip current position
  pos++;
  // Skip whitespace
  while (pos < text.length && /\s/.test(text.charAt(pos))) {
    pos++;
  }
  // Skip word
  while (pos < text.length && !/\s/.test(text.charAt(pos))) {
    pos++;
  }
  return pos;
}

export function useVimInput(): UseVimInputResult {
  const [state, setState] = useState<VimInputState>({
    value: '',
    cursorPos: 0,
    mode: 'insert', // Start in insert mode for easier onboarding
    pendingCommand: '',
  });

  const setValue = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      value,
      cursorPos: Math.min(prev.cursorPos, value.length),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      value: '',
      cursorPos: 0,
      mode: 'insert',
      pendingCommand: '',
    });
  }, []);

  const handleInput = useCallback((input: string, key: KeyInfo): boolean => {
    setState(prev => {
      const { value, cursorPos, mode, pendingCommand } = prev;

      // Handle Escape - always switch to normal mode
      if (key.escape) {
        return {
          ...prev,
          mode: 'normal',
          pendingCommand: '',
          // In vim, escape moves cursor back one if possible
          cursorPos: mode === 'insert' && cursorPos > 0 ? cursorPos - 1 : cursorPos,
        };
      }

      // INSERT MODE
      if (mode === 'insert') {
        // Regular typing
        if (!key.ctrl && !key.meta && !key.upArrow && !key.downArrow &&
            !key.return && !key.tab && !key.backspace && !key.delete &&
            !key.leftArrow && !key.rightArrow && input) {
          const newValue = value.slice(0, cursorPos) + input + value.slice(cursorPos);
          return {
            ...prev,
            value: newValue,
            cursorPos: cursorPos + input.length,
          };
        }

        // Backspace in insert mode
        if (key.backspace && cursorPos > 0) {
          const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          return {
            ...prev,
            value: newValue,
            cursorPos: cursorPos - 1,
          };
        }

        // Delete in insert mode
        if (key.delete && cursorPos < value.length) {
          const newValue = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
          return {
            ...prev,
            value: newValue,
          };
        }

        // Arrow keys in insert mode
        if (key.leftArrow && cursorPos > 0) {
          return { ...prev, cursorPos: cursorPos - 1 };
        }
        if (key.rightArrow && cursorPos < value.length) {
          return { ...prev, cursorPos: cursorPos + 1 };
        }

        // Let other keys pass through (handled by parent)
        return prev;
      }

      // NORMAL MODE
      const fullCommand = pendingCommand + input;

      // Single key commands
      switch (input) {
        // Mode switching
        case 'i': // Insert at cursor
          return { ...prev, mode: 'insert', pendingCommand: '' };

        case 'a': // Insert after cursor
          return {
            ...prev,
            mode: 'insert',
            cursorPos: Math.min(cursorPos + 1, value.length),
            pendingCommand: '',
          };

        case 'A': // Insert at end of line
          return {
            ...prev,
            mode: 'insert',
            cursorPos: value.length,
            pendingCommand: '',
          };

        case 'I': // Insert at beginning of line
          return {
            ...prev,
            mode: 'insert',
            cursorPos: 0,
            pendingCommand: '',
          };

        // Navigation
        case 'h': // Left
          if (!pendingCommand) {
            return {
              ...prev,
              cursorPos: Math.max(0, cursorPos - 1),
              pendingCommand: '',
            };
          }
          break;

        case 'l': // Right
          if (!pendingCommand) {
            return {
              ...prev,
              cursorPos: Math.min(value.length - 1, cursorPos + 1),
              pendingCommand: '',
            };
          }
          break;

        case 'w': // Word forward
          if (!pendingCommand) {
            return {
              ...prev,
              cursorPos: findNextWordStart(value, cursorPos),
              pendingCommand: '',
            };
          }
          break;

        case 'b': // Word backward
          if (!pendingCommand) {
            return {
              ...prev,
              cursorPos: findPrevWordStart(value, cursorPos),
              pendingCommand: '',
            };
          }
          break;

        case 'e': // End of word
          if (!pendingCommand) {
            const endPos = findWordEnd(value, cursorPos);
            return {
              ...prev,
              cursorPos: Math.max(0, endPos - 1),
              pendingCommand: '',
            };
          }
          break;

        case '0': // Beginning of line
          if (!pendingCommand) {
            return { ...prev, cursorPos: 0, pendingCommand: '' };
          }
          break;

        case '$': // End of line
          if (!pendingCommand) {
            return {
              ...prev,
              cursorPos: Math.max(0, value.length - 1),
              pendingCommand: '',
            };
          }
          break;

        case '^': // First non-whitespace
          if (!pendingCommand) {
            const match = value.match(/^\s*/);
            const pos = match ? match[0].length : 0;
            return {
              ...prev,
              cursorPos: Math.min(pos, value.length - 1),
              pendingCommand: '',
            };
          }
          break;

        // Deletion
        case 'x': // Delete character at cursor
          if (!pendingCommand && value.length > 0) {
            const newValue = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
            return {
              ...prev,
              value: newValue,
              cursorPos: Math.min(cursorPos, Math.max(0, newValue.length - 1)),
              pendingCommand: '',
            };
          }
          break;

        case 'X': // Delete character before cursor
          if (!pendingCommand && cursorPos > 0) {
            const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
            return {
              ...prev,
              value: newValue,
              cursorPos: cursorPos - 1,
              pendingCommand: '',
            };
          }
          break;

        case 'D': // Delete to end of line
          if (!pendingCommand) {
            const newValue = value.slice(0, cursorPos);
            return {
              ...prev,
              value: newValue,
              cursorPos: Math.max(0, newValue.length - 1),
              pendingCommand: '',
            };
          }
          break;

        case 'C': // Change to end of line
          if (!pendingCommand) {
            return {
              ...prev,
              value: value.slice(0, cursorPos),
              mode: 'insert',
              pendingCommand: '',
            };
          }
          break;

        case 's': // Substitute character
          if (!pendingCommand && value.length > 0) {
            const newValue = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
            return {
              ...prev,
              value: newValue,
              mode: 'insert',
              pendingCommand: '',
            };
          }
          break;

        case 'S': // Substitute line
          if (!pendingCommand) {
            return {
              ...prev,
              value: '',
              cursorPos: 0,
              mode: 'insert',
              pendingCommand: '',
            };
          }
          break;

        // Pending command starters
        case 'd': // Delete pending
        case 'c': // Change pending
          if (!pendingCommand) {
            return { ...prev, pendingCommand: input };
          }
          break;
      }

      // Multi-key commands
      if (fullCommand === 'dd') {
        // Delete entire line
        return {
          ...prev,
          value: '',
          cursorPos: 0,
          pendingCommand: '',
        };
      }

      if (fullCommand === 'cc') {
        // Change entire line
        return {
          ...prev,
          value: '',
          cursorPos: 0,
          mode: 'insert',
          pendingCommand: '',
        };
      }

      if (fullCommand === 'dw') {
        // Delete word forward
        const endPos = findWordEnd(value, cursorPos);
        const newValue = value.slice(0, cursorPos) + value.slice(endPos);
        return {
          ...prev,
          value: newValue,
          cursorPos: Math.min(cursorPos, Math.max(0, newValue.length - 1)),
          pendingCommand: '',
        };
      }

      if (fullCommand === 'db') {
        // Delete word backward
        const startPos = findPrevWordStart(value, cursorPos);
        const newValue = value.slice(0, startPos) + value.slice(cursorPos);
        return {
          ...prev,
          value: newValue,
          cursorPos: startPos,
          pendingCommand: '',
        };
      }

      if (fullCommand === 'de') {
        // Delete to end of word
        const endPos = findWordEnd(value, cursorPos);
        const newValue = value.slice(0, cursorPos) + value.slice(endPos);
        return {
          ...prev,
          value: newValue,
          cursorPos: Math.min(cursorPos, Math.max(0, newValue.length - 1)),
          pendingCommand: '',
        };
      }

      if (fullCommand === 'd$' || fullCommand === 'd0') {
        // Delete to end/beginning of line
        if (fullCommand === 'd$') {
          const newValue = value.slice(0, cursorPos);
          return {
            ...prev,
            value: newValue,
            cursorPos: Math.max(0, newValue.length - 1),
            pendingCommand: '',
          };
        } else {
          const newValue = value.slice(cursorPos);
          return {
            ...prev,
            value: newValue,
            cursorPos: 0,
            pendingCommand: '',
          };
        }
      }

      if (fullCommand === 'cw') {
        // Change word forward
        const endPos = findWordEnd(value, cursorPos);
        const newValue = value.slice(0, cursorPos) + value.slice(endPos);
        return {
          ...prev,
          value: newValue,
          mode: 'insert',
          pendingCommand: '',
        };
      }

      if (fullCommand === 'cb') {
        // Change word backward
        const startPos = findPrevWordStart(value, cursorPos);
        const newValue = value.slice(0, startPos) + value.slice(cursorPos);
        return {
          ...prev,
          value: newValue,
          cursorPos: startPos,
          mode: 'insert',
          pendingCommand: '',
        };
      }

      if (fullCommand === 'ce') {
        // Change to end of word
        const endPos = findWordEnd(value, cursorPos);
        const newValue = value.slice(0, cursorPos) + value.slice(endPos);
        return {
          ...prev,
          value: newValue,
          mode: 'insert',
          pendingCommand: '',
        };
      }

      if (fullCommand === 'c$' || fullCommand === 'c0') {
        // Change to end/beginning of line
        if (fullCommand === 'c$') {
          return {
            ...prev,
            value: value.slice(0, cursorPos),
            mode: 'insert',
            pendingCommand: '',
          };
        } else {
          return {
            ...prev,
            value: value.slice(cursorPos),
            cursorPos: 0,
            mode: 'insert',
            pendingCommand: '',
          };
        }
      }

      // Unknown command - cancel pending
      if (pendingCommand && !['d', 'c'].includes(input)) {
        return { ...prev, pendingCommand: '' };
      }

      // Arrow keys in normal mode
      if (key.leftArrow || input === 'h') {
        return {
          ...prev,
          cursorPos: Math.max(0, cursorPos - 1),
          pendingCommand: '',
        };
      }
      if (key.rightArrow || input === 'l') {
        return {
          ...prev,
          cursorPos: Math.min(Math.max(0, value.length - 1), cursorPos + 1),
          pendingCommand: '',
        };
      }

      return prev;
    });

    // Return true to indicate vim handled the input
    return true;
  }, []);

  return {
    ...state,
    handleInput,
    setValue,
    reset,
  };
}
