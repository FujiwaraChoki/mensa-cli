// Config file I/O for ~/.mensa/config.json

import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readdir } from 'fs/promises';
import type { Config, McpServerConfig, SessionSummary } from '../types.ts';

const CONFIG_DIR = join(homedir(), '.mensa');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export { CONFIG_DIR, CONFIG_PATH };

export const loadConfig = async (): Promise<Config | null> => {
  try {
    const file = Bun.file(CONFIG_PATH);
    if (!(await file.exists())) {
      return null;
    }
    return await file.json();
  } catch {
    return null;
  }
};

export const saveConfig = async (config: Config): Promise<void> => {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
};

export const configExists = async (): Promise<boolean> => {
  try {
    const file = Bun.file(CONFIG_PATH);
    return await file.exists();
  } catch {
    return false;
  }
};

// MCP Server management functions

export const addMcpServer = async (
  name: string,
  serverConfig: McpServerConfig
): Promise<void> => {
  const config = await loadConfig();
  if (!config) {
    throw new Error('Config not found. Please run mensa first to initialize.');
  }

  const mcpServers = config.mcpServers || {};
  mcpServers[name] = serverConfig;

  await saveConfig({ ...config, mcpServers });
};

export const removeMcpServer = async (name: string): Promise<boolean> => {
  const config = await loadConfig();
  if (!config || !config.mcpServers || !config.mcpServers[name]) {
    return false;
  }

  delete config.mcpServers[name];
  await saveConfig(config);
  return true;
};

export const listMcpServers = async (): Promise<Record<string, McpServerConfig>> => {
  const config = await loadConfig();
  return config?.mcpServers || {};
};

export const getMcpServer = async (
  name: string
): Promise<McpServerConfig | null> => {
  const config = await loadConfig();
  return config?.mcpServers?.[name] || null;
};

// Session management

export const saveLastSessionId = async (sessionId: string): Promise<void> => {
  const config = await loadConfig();
  if (config) {
    await saveConfig({ ...config, lastSessionId: sessionId });
  }
};

export const getLastSessionId = async (): Promise<string | null> => {
  const config = await loadConfig();
  return config?.lastSessionId || null;
};

// Budget management

export const setBudgetLimit = async (maxBudgetUsd: number): Promise<void> => {
  const config = await loadConfig();
  if (config) {
    await saveConfig({ ...config, maxBudgetUsd });
  }
};

export const getBudgetLimit = async (): Promise<number | undefined> => {
  const config = await loadConfig();
  return config?.maxBudgetUsd;
};

// Session listing

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

// Get the project key for current working directory
const getProjectKey = (): string => {
  return process.cwd().replace(/\//g, '-');
};

// Parse first user message from session file
const parseSessionPreview = async (filePath: string): Promise<{ timestamp: Date; preview: string; cwd: string } | null> => {
  try {
    const file = Bun.file(filePath);
    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Find first non-meta user message
        if (entry.type === 'user' && !entry.isMeta && entry.message?.content) {
          const content = entry.message.content;
          let preview: string;

          if (Array.isArray(content)) {
            const textBlock = content.find((b: { type: string }) => b.type === 'text');
            preview = textBlock?.text || '[No text]';
          } else {
            preview = content;
          }

          // Truncate preview
          preview = preview.slice(0, 80).replace(/\n/g, ' ');
          if (preview.length === 80) preview += '...';

          return {
            timestamp: new Date(entry.timestamp),
            preview,
            cwd: entry.cwd || process.cwd(),
          };
        }
      } catch {
        // Skip malformed lines
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const listSessions = async (): Promise<SessionSummary[]> => {
  const projectKey = getProjectKey();
  const projectDir = join(CLAUDE_PROJECTS_DIR, projectKey);

  try {
    const files = await readdir(projectDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    const sessions: SessionSummary[] = [];

    for (const file of jsonlFiles) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = join(projectDir, file);
      const info = await parseSessionPreview(filePath);

      if (info) {
        sessions.push({
          id: sessionId,
          timestamp: info.timestamp,
          preview: info.preview,
          cwd: info.cwd,
        });
      }
    }

    // Sort by timestamp, most recent first
    sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return sessions;
  } catch {
    return [];
  }
};
