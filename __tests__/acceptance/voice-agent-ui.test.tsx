import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockConversationEnd = jest.fn().mockResolvedValue(undefined);
const mockSendUserMessage = jest.fn();
const mockStartSession = jest.fn();

jest.mock("@elevenlabs/client", () => ({
  Conversation: {
    startSession: (...args: unknown[]) => mockStartSession(...args),
  },
}));

import {
  DEMO_CALL_WRAP_UP_EVENT,
  usePhoneSession,
} from "@/hooks/usePhoneSession";
import { readDemoState } from "@/lib/demo-store";
import { toAgentDynamicVariables } from "@/lib/agent-dynamic-variables";
import { RITZ_NOMAD_CONFIG } from "@/types/agent";

const SIGNED_URL = "wss://signed.example.com/token-abc123";

function PhoneSessionHarness() {
  const session = usePhoneSession(toAgentDynamicVariables(RITZ_NOMAD_CONFIG));
  const canStart = ["idle", "ended", "error"].includes(session.state);

  return (
    <div>
      <button
        type="button"
        onClick={() => void (canStart ? session.startSession() : session.endSession())}
        disabled={session.state === "connecting"}
      >
        {session.state}
      </button>
      {session.errorMessage && <p>{session.errorMessage}</p>}
    </div>
  );
}

function startCall() {
  render(<PhoneSessionHarness />);
  fireEvent.click(screen.getByRole("button", { name: "idle" }));
}

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
    sendUserMessage: mockSendUserMessage,
    getId: () => "conv_test_123",
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("voice session lifecycle", () => {
  it("stores real transcript messages but not the internal timer event", async () => {
    setupHappyFetch();
    startCall();
    await waitFor(() => expect(screen.getByRole("button", { name: "in-call" })).toBeInTheDocument());

    const options = mockStartSession.mock.calls[0][0] as {
      onMessage: (message: { source: "user" | "ai"; message: string }) => void;
      onStatusChange: (status: { status: string }) => void;
    };

    act(() => {
      options.onMessage({ source: "user", message: "I need two towels." });
      options.onMessage({ source: "user", message: DEMO_CALL_WRAP_UP_EVENT });
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

  it("requests one graceful close at 75 seconds and ends at 90 seconds", async () => {
    jest.useFakeTimers();
    setupHappyFetch();
    startCall();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(75_000);
      await Promise.resolve();
    });
    expect(mockSendUserMessage).toHaveBeenCalledTimes(1);
    expect(mockSendUserMessage).toHaveBeenCalledWith(
      expect.stringContaining("End Conversation system tool")
    );

    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
    });
    expect(mockSendUserMessage).toHaveBeenCalledTimes(1);
    expect(mockConversationEnd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "ended" })).toBeInTheDocument();
  });

  it("fetches the signed URL before starting ElevenLabs and passes no raw credentials", async () => {
    const originalKey = process.env.ELEVENLABS_API_KEY;
    const originalAgent = process.env.ELEVENLABS_AGENT_ID;
    process.env.ELEVENLABS_API_KEY = "sk-secret-key-should-not-appear";
    process.env.ELEVENLABS_AGENT_ID = "agent-secret-should-not-appear";
    setupHappyFetch();
    startCall();

    await waitFor(() => expect(mockStartSession).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/elevenlabs/signed-url");
    expect((global.fetch as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      mockStartSession.mock.invocationCallOrder[0]
    );
    const options = mockStartSession.mock.calls[0][0] as Record<string, unknown>;
    expect(options.signedUrl).toBe(SIGNED_URL);
    expect(JSON.stringify(options)).not.toContain("sk-secret-key-should-not-appear");
    expect(JSON.stringify(options)).not.toContain("agent-secret-should-not-appear");
    process.env.ELEVENLABS_API_KEY = originalKey;
    process.env.ELEVENLABS_AGENT_ID = originalAgent;
  });

  it("does not start ElevenLabs when the signed URL route fails", async () => {
    setupFailFetch();
    startCall();

    await waitFor(() => expect(screen.getByRole("button", { name: "error" })).toBeInTheDocument());
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(mockStartSession).not.toHaveBeenCalled();
  });

  it("shows Vercel rate-limit guidance without starting ElevenLabs", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ retry_after_seconds: 540 }),
    } as Response);
    startCall();

    await waitFor(() => expect(screen.getByRole("button", { name: "error" })).toBeInTheDocument());
    expect(screen.getByText(/two demo calls.*9 minutes/i)).toBeInTheDocument();
    expect(mockStartSession).not.toHaveBeenCalled();
  });

  it("enters the error state when the ElevenLabs session cannot start", async () => {
    setupHappyFetch();
    mockStartSession.mockRejectedValueOnce(new Error("WebSocket open failure"));
    startCall();

    await waitFor(() => expect(screen.getByRole("button", { name: "error" })).toBeInTheDocument());
    expect(mockStartSession).toHaveBeenCalledTimes(1);
  });

  it("enters the error state when the signed URL request cannot connect", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    startCall();

    await waitFor(() => expect(screen.getByRole("button", { name: "error" })).toBeInTheDocument());
    expect(mockStartSession).not.toHaveBeenCalled();
  });
});
