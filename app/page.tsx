"use client";

import React, { useState } from "react";
import { AgentConfigCard } from "@/components/AgentConfigCard";
import { DemoRequestButton } from "@/components/DemoRequestButton";
import { PhoneButton } from "@/components/PhoneButton";
import { TravelRecommendations } from "@/components/TravelRecommendations";
import { useAgentConfig } from "@/hooks/useAgentConfig";

export default function GuestPage() {
  const agentConfig = useAgentConfig();
  const [propertyVisible, setPropertyVisible] = useState(false);

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
    <main className="relative min-h-screen bg-espresso flex flex-col items-center justify-center gap-10 p-6 pt-32">
      <h1 className="absolute top-10 font-display text-5xl font-semibold tracking-tight text-ivory sm:text-6xl">
        Landline
      </h1>

      {!propertyVisible ? (
        <button
          type="button"
          onClick={() => setPropertyVisible(true)}
          className="rounded-xl border border-gold bg-white px-8 py-3 font-body text-sm font-semibold uppercase tracking-widest text-gold shadow-lg shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-white"
        >
          Property
        </button>
      ) : (
        <>
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
            <div className="flex w-full max-w-sm flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <PhoneButton config={agentConfig.config} />
                <p className="font-body text-xs uppercase tracking-widest text-taupe">
                  Talk to the concierge
                </p>
              </div>

              <div className="flex w-full items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-base-border" />
                <span className="font-body text-[10px] uppercase tracking-widest text-taupe">
                  Manual fallback
                </span>
                <span className="h-px flex-1 bg-base-border" />
              </div>

              <DemoRequestButton config={agentConfig.config} />
              <TravelRecommendations />
            </div>
          )}
        </>
      )}
    </main>
  );
}
