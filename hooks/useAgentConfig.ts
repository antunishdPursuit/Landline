"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentConfig } from "@/types/agent";
import { EMPTY_CONFIG, RITZ_NOMAD_CONFIG } from "@/types/agent";

const STORAGE_KEY = "landline_agent_config";

export interface UseAgentConfigReturn {
  config: AgentConfig;
  draft: AgentConfig;
  isEditing: boolean;
  isLoaded: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  save: (updated: AgentConfig) => void;
  updateDraft: (field: keyof AgentConfig, value: string) => void;
}

export function useAgentConfig(): UseAgentConfigReturn {
  const [config, setConfig] = useState<AgentConfig>(EMPTY_CONFIG);
  const [draft, setDraft] = useState<AgentConfig>(EMPTY_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AgentConfig;
        const savedConfig =
          parsed.name || parsed.address ? parsed : RITZ_NOMAD_CONFIG;
        if (savedConfig === RITZ_NOMAD_CONFIG) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig));
        }
        setConfig(savedConfig);
        setDraft(savedConfig);
        setIsEditing(false);
      } else {
        setConfig(RITZ_NOMAD_CONFIG);
        setDraft(RITZ_NOMAD_CONFIG);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(RITZ_NOMAD_CONFIG)
        );
        setIsEditing(false);
      }
    } catch {
      setConfig(RITZ_NOMAD_CONFIG);
      setDraft(RITZ_NOMAD_CONFIG);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(RITZ_NOMAD_CONFIG));
      setIsEditing(false);
    }
    setIsLoaded(true);
  }, []);

  const startEditing = useCallback(() => {
    setDraft(config);
    setIsEditing(true);
  }, [config]);

  const cancelEditing = useCallback(() => {
    setDraft(config);
    setIsEditing(false);
  }, [config]);

  const save = useCallback((updated: AgentConfig) => {
    setConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setIsEditing(false);
  }, []);

  const updateDraft = useCallback(
    (field: keyof AgentConfig, value: string) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return {
    config,
    draft,
    isEditing,
    isLoaded,
    startEditing,
    cancelEditing,
    save,
    updateDraft,
  };
}
