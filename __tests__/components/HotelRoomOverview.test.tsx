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

  it("uses critical styles to show only one responsive room", () => {
    const { container } = render(<HotelRoomOverview />);
    const criticalStyles = container.querySelector("style")?.textContent;

    expect(container.querySelector("figure")).toHaveStyle({
      width: "100%",
      height: "100%",
      overflow: "hidden",
    });
    expect(container.querySelector(".landline-room-mobile")).toBeInTheDocument();
    expect(container.querySelector(".landline-room-desktop")).toBeInTheDocument();
    expect(criticalStyles).toContain(".landline-room-mobile");
    expect(criticalStyles).toContain(".landline-room-desktop");
    expect(criticalStyles).toContain("@media (min-width: 640px)");
  });

  it("anchors both room compositions to the bedside focus zone", () => {
    const { container } = render(<HotelRoomOverview />);
    const rooms = container.querySelectorAll("figure svg");

    expect(rooms).toHaveLength(2);
    rooms.forEach((room) => {
      expect(room).toHaveAttribute("preserveAspectRatio", "xMinYMid slice");
    });
  });

  it("does not expose an inactive bedside control", () => {
    render(<HotelRoomOverview />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
