"use client";

import React from "react";
import { usePhoneSession, type PhoneSessionState } from "@/hooks/usePhoneSession";
import type { AgentConfig } from "@/types/agent";

interface PhoneButtonProps {
  config: AgentConfig;
}

function toDynamicVariables(
  config: AgentConfig
): Record<string, string | number | boolean> {
  return {
    property_name: config.name || "Unnamed property",
    property_address: config.address || "",
    property_lat: config.lat || "0",
    property_lng: config.lng || "0",
  };
}

interface ButtonAppearance {
  label: string;
  ariaLabel: string;
  disabled: boolean;
  ringClass: string;
  iconClass: string;
  pulse: boolean;
}

const STATE_APPEARANCE: Record<PhoneSessionState, ButtonAppearance> = {
  idle: {
    label: "Pick up phone",
    ariaLabel: "Pick up phone",
    disabled: false,
    ringClass: "border-gold/50 hover:border-gold hover:shadow-[0_0_24px_rgba(200,145,74,0.15)]",
    iconClass: "text-gold/70 group-hover:text-gold",
    pulse: false,
  },
  connecting: {
    label: "Connecting...",
    ariaLabel: "Connecting...",
    disabled: true,
    ringClass: "border-taupe/30",
    iconClass: "text-taupe/30",
    pulse: false,
  },
  "in-call": {
    label: "In call",
    ariaLabel: "In call",
    disabled: true,
    ringClass: "border-gold shadow-[0_0_32px_rgba(200,145,74,0.25)]",
    iconClass: "text-gold",
    pulse: true,
  },
  ended: {
    label: "Call ended",
    ariaLabel: "Call ended",
    disabled: false,
    ringClass: "border-taupe/30 hover:border-gold/50",
    iconClass: "text-taupe/40 group-hover:text-gold/60",
    pulse: false,
  },
  error: {
    label: "Error — try again",
    ariaLabel: "Error — try again",
    disabled: false,
    ringClass: "border-red-900/60 hover:border-red-800/80",
    iconClass: "text-red-900/70 group-hover:text-red-800",
    pulse: false,
  },
};

function PhoneHandsetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PhoneButton({ config }: PhoneButtonProps) {
  const dynamicVariables = toDynamicVariables(config);
  const { state, startSession, endSession } = usePhoneSession(dynamicVariables);
  const appearance = STATE_APPEARANCE[state];

  function handleClick() {
    if (state === "idle" || state === "ended" || state === "error") {
      void startSession();
    } else if (state === "in-call") {
      void endSession();
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pulse ring layer — visible only during an active call */}
      <div className="relative flex items-center justify-center">
        {appearance.pulse && (
          <span
            className="absolute inline-flex h-full w-full rounded-full border border-gold/40 animate-ping"
            aria-hidden="true"
          />
        )}
        <button
          onClick={handleClick}
          disabled={appearance.disabled}
          aria-label={appearance.ariaLabel}
          className={[
            "group relative w-16 h-16 rounded-full border-2 bg-dark-card",
            "flex items-center justify-center",
            "transition-all duration-300",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-espresso",
            "disabled:cursor-default",
            appearance.ringClass,
          ].join(" ")}
        >
          <PhoneHandsetIcon
            className={`w-6 h-6 transition-colors duration-300 ${appearance.iconClass}`}
          />
        </button>
      </div>

      <span className="font-body text-xs tracking-widest uppercase text-taupe select-none">
        {appearance.label}
      </span>
    </div>
  );
}
