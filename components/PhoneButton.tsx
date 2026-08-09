"use client";

import React from "react";
import { usePhoneSession, type PhoneSessionState } from "@/hooks/usePhoneSession";

interface ButtonConfig {
  label: string;
  disabled: boolean;
}

const STATE_CONFIG: Record<PhoneSessionState, ButtonConfig> = {
  idle: { label: "Pick up phone", disabled: false },
  connecting: { label: "Connecting...", disabled: true },
  "in-call": { label: "In call", disabled: true },
  ended: { label: "Call ended", disabled: false },
  error: { label: "Error — try again", disabled: false },
};

export function PhoneButton() {
  const { state, startSession, endSession } = usePhoneSession();
  const { label, disabled } = STATE_CONFIG[state];

  function handleClick() {
    if (state === "idle" || state === "ended" || state === "error") {
      startSession();
    } else if (state === "in-call") {
      endSession();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="rounded-full bg-green-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {label}
    </button>
  );
}
