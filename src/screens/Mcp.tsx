// MCP Server configuration screen

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select, TextInput } from '@inkjs/ui';
import { listMcpServers, addMcpServer, removeMcpServer } from '../utils/config.ts';
import type { Config, McpServerConfig, McpServerStatus } from '../types.ts';

type McpView = 'list' | 'add' | 'add-type' | 'add-command' | 'add-args' | 'add-url' | 'remove';

interface McpProps {
  config: Config;
  mcpStatus: McpServerStatus[];
  onSave: (config: Config) => void;
  onCancel: () => void;
}

const SERVER_TYPES = [
  { label: 'stdio (local command)', value: 'stdio' },
  { label: 'sse (server-sent events)', value: 'sse' },
  { label: 'http (HTTP endpoint)', value: 'http' },
] as const;

export const Mcp: React.FC<McpProps> = ({ config, mcpStatus, onSave, onCancel }) => {
  const [view, setView] = useState<McpView>('list');
  const [servers, setServers] = useState<Record<string, McpServerConfig>>({});
  const [newServerName, setNewServerName] = useState('');
  const [newServerType, setNewServerType] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [newServerCommand, setNewServerCommand] = useState('');
  const [newServerArgs, setNewServerArgs] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load servers on mount
  useEffect(() => {
    listMcpServers().then(setServers);
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (view !== 'list') {
        setView('list');
        setError(null);
      } else {
        onCancel();
      }
    }
  });

  const getStatusIndicator = (name: string): string => {
    const status = mcpStatus.find(s => s.name === name);
    if (!status) return 'o';
    switch (status.status) {
      case 'connected': return '*';
      case 'failed': return 'x';
      case 'pending': return '~';
      case 'needs-auth': return '!';
      default: return 'o';
    }
  };

  const getStatusColor = (name: string): string | undefined => {
    const status = mcpStatus.find(s => s.name === name);
    if (!status) return 'gray';
    switch (status.status) {
      case 'connected': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'yellow';
      case 'needs-auth': return 'yellow';
      default: return 'gray';
    }
  };

  const handleAddServer = async () => {
    if (!newServerName.trim()) {
      setError('Server name is required');
      return;
    }

    try {
      let serverConfig: McpServerConfig;

      if (newServerType === 'stdio') {
        if (!newServerCommand.trim()) {
          setError('Command is required');
          return;
        }
        serverConfig = {
          command: newServerCommand.trim(),
          args: newServerArgs.trim() ? newServerArgs.trim().split(/\s+/) : undefined,
        };
      } else {
        if (!newServerUrl.trim()) {
          setError('URL is required');
          return;
        }
        serverConfig = {
          type: newServerType,
          url: newServerUrl.trim(),
        };
      }

      await addMcpServer(newServerName.trim(), serverConfig);

      // Update local state and config
      const updatedServers = { ...servers, [newServerName.trim()]: serverConfig };
      setServers(updatedServers);
      onSave({ ...config, mcpServers: updatedServers });

      // Reset form
      setNewServerName('');
      setNewServerCommand('');
      setNewServerArgs('');
      setNewServerUrl('');
      setView('list');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    }
  };

  const handleRemoveServer = async (name: string) => {
    const success = await removeMcpServer(name);
    if (success) {
      const updatedServers = { ...servers };
      delete updatedServers[name];
      setServers(updatedServers);
      onSave({ ...config, mcpServers: updatedServers });
    }
    setView('list');
  };

  const serverNames = Object.keys(servers);

  // List view
  if (view === 'list') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>MCP Servers</Text>
        </Box>

        {serverNames.length === 0 ? (
          <Box marginBottom={1}>
            <Text dimColor>No MCP servers configured</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginBottom={1}>
            {serverNames.map(name => {
              const server = servers[name];
              const typeLabel = 'type' in server && server.type ? server.type : 'stdio';
              const detail = 'command' in server ? server.command : ('url' in server ? server.url : '');

              return (
                <Box key={name}>
                  <Text color={getStatusColor(name)}>{getStatusIndicator(name)} </Text>
                  <Text bold>{name}</Text>
                  <Text dimColor> ({typeLabel}) </Text>
                  <Text dimColor>{detail}</Text>
                </Box>
              );
            })}
          </Box>
        )}

        <Box marginTop={1}>
          <Select
            options={[
              { label: 'Add server', value: 'add' },
              ...(serverNames.length > 0 ? [{ label: 'Remove server', value: 'remove' }] : []),
              { label: 'Back', value: 'back' },
            ]}
            onChange={(value) => {
              if (value === 'add') {
                setView('add');
              } else if (value === 'remove') {
                setView('remove');
              } else {
                onCancel();
              }
            }}
          />
        </Box>

        <Box marginTop={1}>
          <Text dimColor>esc to go back</Text>
        </Box>
      </Box>
    );
  }

  // Add server - name input
  if (view === 'add') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Add MCP Server</Text>
        </Box>

        <Box marginBottom={1}>
          <Text>Server name: </Text>
          <TextInput
            value={newServerName}
            onChange={setNewServerName}
            onSubmit={() => {
              if (newServerName.trim()) {
                setView('add-type');
              }
            }}
            placeholder="my-server"
          />
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>enter to continue, esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  // Add server - type selection
  if (view === 'add-type') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Add MCP Server: {newServerName}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text dimColor>Server type</Text>
        </Box>

        <Select
          options={SERVER_TYPES.map(t => ({ label: t.label, value: t.value }))}
          onChange={(value) => {
            setNewServerType(value as 'stdio' | 'sse' | 'http');
            if (value === 'stdio') {
              setView('add-command');
            } else {
              setView('add-url');
            }
          }}
        />

        <Box marginTop={1}>
          <Text dimColor>esc to go back</Text>
        </Box>
      </Box>
    );
  }

  // Add server - command input (for stdio)
  if (view === 'add-command') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Add MCP Server: {newServerName}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text>Command: </Text>
          <TextInput
            value={newServerCommand}
            onChange={setNewServerCommand}
            onSubmit={() => {
              if (newServerCommand.trim()) {
                setView('add-args');
              }
            }}
            placeholder="npx @modelcontextprotocol/server-filesystem"
          />
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>enter to continue, esc to go back</Text>
        </Box>
      </Box>
    );
  }

  // Add server - args input (for stdio)
  if (view === 'add-args') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Add MCP Server: {newServerName}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text>Arguments (space-separated, optional): </Text>
          <TextInput
            value={newServerArgs}
            onChange={setNewServerArgs}
            onSubmit={handleAddServer}
            placeholder="/path/to/directory"
          />
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>enter to add server, esc to go back</Text>
        </Box>
      </Box>
    );
  }

  // Add server - URL input (for sse/http)
  if (view === 'add-url') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Add MCP Server: {newServerName}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text>URL: </Text>
          <TextInput
            value={newServerUrl}
            onChange={setNewServerUrl}
            onSubmit={handleAddServer}
            placeholder="https://mcp.example.com/sse"
          />
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>enter to add server, esc to go back</Text>
        </Box>
      </Box>
    );
  }

  // Remove server
  if (view === 'remove') {
    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold>Remove MCP Server</Text>
        </Box>

        <Select
          options={[
            ...serverNames.map(name => ({ label: name, value: name })),
            { label: 'Cancel', value: '__cancel__' },
          ]}
          onChange={(value) => {
            if (value === '__cancel__') {
              setView('list');
            } else {
              handleRemoveServer(value);
            }
          }}
        />

        <Box marginTop={1}>
          <Text dimColor>esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  return null;
};
