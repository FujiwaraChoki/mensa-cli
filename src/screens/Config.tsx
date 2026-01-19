// Configuration screen

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { MODELS } from '../types.ts';
import type { Config as ConfigType, ModelValue } from '../types.ts';

interface ConfigProps {
  config: ConfigType;
  onSave: (config: ConfigType) => void;
  onCancel: () => void;
}

type SettingSection = 'model' | 'vimMode';

export const Config: React.FC<ConfigProps> = ({ config, onSave, onCancel }) => {
  const [activeSection, setActiveSection] = useState<SettingSection>('model');

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      onCancel();
    }

    // Tab to switch sections
    if (key.tab) {
      setActiveSection(prev => prev === 'model' ? 'vimMode' : 'model');
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Settings</Text>
      </Box>

      {/* Model selection */}
      <Box marginBottom={1}>
        <Text dimColor={activeSection !== 'model'} bold={activeSection === 'model'}>
          {activeSection === 'model' ? '› ' : '  '}Model
        </Text>
      </Box>

      {activeSection === 'model' && (
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
      )}

      {/* Vim mode toggle */}
      <Box marginTop={1} marginBottom={1}>
        <Text dimColor={activeSection !== 'vimMode'} bold={activeSection === 'vimMode'}>
          {activeSection === 'vimMode' ? '› ' : '  '}Vim Mode
        </Text>
        <Text dimColor> - </Text>
        <Text color={config.vimMode ? 'green' : 'gray'}>
          {config.vimMode ? 'Enabled' : 'Disabled'}
        </Text>
      </Box>

      {activeSection === 'vimMode' && (
        <Select
          options={[
            { label: 'Disabled (Standard input)', value: 'disabled' },
            { label: 'Enabled (Vim keybindings)', value: 'enabled' },
          ]}
          defaultValue={config.vimMode ? 'enabled' : 'disabled'}
          onChange={(value) => {
            onSave({
              ...config,
              vimMode: value === 'enabled',
            });
          }}
        />
      )}

      <Box marginTop={1}>
        <Text dimColor>tab switch · esc cancel</Text>
      </Box>
    </Box>
  );
};
