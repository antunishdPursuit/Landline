import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(container.querySelectorAll(".landline-call-indicator")).toHaveLength(4);
  });

  it("keeps the phone left of the panel in both responsive room scenes", () => {
    const { container } = render(<HotelRoomOverview />);

    expect(
      container.querySelector('[data-scene-object="hotel-phone"]')
    ).toHaveAttribute("data-device-side", "left");
    expect(
      container.querySelector('[data-scene-object="bedside-panel"]')
    ).toHaveAttribute("data-device-side", "right");
    expect(
      container.querySelector('[data-scene-object="mobile-hotel-phone"]')
    ).toHaveAttribute("data-device-side", "left");
    expect(
      container.querySelector('[data-scene-object="mobile-bedside-panel"]')
    ).toHaveAttribute("data-device-side", "right");
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

  it("exposes one bedside approach action when a handler is provided", () => {
    const onApproach = jest.fn();
    render(<HotelRoomOverview onApproach={onApproach} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /call room service.*pick one/i,
      })
    );

    expect(onApproach).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Call room service.")).toBeInTheDocument();
  });

});
