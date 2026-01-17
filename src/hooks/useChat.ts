// Hook for Claude Agent SDK integration

import { useState, useCallback, useRef } from 'react';
import { query, type Query } from '@anthropic-ai/claude-agent-sdk';
import { saveLastSessionId } from '../utils/config.ts';
import type { Config, Message, Tool, UsageStats, SessionInfo, McpServerStatus } from '../types.ts';

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
  sendMessage: (prompt: string) => Promise<void>;
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

  const sendMessage = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);

    let assistantContent = '';

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

      const q = query({ prompt, options: queryOptions });
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
              assistantContent += block.text;
              // Update UI with streaming text
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = assistantContent;
                } else {
                  newMessages.push({ role: 'assistant', content: assistantContent });
                }
                return newMessages;
              });
            } else if ('name' in block) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `Error: ${err instanceof Error ? err.message : 'An error occurred'}` },
      ]);
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
