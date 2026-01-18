// Markdown rendering component for terminal output

import React, { useMemo } from 'react';
import { Text } from 'ink';
import { Marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import chalk from 'chalk';

// Configure marked with terminal renderer - minimal padding, subtle colors
const marked = new Marked(
  markedTerminal({
    // Disable ## prefix before headings
    showSectionPrefix: false,
    // Headings - bold with subtle color difference
    firstHeading: chalk.bold.white,
    heading: chalk.bold.gray,
    // Code - yellow tint for visibility
    code: chalk.yellow,
    codespan: chalk.yellow,
    // Inline formatting
    strong: chalk.bold,
    em: chalk.italic,
    del: chalk.strikethrough.dim,
    // Links - blue and underlined
    link: chalk.blue,
    href: chalk.blue.underline,
    // Blockquotes - dimmed and italic
    blockquote: chalk.dim.italic,
    // Lists - default handling (no custom override)
    listitem: chalk.reset,
    // Horizontal rule
    hr: chalk.dim,
    // Tables
    table: chalk.reset,
    // Disable text reflowing to reduce weird spacing
    reflowText: false,
    // Smaller tab for indentation
    tab: 2,
    // Keep width reasonable
    width: 100,
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
      let output = typeof result === 'string' ? result : '';
      // Reduce excessive blank lines (3+ newlines -> 2)
      output = output.replace(/\n{3,}/g, '\n\n');
      // Remove leading/trailing whitespace
      return output.trim();
    } catch {
      // Fallback to plain text if parsing fails
      return children;
    }
  }, [children]);

  // Ink's Text component will render the ANSI-styled string
  return <Text>{rendered}</Text>;
};
