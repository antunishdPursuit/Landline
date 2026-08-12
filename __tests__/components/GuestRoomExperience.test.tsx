import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { PhoneSessionState } from "@/hooks/usePhoneSession";
import type { CallLog } from "@/lib/types";
import { RITZ_NOMAD_CONFIG } from "@/types/agent";

const mockStartSession = jest.fn().mockResolvedValue(undefined);
const mockEndSession = jest.fn().mockResolvedValue(undefined);
const mockRouterPush = jest.fn();
let mockPhoneState: PhoneSessionState = "idle";
let mockRemainingSeconds = 90;
let mockLastCall: CallLog | null = null;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/hooks/usePhoneSession", () => ({
  usePhoneSession: () => ({
    state: mockPhoneState,
    remainingSeconds: mockRemainingSeconds,
    errorMessage: null,
    lastCall: mockLastCall,
    startSession: mockStartSession,
    endSession: mockEndSession,
  }),
}));

import { GuestRoomExperience } from "@/components/GuestRoomExperience";

function enterBedsideView() {
  render(<GuestRoomExperience />);
  fireEvent.click(
    screen.getByRole("button", {
      name: /approach the bedside phone and control panel/i,
    })
  );
}

describe("GuestRoomExperience", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhoneState = "idle";
    mockRemainingSeconds = 90;
    mockLastCall = null;
  });

  it("moves from the room overview to the bedside close-up", () => {
    enterBedsideView();

    expect(
      screen.getByRole("region", { name: /bedside phone and hotel control panel/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /approach the bedside phone and control panel/i,
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
          name: /approach the bedside phone and control panel/i,
        })
      ).toBeInTheDocument()
    );
  });

  it("shows a dashboard receipt on the panel after a call ends", () => {
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
    };
    enterBedsideView();

    expect(screen.getByText(/sent to dashboard/i)).toBeInTheDocument();
    expect(screen.getByText("Request sent")).toBeInTheDocument();
    expect(screen.getByText("Deliver two towels")).toBeInTheDocument();
    expect(mockRouterPush).toHaveBeenCalledWith("/dashboard/calls");
  });

  it("does not open the dashboard until the completed call is saved", () => {
    mockPhoneState = "ended";
    mockLastCall = null;
    enterBedsideView();

    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
