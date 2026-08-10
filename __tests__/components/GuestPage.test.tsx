import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GuestPage from "@/app/page";

describe("GuestPage room overview", () => {
  it("presents the in-room guest context", () => {
    render(<GuestPage />);

    expect(screen.getByRole("heading", { name: "Landline" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /make yourself at home/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Room 1208")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /warm hotel room with a bedside phone/i })
    ).toBeInTheDocument();
  });

  it("does not show the previous setup or voice controls", () => {
    render(<GuestPage />);

    expect(screen.queryByRole("button", { name: /property/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pick up phone/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/manual fallback/i)).not.toBeInTheDocument();
  });
});
