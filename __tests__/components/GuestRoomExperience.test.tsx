import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GuestRoomExperience } from "@/components/GuestRoomExperience";
import type { PhoneSessionState } from "@/hooks/usePhoneSession";
import { RITZ_NOMAD_CONFIG } from "@/types/agent";

const mockStartSession = jest.fn().mockResolvedValue(undefined);
const mockEndSession = jest.fn().mockResolvedValue(undefined);
let mockPhoneState: PhoneSessionState = "idle";

jest.mock("@/hooks/useAgentConfig", () => ({
  useAgentConfig: () => ({
    config: RITZ_NOMAD_CONFIG,
    draft: RITZ_NOMAD_CONFIG,
    isEditing: false,
    isLoaded: true,
    startEditing: jest.fn(),
    cancelEditing: jest.fn(),
    save: jest.fn(),
    updateDraft: jest.fn(),
  }),
}));

jest.mock("@/hooks/usePhoneSession", () => ({
  usePhoneSession: () => ({
    state: mockPhoneState,
    startSession: mockStartSession,
    endSession: mockEndSession,
  }),
}));

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
});
