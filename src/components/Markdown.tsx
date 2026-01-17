// Markdown rendering component for terminal output

import React, { useMemo } from 'react';
import { Text } from 'ink';
import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

// Configure marked with terminal renderer
const marked = new Marked(
  markedTerminal({
    // Customize colors/styles as needed
    code: (code: string) => code, // Keep code blocks simple
    blockquote: (quote: string) => quote,
    // Reduce heading prominence for chat context
    firstHeading: (text: string) => `\n${text}\n`,
    heading: (text: string) => `\n${text}\n`,
    // Make links visible but not too distracting
    link: (href: string, _title: string, text: string) => `${text} (${href})`,
    href: (href: string) => href,
    // Tables
    table: (header: string, body: string) => `\n${header}${body}\n`,
    // Lists
    listitem: (text: string) => `  - ${text}\n`,
  })
);

interface MarkdownProps {
  children: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  const rendered = useMemo(() => {
    if (!children) return '';

    try {
      // Parse markdown to terminal-formatted string
      const result = marked.parse(children);
      // Remove trailing newlines for cleaner output
      return (typeof result === 'string' ? result : '').trimEnd();
    } catch {
      // Fallback to plain text if parsing fails
      return children;
    }
  }, [children]);

  // Ink's Text component will render the ANSI-styled string
  return <Text>{rendered}</Text>;
};
