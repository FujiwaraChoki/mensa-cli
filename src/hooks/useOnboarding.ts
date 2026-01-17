// Hook for managing onboarding flow state

import { useState, useCallback } from 'react';
import type { OnboardingStep, ModelValue } from '../types.ts';

interface UseOnboardingReturn {
  step: OnboardingStep;
  selectedModel: ModelValue | null;
  setSelectedModel: (model: ModelValue) => void;
  nextStep: () => void;
  isComplete: boolean;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedModel, setSelectedModel] = useState<ModelValue | null>(null);

  const nextStep = useCallback(() => {
    if (step === 'welcome') {
      setStep('model-select');
    } else if (step === 'model-select') {
      setStep('complete');
    }
  }, [step]);

  return {
    step,
    selectedModel,
    setSelectedModel,
    nextStep,
    isComplete: step === 'complete',
  };
};
