// Welcome splash for onboarding

import React from 'react';
import { Box, Text } from 'ink';

const LOGO = `
  ███╗   ███╗███████╗███╗   ██╗███████╗ █████╗
  ████╗ ████║██╔════╝████╗  ██║██╔════╝██╔══██╗
  ██╔████╔██║█████╗  ██╔██╗ ██║███████╗███████║
  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║╚════██║██╔══██║
  ██║ ╚═╝ ██║███████╗██║ ╚████║███████║██║  ██║
  ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
`;

export const Welcome: React.FC = () => (
  <Box flexDirection="column" alignItems="center">
    <Text>{LOGO}</Text>
    <Text dimColor>your minimal coding companion</Text>
    <Box marginTop={2}>
      <Text dimColor>Press any key to continue...</Text>
    </Box>
  </Box>
);
