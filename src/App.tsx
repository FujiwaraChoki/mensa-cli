// Root component with routing logic

import React, { useState } from 'react';
import { Box } from 'ink';
import { TerminalInfoProvider } from 'ink-picture';
import { Onboarding } from './screens/Onboarding.tsx';
import { Chat } from './screens/Chat.tsx';
import { Config } from './screens/Config.tsx';
import { Mcp } from './screens/Mcp.tsx';
import { useConfig } from './hooks/useConfig.ts';
import { Spinner } from './components/Spinner.tsx';
import type { Config as ConfigType, Screen, McpServerStatus } from './types.ts';

interface AppProps {
  continueSession?: boolean;
  resumeSessionId?: string;
}

export const App: React.FC<AppProps> = ({ continueSession, resumeSessionId }) => {
  const { config, isLoading, isFirstRun, updateConfig } = useConfig();
  const [screen, setScreen] = useState<Screen>('chat');
  const [mcpStatus, setMcpStatus] = useState<McpServerStatus[]>([]);

  if (isLoading) {
    return (
      <TerminalInfoProvider>
        <Box>
          <Spinner />
        </Box>
      </TerminalInfoProvider>
    );
  }

  if (isFirstRun || !config) {
    return (
      <TerminalInfoProvider>
        <Onboarding
          onComplete={async (newConfig: ConfigType) => {
            await updateConfig(newConfig);
          }}
        />
      </TerminalInfoProvider>
    );
  }

  if (screen === 'config') {
    return (
      <TerminalInfoProvider>
        <Config
          config={config}
          onSave={async (newConfig) => {
            await updateConfig(newConfig);
            setScreen('chat');
          }}
          onCancel={() => setScreen('chat')}
        />
      </TerminalInfoProvider>
    );
  }

  if (screen === 'mcp') {
    return (
      <TerminalInfoProvider>
        <Mcp
          config={config}
          mcpStatus={mcpStatus}
          onSave={async (newConfig) => {
            await updateConfig(newConfig);
            setScreen('chat');
          }}
          onCancel={() => setScreen('chat')}
        />
      </TerminalInfoProvider>
    );
  }

  return (
    <TerminalInfoProvider>
      <Chat
        config={config}
        continueSession={continueSession}
        resumeSessionId={resumeSessionId}
        onOpenConfig={() => setScreen('config')}
        onOpenMcp={() => setScreen('mcp')}
        onMcpStatusChange={setMcpStatus}
      />
    </TerminalInfoProvider>
  );
};
