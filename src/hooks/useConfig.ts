// Hook for loading and managing config

import { useState, useEffect } from 'react';
import { loadConfig, saveConfig } from '../utils/config.ts';
import type { Config } from '../types.ts';

interface UseConfigReturn {
  config: Config | null;
  isLoading: boolean;
  isFirstRun: boolean;
  updateConfig: (config: Config) => Promise<void>;
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);

  useEffect(() => {
    const init = async () => {
      const loaded = await loadConfig();
      if (loaded) {
        setConfig(loaded);
        setIsFirstRun(false);
      } else {
        setIsFirstRun(true);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const updateConfig = async (newConfig: Config) => {
    await saveConfig(newConfig);
    setConfig(newConfig);
    setIsFirstRun(false);
  };

  return { config, isLoading, isFirstRun, updateConfig };
};
