import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BedsideCloseup } from "@/components/BedsideCloseup";
import { RITZ_NOMAD_CONFIG } from "@/types/agent";

function renderCloseup(
  phoneState: "idle" | "connecting" | "in-call" | "ended" | "error" = "idle"
) {
  const onPhoneAction = jest.fn();
  const onDashboard = jest.fn();
  const onBack = jest.fn();
  const { container } = render(
    <BedsideCloseup
      config={RITZ_NOMAD_CONFIG}
      phoneState={phoneState}
      phoneSource={null}
      onPhoneAction={onPhoneAction}
      onDashboard={onDashboard}
      onBack={onBack}
    />
  );
  return { container, onPhoneAction, onDashboard, onBack };
}

describe("BedsideCloseup", () => {
  it("reveals hotel details without activating the phone", () => {
    const { onPhoneAction } = renderCloseup();

    fireEvent.click(
      screen.getByRole("button", { name: /show hotel details on the bedside panel/i })
    );

    expect(screen.getByText(RITZ_NOMAD_CONFIG.name)).toBeInTheDocument();
    expect(screen.getByText(RITZ_NOMAD_CONFIG.address)).toBeInTheDocument();
    expect(onPhoneAction).not.toHaveBeenCalled();
    expect(screen.getByText("1:00 maximum")).toBeInTheDocument();
  });

  it("keeps decorative room controls disabled", () => {
    renderCloseup();

    for (const label of [
      "All lights",
      "Reading",
      "Curtains",
      "Temperature",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    }
  });

  it("opens the dashboard without activating the phone", () => {
    const { onDashboard, onPhoneAction } = renderCloseup();

    fireEvent.click(screen.getByRole("button", { name: /open staff dashboard/i }));

    expect(onDashboard).toHaveBeenCalledTimes(1);
    expect(onPhoneAction).not.toHaveBeenCalled();
  });

  it("mounts the panel on the wall and draws the cord behind the phone body", () => {
    const { container } = render(
      <BedsideCloseup
        config={RITZ_NOMAD_CONFIG}
        phoneState="idle"
        phoneSource={null}
        onPhoneAction={jest.fn()}
        onDashboard={jest.fn()}
        onBack={jest.fn()}
      />
    );
    const panel = container.querySelector(".bedside-panel");
    const cord = container.querySelector('[data-scene-object="rear-phone-cord"]');
    const phoneBody = container.querySelector('[data-scene-object="phone-body"]');

    expect(panel).toHaveAttribute("data-placement", "wall");
    expect(cord).toBeInTheDocument();
    expect(phoneBody).toBeInTheDocument();
    expect(
      cord!.compareDocumentPosition(phoneBody!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("routes the handset and panel phone through one action", () => {
    const { onPhoneAction } = renderCloseup();
    const phoneButtons = screen.getAllByRole("button", {
      name: /pick up the room phone/i,
    });

    expect(phoneButtons).toHaveLength(2);
    fireEvent.click(phoneButtons[0]);
    fireEvent.click(phoneButtons[1]);
    expect(onPhoneAction).toHaveBeenNthCalledWith(1, "handset");
    expect(onPhoneAction).toHaveBeenNthCalledWith(2, "panel");
  });

  it("guides the guest to either synchronized room-service control", () => {
    const { container } = renderCloseup();

    expect(screen.getByText("Pick one.")).toBeInTheDocument();
    expect(
      container.querySelector('.bedside-call-indicator[data-ready="true"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.panel-phone-button[data-ready="true"]')
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open staff dashboard/i })).toHaveTextContent(
      "Staff dashboard"
    );
  });

  it("locks the panel during a handset call", () => {
    const { container } = render(
      <BedsideCloseup
        config={RITZ_NOMAD_CONFIG}
        phoneState="in-call"
        phoneSource="handset"
        onPhoneAction={jest.fn()}
        onDashboard={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(container.querySelector(".bedside-panel")).toHaveAttribute(
      "data-locked",
      "true"
    );
    expect(
      screen.getByRole("button", { name: /show hotel details/i })
    ).toBeDisabled();
    expect(container.querySelector(".panel-phone-button")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /open staff dashboard/i })
    ).toBeDisabled();
  });

  it("shows both test scripts and the connected-call countdown", () => {
    const { container } = render(
      <BedsideCloseup
        config={RITZ_NOMAD_CONFIG}
        phoneState="in-call"
        phoneSource="handset"
        remainingSeconds={74}
        onPhoneAction={jest.fn()}
        onDashboard={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText(/call 1 · service and nearby/i)).toBeInTheDocument();
    expect(screen.getByText(/call 2 · another hotel/i)).toBeInTheDocument();
    expect(screen.getByText(/send two extra towels/i)).toBeInTheDocument();
    expect(screen.getByText(/within a 10-minute walk/i)).toBeInTheDocument();
    expect(screen.getByText(/another hotel near nomad/i)).toBeInTheDocument();
    expect(screen.getByText(/yes, that’s correct/i)).toBeInTheDocument();
    expect(screen.getByText(/where can i book it/i)).toBeInTheDocument();
    expect(screen.getByText(/audio is not recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/a transcript is saved in this tab/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1:14/)).toHaveLength(3);
    expect(container.querySelector(".bedside-demo-hud")).toContainElement(
      container.querySelector(".bedside-phone-status")
    );
    expect(container.querySelector(".bedside-demo-hud")).toContainElement(
      container.querySelector(".bedside-test-guide")
    );
    expect(container.querySelector(".bedside-phone-zone")).not.toContainElement(
      container.querySelector(".bedside-test-guide")
    );
  });

  it("shows the graceful closing state for the final 5 seconds", () => {
    render(
      <BedsideCloseup
        config={RITZ_NOMAD_CONFIG}
        phoneState="in-call"
        phoneSource="handset"
        remainingSeconds={5}
        onPhoneAction={jest.fn()}
        onDashboard={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByText(/concierge is wrapping up/i)).toBeInTheDocument();
    expect(screen.getByText(/concierge is saying goodbye/i)).toBeInTheDocument();
    expect(screen.getByText(/call 1 · service and nearby/i)).toBeInTheDocument();
    expect(screen.getByText(/wrapping up · 0:05/i)).toBeInTheDocument();
  });

  it("locks the handset during a panel call", () => {
    render(
      <BedsideCloseup
        config={RITZ_NOMAD_CONFIG}
        phoneState="in-call"
        phoneSource="panel"
        onPhoneAction={jest.fn()}
        onDashboard={jest.fn()}
        onBack={jest.fn()}
      />
    );

    const callControls = screen.getAllByRole("button", {
      name: /end concierge call/i,
    });
    expect(callControls[0]).toBeDisabled();
    expect(callControls[1]).not.toBeDisabled();
  });

  it("disables both phone controls and back while connecting", () => {
    renderCloseup("connecting");

    for (const phoneButton of screen.getAllByRole("button", {
      name: /connecting to concierge/i,
    })) {
      expect(phoneButton).toBeDisabled();
    }
    expect(
      screen.getByRole("button", { name: /return to room overview/i })
    ).toBeDisabled();
  });
});
