// Code diff visualization component for terminal

import React from 'react';
import { Box, Text } from 'ink';
import { parseDiffFromFile, type FileDiffMetadata, type ContextContent, type ChangeContent } from '@pierre/diffs';

interface DiffViewProps {
  oldString: string;
  newString: string;
  filePath: string;
  contextLines?: number;
}

export const DiffView: React.FC<DiffViewProps> = ({
  oldString,
  newString,
  filePath,
  contextLines = 3,
}) => {
  // Parse the diff using @pierre/diffs
  let diffMetadata: FileDiffMetadata;
  try {
    diffMetadata = parseDiffFromFile(
      { name: filePath, contents: oldString },
      { name: filePath, contents: newString }
    );
  } catch {
    // Fallback for simple display if diff parsing fails
    return (
      <Box flexDirection="column">
        <Text dimColor>  {filePath}</Text>
        <Text color="red">- {oldString.split('\n').join('\n- ')}</Text>
        <Text color="green">+ {newString.split('\n').join('\n+ ')}</Text>
      </Box>
    );
  }

  // Extract lines from hunks with context limiting
  const renderHunkContent = (content: ContextContent | ChangeContent, index: number) => {
    if (content.type === 'context') {
      // Limit context lines
      const lines = content.lines;
      const limitedLines = lines.length > contextLines * 2
        ? [...lines.slice(0, contextLines), '...', ...lines.slice(-contextLines)]
        : lines;

      return (
        <Box key={index} flexDirection="column">
          {limitedLines.map((line, i) => (
            <Text key={i} dimColor>  {line}</Text>
          ))}
        </Box>
      );
    }

    // Change content with deletions and additions
    return (
      <Box key={index} flexDirection="column">
        {content.deletions.map((line, i) => (
          <Text key={`del-${i}`} color="red">- {line}</Text>
        ))}
        {content.additions.map((line, i) => (
          <Text key={`add-${i}`} color="green">+ {line}</Text>
        ))}
      </Box>
    );
  };

  const hasChanges = diffMetadata.hunks.length > 0;

  if (!hasChanges) {
    return (
      <Box flexDirection="column">
        <Text dimColor>  {filePath}</Text>
        <Text dimColor>  (no changes)</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text dimColor>  {filePath}</Text>
      <Text dimColor>  {'─'.repeat(Math.min(40, filePath.length + 4))}</Text>
      {diffMetadata.hunks.map((hunk, hunkIndex) => (
        <Box key={hunkIndex} flexDirection="column">
          {hunk.hunkContent.map((content, contentIndex) =>
            renderHunkContent(content, contentIndex)
          )}
        </Box>
      ))}
    </Box>
  );
};
