// Root component with routing logic

import React, { useState, useCallback } from 'react';
import { Box } from 'ink';
import { Onboarding } from './screens/Onboarding.tsx';
import { Chat } from './screens/Chat.tsx';
import { Config } from './screens/Config.tsx';
import { Mcp } from './screens/Mcp.tsx';
import { SessionPicker } from './screens/SessionPicker.tsx';
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
  const [sessionProps, setSessionProps] = useState({
    continueSession,
    resumeSessionId,
  });
  const [chatKey, setChatKey] = useState(0);

  const handleResumeSession = useCallback((sessionId?: string) => {
    if (!sessionId) {
      // No session ID provided, show picker
      setScreen('session-picker');
      return;
    }

    setSessionProps({
      continueSession: false,
      resumeSessionId: sessionId,
    });
    setChatKey(prev => prev + 1);
    setScreen('chat');
  }, []);

  if (isLoading) {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }

  if (isFirstRun || !config) {
    return (
      <Onboarding
        onComplete={async (newConfig: ConfigType) => {
          await updateConfig(newConfig);
        }}
      />
    );
  }

  if (screen === 'config') {
    return (
      <Config
        config={config}
        onSave={async (newConfig) => {
          await updateConfig(newConfig);
          setScreen('chat');
        }}
        onCancel={() => setScreen('chat')}
      />
    );
  }

  if (screen === 'mcp') {
    return (
      <Mcp
        config={config}
        mcpStatus={mcpStatus}
        onSave={async (newConfig) => {
          await updateConfig(newConfig);
          setScreen('chat');
        }}
        onCancel={() => setScreen('chat')}
      />
    );
  }

  if (screen === 'session-picker') {
    return (
      <SessionPicker
        onSelect={(sessionId) => {
          handleResumeSession(sessionId);
        }}
        onCancel={() => setScreen('chat')}
      />
    );
  }

  return (
    <Chat
      key={chatKey}
      config={config}
      continueSession={sessionProps.continueSession}
      resumeSessionId={sessionProps.resumeSessionId}
      onOpenConfig={() => setScreen('config')}
      onOpenMcp={() => setScreen('mcp')}
      onMcpStatusChange={setMcpStatus}
      onResumeSession={handleResumeSession}
    />
  );
};
