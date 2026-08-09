"use client";

import { useCallback, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";

export type PhoneSessionState =
  | "idle"
  | "connecting"
  | "in-call"
  | "ended"
  | "error";

export interface UsePhoneSessionReturn {
  state: PhoneSessionState;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

export function usePhoneSession(
  dynamicVariables?: Record<string, string | number | boolean>
): UsePhoneSessionReturn {
  const [state, setState] = useState<PhoneSessionState>("idle");
  const conversationRef = useRef<Conversation | null>(null);

  const startSession = useCallback(async () => {
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

    try {
      const conversation = await Conversation.startSession({
        signedUrl,
        dynamicVariables,
        onStatusChange: ({ status }) => {
          if (status === "disconnected") {
            setState("ended");
            conversationRef.current = null;
          }
        },
        onError: () => {
          setState("error");
          conversationRef.current = null;
        },
        clientTools: {
          log_request: async (payload: unknown) => {
            const response = await fetch("/api/requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!response.ok) {
              return "Request could not be logged";
            }
            return "Request logged";
          },
        },
      });

      conversationRef.current = conversation;
      setState("in-call");
    } catch {
      setState("error");
    }
  }, [dynamicVariables]);

  const endSession = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setState("ended");
  }, []);

  return { state, startSession, endSession };
}
