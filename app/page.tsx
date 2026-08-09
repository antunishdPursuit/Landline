"use client";

import React from "react";
import { AgentConfigCard } from "@/components/AgentConfigCard";
import { PhoneButton } from "@/components/PhoneButton";
import { useAgentConfig } from "@/hooks/useAgentConfig";

export default function GuestPage() {
  const agentConfig = useAgentConfig();

  if (!agentConfig.isLoaded) {
    return (
      <main className="min-h-screen bg-espresso flex items-center justify-center">
        <span className="font-body text-xs text-taupe/50 tracking-widest uppercase">
          Loading
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-espresso flex flex-col items-center justify-center gap-10 p-6">
      <AgentConfigCard
        config={agentConfig.config}
        draft={agentConfig.draft}
        isEditing={agentConfig.isEditing}
        startEditing={agentConfig.startEditing}
        cancelEditing={agentConfig.cancelEditing}
        save={agentConfig.save}
        updateDraft={agentConfig.updateDraft}
      />

      {!agentConfig.isEditing && (
        <PhoneButton config={agentConfig.config} />
      )}
    </main>
  );
}
