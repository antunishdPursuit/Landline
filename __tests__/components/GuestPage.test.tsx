import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

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
});
