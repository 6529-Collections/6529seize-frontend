import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { E2eeRouteGate } from "@/components/e2ee/gate/E2eeRouteGate";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "./fakeE2eeEngine";

const renderGate = (value: ReturnType<typeof contextFor>) =>
  render(
    <E2eeTestProvider value={value}>
      <E2eeRouteGate>{() => <p>ready content</p>}</E2eeRouteGate>
    </E2eeTestProvider>
  );

describe("E2eeRouteGate", () => {
  it("renders nothing when encrypted messages are disabled", () => {
    const { container } = renderGate(
      contextFor(null, { availability: "disabled", profileId: null })
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("explains that proxy sessions cannot use encrypted chat", () => {
    renderGate(contextFor(null, { availability: "proxy", profileId: null }));
    expect(
      screen.getByRole("heading", {
        name: "Not available while acting as a proxy",
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("ready content")).not.toBeInTheDocument();
  });

  it("shows unsupported browsers a clear reason", () => {
    renderGate(contextFor(createFakeE2eeEngine({ status: "unsupported" })));
    expect(
      screen.getByText("This browser can’t use encrypted messages")
    ).toBeInTheDocument();
  });

  it("offers a retry with the error code when loading failed", () => {
    const value = contextFor(null, {
      availability: "failed",
      loadError: "E2EE_LOAD_FAILED",
    });
    renderGate(value);
    expect(
      screen.getByText("Error code: E2EE_LOAD_FAILED")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(value.restart).toHaveBeenCalled();
  });

  it("shows the enrollment card with the plain-words explanation", async () => {
    const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
    renderGate(contextFor(engine));
    expect(
      screen.getByText(
        "One wallet signature lets this device send and read encrypted messages for 180 days."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "6529 cannot read your encrypted messages. It only delivers them."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /If you lose all of them or clear this browser’s data, you lose it, unless you turn on encrypted backup in Devices/
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Turn on encrypted messages (one signature)",
      })
    );
    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
  });

  it("handles a rejected signature gracefully", async () => {
    const engine = createFakeE2eeEngine({ status: "needs-enrollment" });
    (engine.enroll as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error("E2EE_SIGNATURE_REJECTED"), {
        name: "E2eeError",
        code: "E2EE_SIGNATURE_REJECTED",
      })
    );
    renderGate(contextFor(engine));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Turn on encrypted messages (one signature)",
      })
    );
    const declined = await screen.findByText(
      "You cancelled the signature. Nothing was turned on."
    );
    // Declining is a choice: announced politely, never as an alert.
    expect(declined.tagName).toBe("OUTPUT");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the profile's devices at the device limit, revoked from an active device", () => {
    const engine = createFakeE2eeEngine({
      status: "device-limit",
      devices: [
        device({ deviceKey: "0x1", label: "Chrome on Windows" }),
        device({
          deviceKey: "0x2",
          label: "6529 app on iPhone",
          platform: "phone",
        }),
      ],
    });
    renderGate(contextFor(engine));
    expect(
      screen.getByRole("heading", { name: "Too many devices" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Devices on your profile" })
    ).toBeInTheDocument();
    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("6529 app on iPhone")).toBeInTheDocument();
    // A revocation is signed by an active device; this one is not registered.
    expect(
      screen.queryByRole("button", { name: /^Revoke / })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/On a device you already use, open Devices/u)
    ).toBeInTheDocument();
  });

  it("renders children when ready", () => {
    renderGate(contextFor(createFakeE2eeEngine({ status: "ready" })));
    expect(screen.getByText("ready content")).toBeInTheDocument();
  });
});
