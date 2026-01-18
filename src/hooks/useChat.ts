// Hook for Claude Agent SDK integration

import { useState, useCallback, useRef } from 'react';
import { query, type Query } from '@anthropic-ai/claude-agent-sdk';
import { saveLastSessionId } from '../utils/config.ts';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';
import type { Config, Message, Tool, UsageStats, SessionInfo, McpServerStatus, PendingImage, ContentBlock, ToolExecution, ToolContent } from '../types.ts';

// Send macOS notification
const sendNotification = (title: string, message: string) => {
  const script = `display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}"`;
  spawn('osascript', ['-e', script], { stdio: 'ignore', detached: true }).unref();
};

// Save image to temp file and return path
const saveImageToTemp = async (image: PendingImage): Promise<string> => {
  const ext = image.mediaType.split('/')[1] || 'png';
  const tempPath = join(tmpdir(), `mensa-send-${image.id}.${ext}`);
  const buffer = Buffer.from(image.data, 'base64');
  await Bun.write(tempPath, buffer);
  return tempPath;
};

interface UseChatOptions {
  continueSession?: boolean;
  resumeSessionId?: string;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  currentTool: Tool | null;
  error: string | null;
  usage: UsageStats;
  session: SessionInfo;
  mcpStatus: McpServerStatus[];
  sendMessage: (prompt: string, images?: PendingImage[]) => Promise<void>;
  undo: () => Promise<boolean>;
  interrupt: () => Promise<void>;
}

const ALLOWED_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
  'WebFetch', 'WebSearch', 'TodoWrite',
];

export const useChat = (config: Config, options: UseChatOptions = {}): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mcpStatus, setMcpStatus] = useState<McpServerStatus[]>([]);
  const [usage, setUsage] = useState<UsageStats>({
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
    totalCostUsd: 0,
  });
  const [session, setSession] = useState<SessionInfo>({
    sessionId: null,
    canUndo: false,
    lastUserMessageId: null,
  });

  const queryRef = useRef<Query | null>(null);
  const userMessageIds = useRef<string[]>([]);

  const sendMessage = useCallback(async (prompt: string, images?: PendingImage[]) => {
    setIsLoading(true);
    setError(null);

    // Build message content for display (with images)
    let messageContent: string | ContentBlock[];
    let actualPrompt = prompt;

    if (images && images.length > 0) {
      // Save images to temp files for Claude to read
      const imagePaths: string[] = [];
      for (const img of images) {
        const path = await saveImageToTemp(img);
        imagePaths.push(path);
      }

      // Build prompt with image references
      const imageRefs = imagePaths.map((p, i) => `[Image ${i + 1}: ${p}]`).join('\n');
      actualPrompt = `${imageRefs}\n\n${prompt || 'Please analyze these images.'}`;

      // For display, store the multimodal content
      const contentBlocks: ContentBlock[] = [
        ...images.map(img => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: img.mediaType,
            data: img.data,
          },
        })),
      ];
      if (prompt) {
        contentBlocks.push({ type: 'text' as const, text: prompt });
      }
      messageContent = contentBlocks;
    } else {
      messageContent = prompt;
    }

    // Add user message
    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build MCP server config if configured
      const mcpServers = config.mcpServers ? { ...config.mcpServers } : undefined;

      // Find Claude CLI executable path
      const findClaudePath = (): string | undefined => {
        const paths = [
          process.env.CLAUDE_CODE_PATH,
          `${process.env.HOME}/.local/bin/claude`,
          '/usr/local/bin/claude',
          `${process.env.HOME}/.claude/local/claude`,
        ];
        for (const p of paths) {
          if (p && Bun.file(p).size > 0) return p;
        }
        return undefined;
      };

      // Determine if we should continue or resume
      const queryOptions: Parameters<typeof query>[0]['options'] = {
        model: config.model,
        allowedTools: ALLOWED_TOOLS,
        permissionMode: 'acceptEdits',
        cwd: process.cwd(),
        enableFileCheckpointing: true, // Enable for undo functionality
        maxBudgetUsd: config.maxBudgetUsd,
        mcpServers,
        pathToClaudeCodeExecutable: findClaudePath(),
      };

      // Handle session continuation/resume
      if (options.continueSession) {
        queryOptions.continue = true;
      } else if (options.resumeSessionId) {
        queryOptions.resume = options.resumeSessionId;
      }

      // Use actualPrompt which includes image file paths for Claude to read
      const q = query({ prompt: actualPrompt, options: queryOptions });
      queryRef.current = q;

      for await (const message of q) {
        // Handle system init message for session info
        if (message.type === 'system' && 'subtype' in message && message.subtype === 'init') {
          const initMsg = message as { session_id: string; mcp_servers?: Array<{ name: string; status: string }> };
          setSession(prev => ({
            ...prev,
            sessionId: initMsg.session_id,
          }));

          // Save session ID for future resume
          await saveLastSessionId(initMsg.session_id);

          // Update MCP status
          if (initMsg.mcp_servers) {
            setMcpStatus(initMsg.mcp_servers.map(s => ({
              name: s.name,
              status: s.status as McpServerStatus['status'],
            })));
          }
        }

        if (message.type === 'user' && message.uuid) {
          // Track user message IDs for undo
          userMessageIds.current.push(message.uuid);
          setSession(prev => ({
            ...prev,
            lastUserMessageId: message.uuid!,
            canUndo: userMessageIds.current.length > 1,
          }));
        }

        if (message.type === 'assistant') {
          for (const block of message.message.content) {
            if ('text' in block) {
              // Update message content preserving block order
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];

                if (lastMsg?.role === 'assistant') {
                  // Get current content as array
                  const content: ContentBlock[] = Array.isArray(lastMsg.content)
                    ? [...lastMsg.content]
                    : lastMsg.content
                      ? [{ type: 'text', text: lastMsg.content }]
                      : [];

                  // Check if last block is text - if so, append to it (streaming continuation)
                  const lastBlock = content[content.length - 1];
                  if (lastBlock && lastBlock.type === 'text') {
                    content[content.length - 1] = { type: 'text', text: lastBlock.text + block.text };
                  } else {
                    // Add new text block (text after a tool)
                    content.push({ type: 'text', text: block.text });
                  }

                  lastMsg.content = content;
                } else {
                  // Create new assistant message with array content
                  newMessages.push({
                    role: 'assistant',
                    content: [{ type: 'text', text: block.text }]
                  });
                }
                return newMessages;
              });
            } else if ('name' in block) {
              // Create tool execution entry
              const toolExecution: ToolExecution = {
                name: block.name,
                input: block.input,
                status: 'running',
              };

              // Add tool block at current position
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  // Convert content to array if needed
                  const content: ContentBlock[] = Array.isArray(lastMsg.content)
                    ? [...lastMsg.content]
                    : lastMsg.content
                      ? [{ type: 'text', text: lastMsg.content }]
                      : [];
                  content.push({ type: 'tool', tool: toolExecution } as ToolContent);
                  lastMsg.content = content;
                }
                return newMessages;
              });

              // Also set currentTool for active indicator
              setCurrentTool({ name: block.name, input: block.input });
            }
          }
        } else if (message.type === 'result') {
          setCurrentTool(null);

          // Update usage stats
          if ('usage' in message && message.usage) {
            const u = message.usage;
            setUsage({
              inputTokens: u.input_tokens || 0,
              outputTokens: u.output_tokens || 0,
              cacheReadInputTokens: u.cache_read_input_tokens || 0,
              cacheCreationInputTokens: u.cache_creation_input_tokens || 0,
              totalCostUsd: 'total_cost_usd' in message ? (message as { total_cost_usd: number }).total_cost_usd : 0,
            });
          }
        }
      }
    sendNotification('Mensa', 'Response complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Error: ${err instanceof Error ? err.message : 'An error occurred'}` },
      ]);
      sendNotification('Mensa', 'Error occurred');
    } finally {
      setIsLoading(false);
      setCurrentTool(null);
      queryRef.current = null;
    }
  }, [config.model, config.mcpServers, config.maxBudgetUsd, options.continueSession, options.resumeSessionId]);

  const undo = useCallback(async (): Promise<boolean> => {
    if (!queryRef.current || userMessageIds.current.length < 2) {
      setMessages(prev => [
        ...prev,
        { role: 'system', content: 'Nothing to undo.' },
      ]);
      return false;
    }

    try {
      // Get the second-to-last user message ID to rewind to
      const targetMessageId = userMessageIds.current[userMessageIds.current.length - 2];

      const result = await queryRef.current.rewindFiles(targetMessageId);

      if (result.canRewind) {
        // Remove the last user message ID
        userMessageIds.current.pop();

        setMessages(prev => [
          ...prev,
          {
            role: 'system',
            content: `Undo successful. ${result.filesChanged?.length || 0} files reverted.`,
          },
        ]);

        setSession(prev => ({
          ...prev,
          lastUserMessageId: userMessageIds.current[userMessageIds.current.length - 1] || null,
          canUndo: userMessageIds.current.length > 1,
        }));

        return true;
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `Cannot undo: ${result.error || 'Unknown error'}` },
        ]);
        return false;
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Undo failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ]);
      return false;
    }
  }, []);

  const interrupt = useCallback(async () => {
    if (queryRef.current) {
      try {
        await queryRef.current.interrupt();
        setMessages(prev => [
          ...prev,
          { role: 'system', content: 'Interrupted.' },
        ]);
      } catch {
        // Ignore interrupt errors
      }
    }
    setIsLoading(false);
    setCurrentTool(null);
  }, []);

  return {
    messages,
    isLoading,
    currentTool,
    error,
    usage,
    session,
    mcpStatus,
    sendMessage,
    undo,
    interrupt,
  };
};
