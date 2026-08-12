/**
 * Acceptance tests — UI slice (jsdom environment)
 *
 * Covers:
 *   AC-1  – PhoneButton renders and is interactive on page load
 *   AC-2  – Clicking "pick up phone" fetches signed URL before any WebSocket opens
 *   AC-4  – Client opens WebSocket using signed URL only (not raw credentials)
 *   AC-9  – (client side) When signed-url returns non-200, Conversation.startSession never fires
 *
 * Note on AC-4 (PARTIAL):
 *   We verify the hook forwards the signed URL token to Conversation.startSession
 *   and that no raw env-var value appears in that call. Full wire-level WebSocket
 *   verification (confirming the WS upgrade header carries only the token) requires
 *   a real browser / Playwright E2E environment and cannot be done here cleanly.
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ---------------------------------------------------------------------------
// Mock @elevenlabs/client before any module that imports it is loaded
// ---------------------------------------------------------------------------
const mockConversationEnd = jest.fn().mockResolvedValue(undefined);
const mockStartSession = jest.fn();

jest.mock("@elevenlabs/client", () => ({
  Conversation: {
    startSession: (...args: unknown[]) => mockStartSession(...args),
  },
}));

import { PhoneButton } from "@/components/PhoneButton";
import { readDemoState } from "@/lib/demo-store";
import { EMPTY_CONFIG } from "@/types/agent";

const SIGNED_URL = "wss://signed.example.com/token-abc123";

function setupHappyFetch() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: SIGNED_URL }),
  } as unknown as Response);
}

function setupFailFetch(status = 500) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: "Internal server error" }),
  } as unknown as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockStartSession.mockResolvedValue({
    endSession: mockConversationEnd,
    getId: () => "conv_test_123",
  });
});

describe("local call history", () => {
  it("stores final transcript messages when a voice session disconnects", async () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /end call/i })).toBeInTheDocument()
    );

    const options = mockStartSession.mock.calls[0][0] as {
      onMessage: (message: { source: "user" | "ai"; message: string }) => void;
      onStatusChange: (status: { status: string }) => void;
    };

    act(() => {
      options.onMessage({ source: "user", message: "I need two towels." });
      options.onMessage({ source: "ai", message: "I can help with that." });
      options.onStatusChange({ status: "disconnected" });
    });

    expect(readDemoState().call_logs[0]).toMatchObject({
      id: "conv_test_123",
      room_number: "1208",
      transcript: [
        { speaker: "guest", text: "I need two towels." },
        { speaker: "agent", text: "I can help with that." },
      ],
    });
  });
});

describe("public demo call limit", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("ends a connected call after 90 seconds", async () => {
    jest.useFakeTimers();
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: /end call/i })).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(90_000);
      await Promise.resolve();
    });

    expect(mockConversationEnd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /call ended/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-1: Button renders and is interactive on page load
// ---------------------------------------------------------------------------
describe("AC-1: PhoneButton renders and is interactive on page load", () => {
  it("renders a button labelled 'Pick up phone'", () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    expect(screen.getByRole("button", { name: /pick up phone/i })).toBeInTheDocument();
  });

  it("button is enabled on initial render", () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    expect(screen.getByRole("button", { name: /pick up phone/i })).not.toBeDisabled();
  });

  it("button responds to click without throwing", async () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }))
    ).not.toThrow();
    await waitFor(() => expect(mockStartSession).toHaveBeenCalledTimes(1));
  });
});

// ---------------------------------------------------------------------------
// AC-2: fetch /api/elevenlabs/signed-url is called before Conversation.startSession
// ---------------------------------------------------------------------------
describe("AC-2: signed URL fetched before WebSocket session opens", () => {
  it("calls fetch before Conversation.startSession", async () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() => expect(mockStartSession).toHaveBeenCalledTimes(1));

    const fetchOrder = (global.fetch as jest.Mock).mock.invocationCallOrder[0];
    const wsOrder = mockStartSession.mock.invocationCallOrder[0];
    expect(fetchOrder).toBeLessThan(wsOrder);
  });

  it("fetches from the /api/elevenlabs/signed-url endpoint", async () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() => expect(mockStartSession).toHaveBeenCalledTimes(1));

    const urls = (global.fetch as jest.Mock).mock.calls.map((c: unknown[]) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/elevenlabs/signed-url"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC-4: Conversation.startSession receives the signed URL, not raw credentials
// ---------------------------------------------------------------------------
describe("AC-4: Conversation.startSession uses signed URL only", () => {
  it("passes the signed URL token from the server response to Conversation.startSession", async () => {
    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() => expect(mockStartSession).toHaveBeenCalledTimes(1));

    const arg = mockStartSession.mock.calls[0][0] as Record<string, unknown>;
    expect(arg.signedUrl).toBe(SIGNED_URL);
  });

  it("does not pass raw env-var API key or agent ID to Conversation.startSession", async () => {
    // Simulate env vars being present in the process (they would be on server, not client,
    // but we verify the hook doesn't read them)
    const originalKey = process.env.ELEVENLABS_API_KEY;
    const originalAgent = process.env.ELEVENLABS_AGENT_ID;
    process.env.ELEVENLABS_API_KEY = "sk-secret-key-should-not-appear";
    process.env.ELEVENLABS_AGENT_ID = "agent-secret-should-not-appear";

    setupHappyFetch();
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() => expect(mockStartSession).toHaveBeenCalledTimes(1));

    const callStr = JSON.stringify(mockStartSession.mock.calls[0][0]);
    expect(callStr).not.toContain("sk-secret-key-should-not-appear");
    expect(callStr).not.toContain("agent-secret-should-not-appear");

    process.env.ELEVENLABS_API_KEY = originalKey;
    process.env.ELEVENLABS_AGENT_ID = originalAgent;
  });
});

// ---------------------------------------------------------------------------
// AC-9 (client side): non-200 from signed-url endpoint → WebSocket never opens
// ---------------------------------------------------------------------------
describe("AC-9 (client side): signed-url non-200 response → Conversation.startSession never called", () => {
  it("does not call Conversation.startSession when signed-url returns 500", async () => {
    setupFailFetch(500);
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });

    expect(mockStartSession).not.toHaveBeenCalled();
  });

  it("shows error state when signed-url returns non-200", async () => {
    setupFailFetch(500);
    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /error/i })).toBeInTheDocument()
    );
  });
});

// ---------------------------------------------------------------------------
// I-1: Conversation.startSession throwing → hook transitions to "error"
// ---------------------------------------------------------------------------
describe("I-1: Conversation.startSession rejection → error state", () => {
  it("transitions to error state when Conversation.startSession throws", async () => {
    setupHappyFetch();
    mockStartSession.mockRejectedValueOnce(new Error("WebSocket open failure"));

    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /error/i })).toBeInTheDocument()
    );

    expect(mockStartSession).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// I-6: fetch itself rejecting (network error) → hook transitions to "error"
// ---------------------------------------------------------------------------
describe("I-6: network-level fetch rejection → error state", () => {
  it("transitions to error state when fetch throws a network error", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));

    render(<PhoneButton config={EMPTY_CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /pick up phone/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /error/i })).toBeInTheDocument()
    );

    expect(mockStartSession).not.toHaveBeenCalled();
  });
});
