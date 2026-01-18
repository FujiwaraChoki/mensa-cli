// Session picker screen for /resume command

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { listSessions } from '../utils/config.ts';
import { Spinner } from '../components/Spinner.tsx';
import type { SessionSummary } from '../types.ts';

interface SessionPickerProps {
  onSelect: (sessionId: string) => void;
  onCancel: () => void;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const SessionPicker: React.FC<SessionPickerProps> = ({ onSelect, onCancel }) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listSessions().then(s => {
      setSessions(s);
      setIsLoading(false);
    });
  }, []);

  useInput((_, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  if (isLoading) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Resume Session</Text>
        </Box>
        <Spinner description="Loading sessions..." />
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Resume Session</Text>
        </Box>
        <Box marginBottom={1}>
          <Text dimColor>No previous sessions found for this project.</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>esc to go back</Text>
        </Box>
      </Box>
    );
  }

  const options = [
    ...sessions.slice(0, 10).map(s => ({
      label: `${formatDate(s.timestamp)} - ${s.preview}`,
      value: s.id,
    })),
    { label: 'Cancel', value: '__cancel__' },
  ];

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Resume Session</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Select a session to resume:</Text>
      </Box>

      <Select
        options={options}
        onChange={(value) => {
          if (value === '__cancel__') {
            onCancel();
          } else {
            onSelect(value);
          }
        }}
      />

      <Box marginTop={1}>
        <Text dimColor>esc to cancel</Text>
      </Box>
    </Box>
  );
};
