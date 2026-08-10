import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HotelRoomOverview } from "@/components/HotelRoomOverview";

describe("HotelRoomOverview", () => {
  it("describes the room scene for assistive technology", () => {
    render(<HotelRoomOverview />);

    expect(
      screen.getByRole("img", { name: /warm hotel room with a large bed/i })
    ).toBeInTheDocument();
  });

  it("includes the phone and panel as distinct scene objects", () => {
    const { container } = render(<HotelRoomOverview />);

    expect(
      container.querySelector('[data-scene-object="hotel-phone"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-scene-object="bedside-panel"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-scene-object="mobile-hotel-phone"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-scene-object="mobile-bedside-panel"]')
    ).toBeInTheDocument();
  });

  it("places the wordmark on both responsive headboards", () => {
    const { container } = render(<HotelRoomOverview />);

    expect(
      container.querySelector('[data-scene-object="headboard-wordmark"]')
    ).toHaveTextContent("Landline");
    expect(
      container.querySelector('[data-scene-object="mobile-headboard-wordmark"]')
    ).toHaveTextContent("Landline");
  });

  it("does not expose an inactive bedside control", () => {
    render(<HotelRoomOverview />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
