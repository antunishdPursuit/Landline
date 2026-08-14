"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";
import { addDemoCallLog } from "@/lib/demo-store";
import {
  createVoiceClientTools,
  type VoiceToolActivity,
} from "@/lib/voice-tools";
import {
  reasonFromElevenLabs,
  sanitizeCallEndDetail,
} from "@/lib/call-end";
import type {
  CallEndReason,
  CallEndSource,
  CallLog,
  ConversationTurn,
} from "@/lib/types";

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
  dismissError: () => void;
}

export const DEMO_CALL_LIMIT_SECONDS = 60;
export const DEMO_CALL_WRAP_UP_SECONDS = 5;
export const DEMO_CALL_WRAP_UP_EVENT =
  '[LANDLINE_SYSTEM_EVENT] The public demo time limit is approaching. Say exactly: "I’m sorry, but we’ve reached the demo time limit. Thank you for trying Landline. Goodbye." Then use the End Conversation system tool.';

type CallEndObservation = {
  reason: CallEndReason;
  source: CallEndSource;
  detail?: string | null;
};

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
  const pendingEndRef = useRef<CallEndObservation | null>(null);
  const lastClientErrorRef = useRef<string | null>(null);
  const toolTokenRef = useRef<string | null>(null);

  const reconcileCallEnd = useCallback(
    async (call: CallLog, toolToken: string) => {
      try {
        const response = await fetch("/api/elevenlabs/conversation-end", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${toolToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversationId: call.id }),
        });
        if (!response.ok) return;

        const data = (await response.json()) as { terminationReason?: unknown };
        const terminationReason = sanitizeCallEndDetail(data.terminationReason);
        if (!terminationReason) return;

        const localReasonIsFinal =
          call.end_source === "landline" &&
          (call.end_reason === "guest_ended" ||
            call.end_reason === "demo_time_limit");
        const updatedCall: CallLog = {
          ...call,
          end_reason: localReasonIsFinal
            ? call.end_reason
            : reasonFromElevenLabs(
                terminationReason,
                call.end_reason ?? "unknown"
              ),
          end_source: localReasonIsFinal ? call.end_source : "elevenlabs",
          end_detail: terminationReason,
        };

        addDemoCallLog(updatedCall);
        setLastCall((current) =>
          current?.id === updatedCall.id ? updatedCall : current
        );
      } catch {
        // The locally observed reason remains available when reconciliation fails.
      }
    },
    []
  );

  const finalizeCall = useCallback((observation?: CallEndObservation) => {
    const startedAt = sessionStartedAtRef.current;
    if (startedAt === null || callSavedRef.current) return;

    const activity = activityRef.current;
    const roomNumber = String(dynamicVariables?.room_number ?? "1208");
    const endedAt = new Date();
    const resolvedEnd = observation ?? pendingEndRef.current ?? {
      reason: "unknown" as const,
      source: "browser" as const,
      detail: null,
    };
    const call: CallLog = {
      id: sessionIdRef.current ?? `call_${startedAt}`,
      room_number: roomNumber,
      language_detected: activity?.language_detected ?? "en",
      duration_seconds: Math.max(0, Math.round((endedAt.getTime() - startedAt) / 1000)),
      transcript: transcriptRef.current,
      intent: activity?.intent ?? "answerable_qa",
      department: activity?.department ?? null,
      request_summary: activity?.request_summary ?? null,
      requires_human: activity?.requires_human ?? false,
      created_at: new Date(startedAt).toISOString(),
      end_reason: resolvedEnd.reason,
      end_source: resolvedEnd.source,
      end_detail: sanitizeCallEndDetail(resolvedEnd.detail),
      ended_at: endedAt.toISOString(),
    };
    addDemoCallLog(call);
    setLastCall(call);
    callSavedRef.current = true;

    const toolToken = toolTokenRef.current;
    if (toolToken && sessionIdRef.current) {
      void reconcileCallEnd(call, toolToken);
    }
  }, [dynamicVariables, reconcileCallEnd]);

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
          // The 60-second hard cutoff remains active if the graceful close fails.
        }
      }

      if (next === 0) {
        pendingEndRef.current = {
          reason: "demo_time_limit",
          source: "landline",
          detail: "The 60-second public demo limit was reached.",
        };
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
    let toolToken: string;
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
      const data = (await response.json()) as { url?: unknown; toolToken?: unknown };
      if (typeof data.url !== "string" || typeof data.toolToken !== "string") {
        throw new Error("Invalid signed session response");
      }
      signedUrl = data.url;
      toolToken = data.toolToken;
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
    pendingEndRef.current = null;
    lastClientErrorRef.current = null;
    toolTokenRef.current = toolToken;

    try {
      const conversation = await Conversation.startSession({
        signedUrl,
        dynamicVariables,
        onMessage: ({ source, message }) => {
          if (source === "user" && message === DEMO_CALL_WRAP_UP_EVENT) return;
          transcriptRef.current = [
            ...transcriptRef.current,
            { speaker: source === "user" ? "guest" : "agent", text: message },
          ];
        },
        onConnect: ({ conversationId }) => {
          sessionStartedAtRef.current ??= Date.now();
          sessionIdRef.current = conversationId;
        },
        onDisconnect: (details) => {
          let observedEnd = pendingEndRef.current;
          if (!observedEnd && details.reason === "agent") {
            observedEnd = {
              reason: "agent_ended",
              source: "elevenlabs",
              detail: "The agent or ElevenLabs ended the conversation.",
            };
          } else if (!observedEnd && details.reason === "error") {
            observedEnd = {
              reason: "connection_lost",
              source: "browser",
              detail: lastClientErrorRef.current ?? details.message,
            };
          } else if (!observedEnd) {
            observedEnd = {
              reason: "guest_ended",
              source: "landline",
              detail: "The guest ended the call.",
            };
          }

          finalizeCall(observedEnd);
          setState("ended");
          conversationRef.current = null;
        },
        onError: (message) => {
          lastClientErrorRef.current = sanitizeCallEndDetail(message);
        },
        clientTools: createVoiceClientTools({
          toolToken,
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
    pendingEndRef.current = {
      reason: "guest_ended",
      source: "landline",
      detail: "The guest ended the call.",
    };
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } finally {
        conversationRef.current = null;
      }
    }
    finalizeCall();
    setState("ended");
  }, [finalizeCall]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
    setRemainingSeconds(DEMO_CALL_LIMIT_SECONDS);
    setState((current) => (current === "error" ? "idle" : current));
  }, []);

  return {
    state,
    remainingSeconds,
    errorMessage,
    lastCall,
    startSession,
    endSession,
    dismissError,
  };
}
