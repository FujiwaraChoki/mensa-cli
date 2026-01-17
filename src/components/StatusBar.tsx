// Bottom status bar component

import React from 'react';
import { Box, Text } from 'ink';
import type { UsageStats } from '../types.ts';

interface StatusBarProps {
  model: string;
  usage?: UsageStats;
  maxBudgetUsd?: number;
  canUndo?: boolean;
  mcpCount?: number;
}

const formatCost = (usd: number): string => {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
};

const formatTokens = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export const StatusBar: React.FC<StatusBarProps> = ({
  model,
  usage,
  maxBudgetUsd,
  canUndo,
  mcpCount,
}) => {
  const parts: string[] = [`mensa | ${model}`];

  // Add token/cost info if available
  if (usage && (usage.inputTokens > 0 || usage.outputTokens > 0)) {
    const totalTokens = usage.inputTokens + usage.outputTokens;
    parts.push(`${formatTokens(totalTokens)} tokens`);

    if (usage.totalCostUsd > 0) {
      let costStr = formatCost(usage.totalCostUsd);
      if (maxBudgetUsd) {
        costStr += `/${formatCost(maxBudgetUsd)}`;
      }
      parts.push(costStr);
    }
  }

  // Add MCP indicator
  if (mcpCount && mcpCount > 0) {
    parts.push(`${mcpCount} MCP`);
  }

  // Add undo indicator
  if (canUndo) {
    parts.push('/undo');
  }

  return (
    <Box marginTop={1}>
      <Text dimColor>{parts.join(' | ')}</Text>
    </Box>
  );
};
