"use client";

import React from "react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { addDemoTicket } from "@/lib/demo-store";
import type { GuestRequest } from "@/lib/types";
import type { AgentConfig } from "@/types/agent";

interface DemoRequestButtonProps {
  config: AgentConfig;
  onNavigate?: (url: string) => void;
}

export function DemoRequestButton({
  config,
  onNavigate = (url) => window.location.assign(url),
}: DemoRequestButtonProps) {
  const { isSignedIn } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handlePhoneClick() {
    if (submitting) return;

    if (!revealed) {
      setRevealed(true);
      return;
    }

    setSubmitting(true);

    const now = new Date().toISOString();
    const request: GuestRequest = {
      id: `demo_${Date.now()}`,
      room_number: "1208",
      intent: "physical_request",
      department: "housekeeping",
      summary: `Two additional towels requested${
        config.name ? ` at ${config.name}` : ""
      }`,
      urgency: "medium",
      language_detected: "en",
      status: "new",
      requires_human: false,
      assigned_to: null,
      created_at: now,
      updated_at: now,
    };

    addDemoTicket(request);
    onNavigate(
      isSignedIn ? "/dashboard" : "/sign-in?redirect_url=%2Fdashboard"
    );
  }

  const phoneButton = (
    <button
      type="button"
      onClick={handlePhoneClick}
      disabled={submitting}
      aria-label={revealed ? "Send demo request" : "Show demo request"}
      className="mx-auto flex min-h-11 items-center justify-center gap-2 rounded-xl border border-base-border bg-white px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`h-4 w-4 ${submitting ? "animate-pulse" : ""}`}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
          clipRule="evenodd"
        />
      </svg>
      {revealed ? "Send demo request" : "Use demo request"}
    </button>
  );

  if (!revealed) {
    return phoneButton;
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-base-border bg-dark-card p-5 shadow-xl shadow-slate-900/5">
      <p className="font-body text-xs uppercase tracking-widest text-gold">
        Demo request
      </p>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-body text-sm">
        <dt className="text-taupe">Room</dt>
        <dd className="text-right font-medium text-ivory">1208</dd>

        <dt className="text-taupe">Request</dt>
        <dd className="text-right font-medium text-ivory">
          Two additional towels
        </dd>

        <dt className="text-taupe">Department</dt>
        <dd className="text-right font-medium text-ivory">Housekeeping</dd>

        <dt className="text-taupe">Urgency</dt>
        <dd className="text-right font-medium text-ivory">Medium</dd>

        <dt className="text-taupe">Status</dt>
        <dd className="text-right font-medium text-ivory">
          Waiting for Pickup
        </dd>
      </dl>

      <div className="mt-5">{phoneButton}</div>
    </div>
  );
}
