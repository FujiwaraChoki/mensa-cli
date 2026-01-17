// Configuration screen

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { MODELS } from '../types.ts';
import type { Config, ModelValue } from '../types.ts';

interface ConfigProps {
  config: Config;
  onSave: (config: Config) => void;
  onCancel: () => void;
}

export const Config: React.FC<ConfigProps> = ({ config, onSave, onCancel }) => {
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Settings</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Model</Text>
      </Box>

      <Select
        options={MODELS.map(m => ({ label: m.label, value: m.value }))}
        defaultValue={config.model}
        onChange={(value) => {
          onSave({
            ...config,
            model: value as ModelValue,
          });
        }}
      />

      <Box marginTop={1}>
        <Text dimColor>esc to cancel</Text>
      </Box>
    </Box>
  );
};
