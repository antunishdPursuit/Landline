import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { PhoneSessionState } from "@/hooks/usePhoneSession";
import type { CallLog } from "@/lib/types";
import { RITZ_NOMAD_CONFIG } from "@/types/agent";

const mockStartSession = jest.fn().mockResolvedValue(undefined);
const mockEndSession = jest.fn().mockResolvedValue(undefined);
const mockDismissError = jest.fn();
const mockRouterPush = jest.fn();
let mockPhoneState: PhoneSessionState = "idle";
let mockRemainingSeconds = 60;
let mockLastCall: CallLog | null = null;
let mockErrorMessage: string | null = null;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/hooks/usePhoneSession", () => ({
  usePhoneSession: () => ({
    state: mockPhoneState,
    remainingSeconds: mockRemainingSeconds,
    errorMessage: mockErrorMessage,
    lastCall: mockLastCall,
    startSession: mockStartSession,
    endSession: mockEndSession,
    dismissError: mockDismissError,
  }),
}));

import { GuestRoomExperience } from "@/components/GuestRoomExperience";

function enterBedsideView() {
  render(<GuestRoomExperience />);
  fireEvent.click(
    screen.getByRole("button", {
      name: /call room service.*pick one/i,
    })
  );
}

describe("GuestRoomExperience", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhoneState = "idle";
    mockRemainingSeconds = 60;
    mockLastCall = null;
    mockErrorMessage = null;
  });

  it("moves from the room overview to the bedside close-up", () => {
    enterBedsideView();

    expect(
      screen.getByRole("region", { name: /bedside phone and hotel control panel/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /call room service.*pick one/i,
      })
    ).not.toBeInTheDocument();
  });

  it("starts ElevenLabs from either bedside phone control", () => {
    enterBedsideView();

    const phoneButtons = screen.getAllByRole("button", {
      name: /pick up the room phone/i,
    });
    fireEvent.click(phoneButtons[0]);
    fireEvent.click(phoneButtons[1]);

    expect(mockStartSession).toHaveBeenCalledTimes(2);
    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("opens panel details without starting ElevenLabs", () => {
    enterBedsideView();

    fireEvent.click(
      screen.getByRole("button", { name: /show hotel details on the bedside panel/i })
    );

    expect(screen.getByText(RITZ_NOMAD_CONFIG.name)).toBeInTheDocument();
    expect(mockStartSession).not.toHaveBeenCalled();
  });

  it("opens the staff dashboard from the panel without starting a call", () => {
    enterBedsideView();

    fireEvent.click(screen.getByRole("button", { name: /open staff dashboard/i }));

    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
    expect(mockStartSession).not.toHaveBeenCalled();
  });

  it("ends an active call before returning to the room", async () => {
    mockPhoneState = "in-call";
    enterBedsideView();

    fireEvent.click(
      screen.getByRole("button", { name: /return to room overview/i })
    );

    expect(mockEndSession).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /call room service.*pick one/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("explains a completed call before continuing to its transcript", () => {
    mockPhoneState = "ended";
    mockLastCall = {
      id: "call_1208",
      room_number: "1208",
      language_detected: "en",
      duration_seconds: 24,
      transcript: [],
      intent: "physical_request",
      department: "housekeeping",
      request_summary: "Deliver two towels",
      requires_human: false,
      created_at: "2026-08-11T19:00:00.000Z",
      end_reason: "agent_ended",
    };
    enterBedsideView();

    expect(screen.getByRole("dialog", { name: "Call complete" })).toBeInTheDocument();
    expect(screen.getByText(/thank you for trying the landline demo/i)).toBeInTheDocument();
    expect(screen.getByText("The agent finished the conversation.")).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/dashboard/calls?call=call_1208"
    );
  });

  it("keeps a failed pre-call attempt at the bedside without creating a transcript", () => {
    mockPhoneState = "error";
    mockErrorMessage = "This network has used its two demo calls.";
    enterBedsideView();

    expect(
      screen.getByRole("dialog", { name: "Call could not start" })
    ).toBeInTheDocument();
    expect(screen.getByText("No transcript was created.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(mockDismissError).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("does not open the dashboard until the completed call is saved", () => {
    mockPhoneState = "ended";
    mockLastCall = null;
    enterBedsideView();

    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
