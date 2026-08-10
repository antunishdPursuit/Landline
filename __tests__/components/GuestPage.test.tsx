import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GuestPage from "@/app/page";

describe("GuestPage room overview", () => {
  it("presents the room as the only guest context", () => {
    const { container } = render(<GuestPage />);

    expect(screen.getByRole("heading", { name: "Landline" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /warm hotel room with a large bed/i })
    ).toBeInTheDocument();
    expect(container.querySelector("main")).toHaveStyle({
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100dvh",
      overflow: "hidden",
    });
  });

  it("does not show setup controls or supporting copy", () => {
    render(<GuestPage />);

    expect(screen.queryByRole("button", { name: /property/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pick up phone/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/manual fallback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/in-room concierge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/room 1208/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/make yourself at home/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/your bedside phone/i)).not.toBeInTheDocument();
  });
});
