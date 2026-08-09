import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PhoneButton } from "@/components/PhoneButton";
import type { PhoneSessionState } from "@/hooks/usePhoneSession";
import { EMPTY_CONFIG } from "@/types/agent";

afterEach(cleanup);

const mockStartSession = jest.fn();
const mockEndSession = jest.fn();

let mockState: PhoneSessionState = "idle";

jest.mock("@/hooks/usePhoneSession", () => ({
  usePhoneSession: () => ({
    state: mockState,
    startSession: mockStartSession,
    endSession: mockEndSession,
  }),
}));

function renderButton(state: PhoneSessionState) {
  mockState = state;
  return render(<PhoneButton config={EMPTY_CONFIG} />);
}

describe("PhoneButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = "idle";
  });

  it("renders with label 'Pick up phone' and is not disabled in idle state", () => {
    renderButton("idle");
    const button = screen.getByRole("button", { name: "Pick up phone" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls startSession when clicked in idle state", () => {
    renderButton("idle");
    fireEvent.click(screen.getByRole("button"));
    expect(mockStartSession).toHaveBeenCalledTimes(1);
  });

  it("shows 'Connecting...' and is disabled when state is connecting", () => {
    renderButton("connecting");
    const button = screen.getByRole("button", { name: "Connecting..." });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("shows 'In call' and is disabled when state is in-call", () => {
    renderButton("in-call");
    const button = screen.getByRole("button", { name: "In call" });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("shows 'Error — try again' and is not disabled when state is error", () => {
    renderButton("error");
    const button = screen.getByRole("button", { name: "Error — try again" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls startSession when clicked in error state", () => {
    renderButton("error");
    fireEvent.click(screen.getByRole("button"));
    expect(mockStartSession).toHaveBeenCalledTimes(1);
  });

  it("shows 'Call ended' and is not disabled when state is ended", () => {
    renderButton("ended");
    const button = screen.getByRole("button", { name: "Call ended" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls startSession when clicked in ended state", () => {
    renderButton("ended");
    fireEvent.click(screen.getByRole("button"));
    expect(mockStartSession).toHaveBeenCalledTimes(1);
  });
});
