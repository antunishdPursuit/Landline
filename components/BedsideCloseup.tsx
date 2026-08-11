"use client";

import React, { useState } from "react";
import type { PhoneSessionState } from "@/hooks/usePhoneSession";
import type { CallLog } from "@/lib/types";
import type { AgentConfig } from "@/types/agent";

export type PhoneSource = "handset" | "panel";

interface BedsideCloseupProps {
  config: AgentConfig;
  phoneState: PhoneSessionState;
  phoneSource: PhoneSource | null;
  lastCall?: CallLog | null;
  onPhoneAction: (source: PhoneSource) => void;
  onBack: () => void;
}

const PHONE_LABEL: Record<PhoneSessionState, string> = {
  idle: "Pick up the room phone",
  connecting: "Connecting to concierge",
  "in-call": "End concierge call",
  ended: "Call concierge again",
  error: "Try concierge again",
};

const PHONE_STATUS: Record<PhoneSessionState, string> = {
  idle: "Ready",
  connecting: "Connecting",
  "in-call": "Concierge connected",
  ended: "Call ended",
  error: "Call unavailable",
};

const DISABLED_CONTROLS = [
  "All lights",
  "Reading",
  "Curtains",
  "Temperature",
  "Privacy",
];

export function BedsideCloseup({
  config,
  phoneState,
  phoneSource,
  lastCall = null,
  onPhoneAction,
  onBack,
}: BedsideCloseupProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const sessionActive = phoneState === "connecting" || phoneState === "in-call";
  const handsetDisabled =
    phoneState === "connecting" || (sessionActive && phoneSource === "panel");
  const panelLocked = sessionActive && phoneSource === "handset";
  const panelPhoneDisabled = phoneState === "connecting" || panelLocked;
  const callReceiptVisible = phoneState === "ended" && lastCall !== null;
  const callReceiptTitle =
    lastCall?.intent === "physical_request"
      ? "Request sent"
      : lastCall?.intent === "defer_to_operator"
        ? "Staff notified"
        : "Call complete";

  return (
    <section
      aria-label="Bedside phone and hotel control panel"
      className="bedside-closeup"
    >
      <style suppressHydrationWarning>{`
        .bedside-closeup {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 18% 18%, rgba(244, 199, 123, 0.3), transparent 30%),
            linear-gradient(180deg, #eee5d8 0%, #d7c6b1 56%, #735541 56%, #493428 100%);
          color: #27231f;
        }

        .bedside-closeup::after {
          content: '';
          position: absolute;
          inset: 56% 0 auto;
          height: 2px;
          background: rgba(76, 52, 38, 0.48);
        }

        .bedside-back {
          position: absolute;
          z-index: 5;
          top: 1.25rem;
          left: 1.25rem;
          min-width: 44px;
          min-height: 44px;
          padding: 0.65rem 1rem;
          border: 1px solid rgba(91, 65, 48, 0.35);
          border-radius: 999px;
          background: rgba(250, 247, 241, 0.84);
          color: #493428;
          font: 600 0.72rem/1 var(--font-dm-sans), system-ui, sans-serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
          cursor: pointer;
        }

        .bedside-back:disabled {
          cursor: wait;
          opacity: 0.5;
        }

        .bedside-stage {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
          align-items: center;
          gap: clamp(1.5rem, 5vw, 6rem);
          width: min(1480px, 94vw);
          height: 100%;
          margin: 0 auto;
          padding: clamp(4.5rem, 8vh, 7rem) 0 clamp(2rem, 5vh, 4rem);
          box-sizing: border-box;
        }

        .bedside-phone-zone {
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .bedside-phone-button {
          width: min(100%, 680px);
          min-height: 44px;
          border: 0;
          padding: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .bedside-phone-button:disabled {
          cursor: wait;
        }

        .bedside-phone-button:focus-visible,
        .panel-screen-button:focus-visible,
        .panel-phone-button:focus-visible,
        .bedside-back:focus-visible {
          outline: 3px solid #a8752b;
          outline-offset: 4px;
        }

        .bedside-phone-art {
          display: block;
          width: 100%;
          filter: drop-shadow(0 26px 22px rgba(37, 25, 18, 0.3));
          transition: transform 180ms ease;
        }

        .bedside-phone-button:not(:disabled):hover .bedside-phone-art {
          transform: translateY(-5px);
        }

        .bedside-phone-status {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin-top: -0.5rem;
          padding: 0.55rem 0.8rem;
          border-radius: 999px;
          background: rgba(247, 242, 234, 0.78);
          font: 600 0.68rem/1 var(--font-dm-sans), system-ui, sans-serif;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .bedside-phone-status::before {
          content: '';
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 999px;
          background: #c88d43;
        }

        .bedside-phone-status[data-state="in-call"]::before {
          background: #2f8a62;
          box-shadow: 0 0 0 5px rgba(47, 138, 98, 0.16);
        }

        .bedside-phone-status[data-state="error"]::before {
          background: #9a4e4e;
        }

        .bedside-panel {
          position: relative;
          align-self: start;
          width: 100%;
          max-width: 580px;
          padding: clamp(1rem, 2vw, 1.5rem);
          border: 1px solid #4a4540;
          border-radius: 2rem;
          background: linear-gradient(145deg, #333536, #1f2223);
          box-shadow: 0 30px 55px rgba(31, 22, 17, 0.36), inset 0 1px rgba(255,255,255,0.12);
          box-sizing: border-box;
          transition: opacity 180ms ease, filter 180ms ease;
        }

        .bedside-panel[data-locked="true"] {
          opacity: 0.5;
          filter: grayscale(0.45);
        }

        .bedside-panel::before {
          content: '';
          position: absolute;
          z-index: -1;
          top: -0.75rem;
          left: 12%;
          width: 76%;
          height: 0.85rem;
          border-radius: 0.45rem 0.45rem 0 0;
          background: #66615b;
          box-shadow: 0 8px 18px rgba(50, 37, 29, 0.24);
        }

        .panel-screen-button {
          display: block;
          width: 100%;
          min-height: clamp(150px, 27vh, 260px);
          padding: clamp(1.1rem, 3vw, 2rem);
          border: 1px solid rgba(242, 203, 139, 0.38);
          border-radius: 1.25rem;
          background: linear-gradient(155deg, #c58a43, #8d5c2a);
          color: #fff4df;
          text-align: left;
          cursor: pointer;
          box-shadow: inset 0 0 45px rgba(72, 39, 17, 0.3);
        }

        .panel-eyebrow {
          display: block;
          margin-bottom: 0.65rem;
          font: 600 0.62rem/1 var(--font-dm-sans), system-ui, sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.82;
        }

        .panel-title {
          display: block;
          font: 600 clamp(1.65rem, 3.5vw, 2.8rem)/0.95 var(--font-cormorant), Georgia, serif;
        }

        .panel-address {
          display: block;
          max-width: 32ch;
          margin-top: 0.75rem;
          font: 500 0.76rem/1.45 var(--font-dm-sans), system-ui, sans-serif;
          opacity: 0.82;
        }

        .panel-controls {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
          margin-top: 0.8rem;
        }

        .panel-control,
        .panel-phone-button {
          min-height: 48px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 0.85rem;
          font: 600 0.58rem/1.15 var(--font-dm-sans), system-ui, sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .panel-control {
          background: #292c2d;
          color: #8e8e89;
          cursor: not-allowed;
        }

        .panel-phone-button {
          background: #e2b66e;
          color: #29231d;
          cursor: pointer;
        }

        .panel-phone-button:disabled {
          cursor: wait;
          opacity: 0.55;
        }

        @media (max-width: 720px) {
          .bedside-stage {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(230px, 48%) minmax(210px, 52%);
            gap: 0.25rem;
            width: 92vw;
            padding: 4rem 0 0.75rem;
          }

          .bedside-phone-zone {
            order: 2;
            align-self: end;
          }

          .bedside-phone-button {
            width: min(88vw, 460px);
          }

          .bedside-phone-art {
            max-height: 33vh;
          }

          .bedside-phone-status {
            margin-top: -1.25rem;
          }

          .bedside-panel {
            order: 1;
            align-self: start;
            max-width: none;
            max-height: 44vh;
            padding: 0.75rem;
            border-radius: 1.4rem;
          }

          .panel-screen-button {
            min-height: 112px;
            padding: 0.9rem 1rem;
          }

          .panel-title {
            font-size: clamp(1.35rem, 7vw, 2rem);
          }

          .panel-address {
            margin-top: 0.45rem;
            font-size: 0.65rem;
          }

          .panel-controls {
            gap: 0.38rem;
            margin-top: 0.5rem;
          }

          .panel-control,
          .panel-phone-button {
            min-height: 42px;
            font-size: 0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bedside-phone-art {
            transition: none;
          }
        }
      `}</style>

      <button
        type="button"
        className="bedside-back"
        onClick={onBack}
        disabled={phoneState === "connecting"}
        aria-label="Return to room overview"
      >
        Back
      </button>

      <div className="bedside-stage">
        <div className="bedside-phone-zone">
          <button
            type="button"
            className="bedside-phone-button"
            onClick={() => onPhoneAction("handset")}
            disabled={handsetDisabled}
            aria-label={PHONE_LABEL[phoneState]}
          >
            <svg
              viewBox="0 0 620 390"
              aria-hidden="true"
              focusable="false"
              className="bedside-phone-art"
            >
              <defs>
                <linearGradient id="close-phone-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3d4143" />
                  <stop offset="1" stopColor="#171a1b" />
                </linearGradient>
                <filter id="close-phone-shadow" x="-30%" y="-30%" width="160%" height="190%">
                  <feDropShadow dx="0" dy="18" stdDeviation="15" floodColor="#1b130f" floodOpacity="0.36" />
                </filter>
              </defs>
              <ellipse cx="310" cy="350" rx="265" ry="25" fill="#3f2d23" opacity="0.25" />
              <g filter="url(#close-phone-shadow)">
                <path
                  data-scene-object="rear-phone-cord"
                  d="M455 190c63-58 132-39 138 29 5 53-30 86-68 102"
                  fill="none"
                  stroke="#1d2021"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  data-scene-object="phone-body"
                  d="M112 176h396l55 161H57Z"
                  fill="url(#close-phone-body)"
                  stroke="#565b5d"
                  strokeWidth="7"
                />
                <rect x="151" y="210" width="170" height="75" rx="12" fill="#8e8980" />
                <rect x="342" y="211" width="145" height="78" rx="11" fill="#242829" stroke="#636566" strokeWidth="3" />
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((column) => (
                    <circle
                      key={`${row}-${column}`}
                      cx={370 + column * 43}
                      cy={232 + row * 22}
                      r="6"
                      fill="#b5afa5"
                    />
                  ))
                )}
                <circle cx="520" cy="211" r="8" fill={phoneState === "error" ? "#a95555" : "#d89a4b"} />
                <path d="M109 138c18-63 67-91 128-91h151c61 0 111 28 129 91l-49 54c-35-27-69-39-112-39h-88c-43 0-77 12-112 39Z" fill="#111516" stroke="#3e4446" strokeWidth="9" />
                <path d="M150 131c23-34 56-48 100-48h125c44 0 78 14 101 48" fill="none" stroke="#262b2d" strokeWidth="16" strokeLinecap="round" />
              </g>
            </svg>
          </button>

          <span className="bedside-phone-status" data-state={phoneState}>
            {PHONE_STATUS[phoneState]}
          </span>
        </div>

        <div
          className="bedside-panel"
          data-placement="wall"
          data-locked={panelLocked}
          aria-disabled={panelLocked}
        >
          <button
            type="button"
            className="panel-screen-button"
            onClick={() => setDetailsVisible(true)}
            disabled={panelLocked}
            aria-expanded={detailsVisible}
            aria-label="Show hotel details on the bedside panel"
          >
            {callReceiptVisible ? (
              <>
                <span className="panel-eyebrow">
                  Room {lastCall.room_number} · Sent to dashboard
                </span>
                <span className="panel-title">{callReceiptTitle}</span>
                <span className="panel-address">
                  {lastCall.request_summary ||
                    "The conversation was saved to Agent Calls."}
                </span>
              </>
            ) : detailsVisible ? (
              <>
                <span className="panel-eyebrow">Room 1208 · Hotel details</span>
                <span className="panel-title">
                  {config.name || "Landline Hotel"}
                </span>
                <span className="panel-address">
                  {config.address || "Guest services are available by phone."}
                </span>
              </>
            ) : (
              <>
                <span className="panel-eyebrow">Landline · Room 1208</span>
                <span className="panel-title">Touch for hotel details</span>
                <span className="panel-address">
                  Room controls are shown for demonstration.
                </span>
              </>
            )}
          </button>

          <div className="panel-controls" aria-label="Bedside panel controls">
            {DISABLED_CONTROLS.map((control) => (
              <button key={control} type="button" className="panel-control" disabled>
                {control}
              </button>
            ))}
            <button
              type="button"
              className="panel-phone-button"
              onClick={() => onPhoneAction("panel")}
              disabled={panelPhoneDisabled}
              aria-label={PHONE_LABEL[phoneState]}
            >
              {phoneState === "in-call" ? "End call" : "Phone"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
