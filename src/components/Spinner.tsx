// Loading indicator component

import React from 'react';
import { Box, Text } from 'ink';
import InkSpinner from 'ink-spinner';

interface SpinnerProps {
  description?: string;
}

const CURSOR = '▍';

export const Spinner: React.FC<SpinnerProps> = ({ description }) => (
  <Box marginTop={1}>
    <Text>{CURSOR} </Text>
    <Text dimColor>
      <InkSpinner type="dots" />
      {description ? ` ${description}` : ''}
    </Text>
  </Box>
);
