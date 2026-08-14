"use client";

import { useEffect, useRef } from "react";
import { getCallOutcome } from "@/lib/call-outcome";
import type { CallLog } from "@/lib/types";

interface DemoCallModalProps {
  call: CallLog | null;
  failureMessage: string | null;
  onContinue: () => void;
  onCloseFailure: () => void;
}

const TONE_CLASSES = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
} as const;

export function DemoCallModal({
  call,
  failureMessage,
  onContinue,
  onCloseFailure,
}: DemoCallModalProps) {
  const actionRef = useRef<HTMLButtonElement>(null);
  const visible = call !== null || failureMessage !== null;
  const outcome = call ? getCallOutcome(call) : null;

  useEffect(() => {
    if (visible) actionRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  const isCompletedCall = call !== null && outcome !== null;
  const titleId = "demo-call-result-title";
  const descriptionId = "demo-call-result-description";

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#211811]/55 px-4 py-8 backdrop-blur-[2px]"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-[#d8c9b5] bg-[#fffaf2] p-6 text-[#29231d] shadow-2xl sm:p-7"
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            actionRef.current?.focus();
          }
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#956a35]">
          {isCompletedCall ? "Landline demo complete" : "Landline demo"}
        </p>
        <h2
          id={titleId}
          className="mt-2 font-serif text-3xl font-semibold leading-none text-[#30261f]"
        >
          {isCompletedCall ? outcome.title : "Call could not start"}
        </h2>

        {isCompletedCall ? (
          <>
            <p id={descriptionId} className="mt-4 text-sm leading-6 text-slate-700">
              Thank you for trying the Landline demo. Your call transcript was
              saved in this browser for the current tab.
            </p>
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${TONE_CLASSES[outcome.tone]}`}
            >
              <p className="font-semibold">{outcome.message}</p>
              {outcome.tone !== "neutral" && call.end_detail && (
                <p className="mt-1 text-xs opacity-80">{call.end_detail}</p>
              )}
            </div>
            <button
              ref={actionRef}
              type="button"
              onClick={onContinue}
              className="mt-6 min-h-11 w-full rounded-xl bg-[#2a2927] px-4 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8752b]"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <p id={descriptionId} className="mt-4 text-sm leading-6 text-slate-700">
              {failureMessage}
            </p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No transcript was created.
            </div>
            <button
              ref={actionRef}
              type="button"
              onClick={onCloseFailure}
              className="mt-6 min-h-11 w-full rounded-xl bg-[#2a2927] px-4 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8752b]"
            >
              Close
            </button>
          </>
        )}
      </section>
    </div>
  );
}
