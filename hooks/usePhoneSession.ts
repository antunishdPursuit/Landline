"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";
import { addDemoCallLog } from "@/lib/demo-store";
import {
  createVoiceClientTools,
  type VoiceToolActivity,
} from "@/lib/voice-tools";
import type { CallLog, ConversationTurn } from "@/lib/types";

export type PhoneSessionState =
  | "idle"
  | "connecting"
  | "in-call"
  | "ended"
  | "error";

export interface UsePhoneSessionReturn {
  state: PhoneSessionState;
  remainingSeconds: number;
  errorMessage: string | null;
  lastCall: CallLog | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

export const DEMO_CALL_LIMIT_SECONDS = 90;
export const DEMO_CALL_WRAP_UP_SECONDS = 15;
export const DEMO_CALL_WRAP_UP_EVENT =
  '[LANDLINE_SYSTEM_EVENT] The public demo time limit is approaching. Say exactly: "I’m sorry, but we’ve reached the demo time limit. Thank you for trying Landline. Goodbye." Then use the End Conversation system tool.';

export function usePhoneSession(
  dynamicVariables?: Record<string, string | number | boolean>
): UsePhoneSessionReturn {
  const [state, setState] = useState<PhoneSessionState>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(DEMO_CALL_LIMIT_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCall, setLastCall] = useState<CallLog | null>(null);
  const conversationRef = useRef<Conversation | null>(null);
  const transcriptRef = useRef<ConversationTurn[]>([]);
  const activityRef = useRef<VoiceToolActivity | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const callSavedRef = useRef(false);
  const wrapUpRequestedRef = useRef(false);

  const finalizeCall = useCallback(() => {
    const startedAt = sessionStartedAtRef.current;
    if (startedAt === null || callSavedRef.current) return;

    const activity = activityRef.current;
    const roomNumber = String(dynamicVariables?.room_number ?? "1208");
    const call: CallLog = {
      id: sessionIdRef.current ?? `call_${startedAt}`,
      room_number: roomNumber,
      language_detected: activity?.language_detected ?? "en",
      duration_seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      transcript: transcriptRef.current,
      intent: activity?.intent ?? "answerable_qa",
      department: activity?.department ?? null,
      request_summary: activity?.request_summary ?? null,
      requires_human: activity?.requires_human ?? false,
      created_at: new Date(startedAt).toISOString(),
    };
    addDemoCallLog(call);
    setLastCall(call);
    callSavedRef.current = true;
  }, [dynamicVariables]);

  useEffect(() => {
    if (state !== "in-call") return;

    const startedAt = sessionStartedAtRef.current ?? Date.now();
    const deadline = startedAt + DEMO_CALL_LIMIT_SECONDS * 1000;
    const updateCountdown = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(next);

      if (
        next > 0 &&
        next <= DEMO_CALL_WRAP_UP_SECONDS &&
        !wrapUpRequestedRef.current
      ) {
        wrapUpRequestedRef.current = true;
        try {
          conversationRef.current?.sendUserMessage(DEMO_CALL_WRAP_UP_EVENT);
        } catch {
          // The 90-second hard cutoff remains active if the graceful close fails.
        }
      }

      if (next === 0) {
        const conversation = conversationRef.current;
        conversationRef.current = null;
        void conversation?.endSession().finally(() => {
          finalizeCall();
          setState("ended");
        });
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(interval);
  }, [finalizeCall, state]);

  const startSession = useCallback(async () => {
    setLastCall(null);
    setErrorMessage(null);
    setRemainingSeconds(DEMO_CALL_LIMIT_SECONDS);
    setState("connecting");

    let signedUrl: string;
    try {
      const response = await fetch("/api/elevenlabs/signed-url");
      if (!response.ok) {
        if (response.status === 429) {
          const body = (await response.json().catch(() => null)) as {
            retry_after_seconds?: number;
          } | null;
          const retryMinutes = Math.max(
            1,
            Math.ceil((body?.retry_after_seconds ?? 600) / 60)
          );
          setErrorMessage(
            `This network has used its two demo calls. Try again in ${retryMinutes} minutes.`
          );
        } else {
          setErrorMessage("The concierge is temporarily unavailable. Please try again.");
        }
        setState("error");
        return;
      }
      const data = (await response.json()) as { url: string };
      signedUrl = data.url;
    } catch {
      setErrorMessage("The concierge is temporarily unavailable. Please try again.");
      setState("error");
      return;
    }

    transcriptRef.current = [];
    activityRef.current = null;
    sessionStartedAtRef.current = null;
    sessionIdRef.current = null;
    callSavedRef.current = false;
    wrapUpRequestedRef.current = false;

    try {
      const conversation = await Conversation.startSession({
        signedUrl,
        dynamicVariables,
        onMessage: ({ source, message }) => {
          transcriptRef.current = [
            ...transcriptRef.current,
            { speaker: source === "user" ? "guest" : "agent", text: message },
          ];
        },
        onStatusChange: ({ status }) => {
          if (status === "disconnected") {
            finalizeCall();
            setState("ended");
            conversationRef.current = null;
          }
        },
        onError: () => {
          finalizeCall();
          setState("error");
          conversationRef.current = null;
        },
        clientTools: createVoiceClientTools({
          onActivity: (activity) => {
            activityRef.current = activity;
          },
        }),
      });

      conversationRef.current = conversation;
      sessionStartedAtRef.current = Date.now();
      sessionIdRef.current =
        typeof conversation.getId === "function" ? conversation.getId() : null;
      setState("in-call");
    } catch {
      sessionStartedAtRef.current = null;
      setErrorMessage("The concierge could not connect. Please try again.");
      setState("error");
    }
  }, [dynamicVariables, finalizeCall]);

  const endSession = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    finalizeCall();
    setState("ended");
  }, [finalizeCall]);

  return {
    state,
    remainingSeconds,
    errorMessage,
    lastCall,
    startSession,
    endSession,
  };
}
