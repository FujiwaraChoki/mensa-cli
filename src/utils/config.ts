// Config file I/O for ~/.mensa/config.json

import { homedir } from 'os';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import type { Config, McpServerConfig } from '../types.ts';

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
