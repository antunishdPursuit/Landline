"use client";

import { useCallback, useRef, useState } from "react";
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
  lastCall: CallLog | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

export function usePhoneSession(
  dynamicVariables?: Record<string, string | number | boolean>
): UsePhoneSessionReturn {
  const [state, setState] = useState<PhoneSessionState>("idle");
  const [lastCall, setLastCall] = useState<CallLog | null>(null);
  const conversationRef = useRef<Conversation | null>(null);
  const transcriptRef = useRef<ConversationTurn[]>([]);
  const activityRef = useRef<VoiceToolActivity | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const callSavedRef = useRef(false);

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

  const startSession = useCallback(async () => {
    setLastCall(null);
    setState("connecting");

    let signedUrl: string;
    try {
      const response = await fetch("/api/elevenlabs/signed-url");
      if (!response.ok) {
        setState("error");
        return;
      }
      const data = (await response.json()) as { url: string };
      signedUrl = data.url;
    } catch {
      setState("error");
      return;
    }

    transcriptRef.current = [];
    activityRef.current = null;
    sessionStartedAtRef.current = Date.now();
    sessionIdRef.current = null;
    callSavedRef.current = false;

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
      sessionIdRef.current =
        typeof conversation.getId === "function" ? conversation.getId() : null;
      setState("in-call");
    } catch {
      sessionStartedAtRef.current = null;
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

  return { state, lastCall, startSession, endSession };
}
