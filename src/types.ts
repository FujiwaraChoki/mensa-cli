// Shared TypeScript types for mensa-cli

// MCP Server configuration types
export interface McpServerStdio {
  type?: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpServerSse {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

export interface McpServerHttp {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = McpServerStdio | McpServerSse | McpServerHttp;

export interface McpServerStatus {
  name: string;
  status: 'connected' | 'failed' | 'needs-auth' | 'pending';
  error?: string;
}

// Cost and usage tracking
export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  totalCostUsd: number;
}

// Session information
export interface SessionInfo {
  sessionId: string | null;
  canUndo: boolean;
  lastUserMessageId: string | null;
}

// Main config with MCP servers and budget
export interface Config {
  model: string;
  createdAt: string;
  mcpServers?: Record<string, McpServerConfig>;
  maxBudgetUsd?: number;
  lastSessionId?: string;
}

// Image content types for multimodal messages
export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface TextContent {
  type: 'text';
  text: string;
}

// Tool execution tracking
export interface ToolExecution {
  name: string;
  input: unknown;
  status: 'running' | 'completed' | 'error';
}

export interface ToolContent {
  type: 'tool';
  tool: ToolExecution;
}

// Edit tool input structure
export interface EditToolInput {
  file_path: string;
  old_string: string;
  new_string: string;
}

// Task tool input structure
export interface TaskToolInput {
  description: string;
  prompt: string;
  subagent_type: string;
}

export type ContentBlock = TextContent | ImageContent | ToolContent;

// Pending image waiting to be sent
export interface PendingImage {
  id: string;
  data: string;
  mediaType: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  uuid?: string; // For tracking user messages for undo
}

export interface Tool {
  name: string;
  input: unknown;
}

export type OnboardingStep = 'welcome' | 'model-select' | 'complete';

export const MODELS = [
  { label: 'Claude Sonnet 4.5 (Recommended)', value: 'claude-sonnet-4-5-20250929' },
  { label: 'Claude Opus 4.5', value: 'claude-opus-4-5-20251101' },
  { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5-20251001' },
] as const;

export type ModelValue = typeof MODELS[number]['value'];

// Screen types
export type Screen = 'chat' | 'config' | 'mcp' | 'session-picker';

// Session summary for session picker
export interface SessionSummary {
  id: string;
  timestamp: Date;
  preview: string;
  cwd: string;
}
