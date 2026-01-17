// First-run setup flow

import React, { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { Welcome } from '../components/Welcome.tsx';
import { useOnboarding } from '../hooks/useOnboarding.ts';
import { MODELS } from '../types.ts';
import type { Config, ModelValue } from '../types.ts';

interface OnboardingProps {
  onComplete: (config: Config) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { step, selectedModel, setSelectedModel, nextStep, isComplete } = useOnboarding();

  // Handle key press for welcome screen
  useInput((_input, _key) => {
    if (step === 'welcome') {
      nextStep();
    }
  });

  // Save config when onboarding is complete
  useEffect(() => {
    if (isComplete && selectedModel) {
      onComplete({
        model: selectedModel,
        createdAt: new Date().toISOString(),
      });
    }
  }, [isComplete, selectedModel, onComplete]);

  if (step === 'welcome') {
    return <Welcome />;
  }

  if (step === 'model-select') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Select your preferred model:</Text>
        </Box>
        <Select
          options={MODELS.map(m => ({ label: m.label, value: m.value }))}
          onChange={(value) => {
            setSelectedModel(value as ModelValue);
            nextStep();
          }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Text dimColor>Setting up...</Text>
    </Box>
  );
};
