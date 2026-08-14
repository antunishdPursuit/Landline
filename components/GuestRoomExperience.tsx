"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedsideCloseup,
  type PhoneSource,
} from "@/components/BedsideCloseup";
import { HotelRoomOverview } from "@/components/HotelRoomOverview";
import { DemoCallModal } from "@/components/DemoCallModal";
import { usePhoneSession } from "@/hooks/usePhoneSession";
import { toAgentDynamicVariables } from "@/lib/agent-dynamic-variables";
import { RITZ_NOMAD_CONFIG } from "@/types/agent";

type GuestView = "room" | "bedside";
const AGENT_DYNAMIC_VARIABLES = toAgentDynamicVariables(RITZ_NOMAD_CONFIG);

export function GuestRoomExperience() {
  const router = useRouter();
  const [view, setView] = useState<GuestView>("room");
  const [phoneSource, setPhoneSource] = useState<PhoneSource | null>(null);
  const bedsideSceneRef = useRef<HTMLDivElement>(null);
  const phoneSession = usePhoneSession(AGENT_DYNAMIC_VARIABLES);

  const completedCall =
    phoneSession.state === "ended" ? phoneSession.lastCall : null;
  const failureMessage =
    phoneSession.state === "error" ? phoneSession.errorMessage : null;
  const resultVisible = completedCall !== null || failureMessage !== null;

  useEffect(() => {
    const scene = bedsideSceneRef.current;
    if (!scene) return;

    if (resultVisible) scene.setAttribute("inert", "");
    else scene.removeAttribute("inert");
  }, [resultVisible]);

  const handlePhoneAction = useCallback((source: PhoneSource) => {
    if (phoneSession.state === "connecting") return;

    if (phoneSession.state === "in-call") {
      void phoneSession.endSession();
      return;
    }

    setPhoneSource(source);
    void phoneSession.startSession();
  }, [phoneSession]);

  const handleBack = useCallback(() => {
    if (phoneSession.state === "connecting") return;

    if (phoneSession.state === "in-call") {
      void phoneSession.endSession().finally(() => setView("room"));
      return;
    }

    setView("room");
  }, [phoneSession]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <style suppressHydrationWarning>{`
        .guest-view-enter {
          width: 100%;
          height: 100%;
          animation: guest-view-enter 320ms ease-out both;
        }

        @keyframes guest-view-enter {
          from { opacity: 0; transform: scale(1.018); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .guest-view-enter { animation: none; }
        }
      `}</style>

      {view === "room" ? (
        <div className="guest-view-enter">
          <HotelRoomOverview onApproach={() => setView("bedside")} />
        </div>
      ) : (
        <>
        <div
          ref={bedsideSceneRef}
          className="guest-view-enter"
          aria-hidden={resultVisible}
        >
          <BedsideCloseup
            config={RITZ_NOMAD_CONFIG}
            phoneState={phoneSession.state}
            remainingSeconds={phoneSession.remainingSeconds}
            errorMessage={phoneSession.errorMessage}
            phoneSource={phoneSource}
            lastCall={phoneSession.lastCall}
            onPhoneAction={handlePhoneAction}
            onDashboard={() => router.push("/dashboard")}
            onBack={handleBack}
          />
        </div>
        <DemoCallModal
          call={completedCall}
          failureMessage={failureMessage}
          onContinue={() => {
            if (!completedCall) return;
            router.push(
              `/dashboard/calls?call=${encodeURIComponent(completedCall.id)}`
            );
          }}
          onCloseFailure={phoneSession.dismissError}
        />
        </>
      )}
    </div>
  );
}
