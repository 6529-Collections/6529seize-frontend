import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { E2eeRouteGate } from "@/components/e2ee/gate/E2eeRouteGate";
import { E2eeError } from "@/lib/e2ee/engine/errors";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "./fakeE2eeEngine";

const mockRequestAuth = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x1111111111111111111111111111111111111111",
    canSignActiveWallet: true,
    connectedAccounts: [],
  }),
}));
const mockIsRemoteWallet = jest.fn(() => false);

jest.mock("@/hooks/device-signing/useSignedMessagesWallet", () => ({
  useSignedMessagesWallet: () => ({
    isRemoteWallet: mockIsRemoteWallet(),
    networkName: "Ethereum",
    isNetworkSupported: () => true,
    switchNetwork: jest.fn(),
  }),
}));

const renderGate = (value: ReturnType<typeof contextFor>) =>
  render(
    <E2eeTestProvider value={value}>
      <E2eeRouteGate>{() => <p>ready content</p>}</E2eeRouteGate>
    </E2eeTestProvider>
  );

describe("E2eeRouteGate", () => {
  beforeEach(() => mockRequestAuth.mockReset());
  afterEach(() => {
    mockIsRemoteWallet.mockReturnValue(false);
  });

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

  it.each([
    "load-failed",
    "error",
    "needs-enrollment",
    "device-limit",
  ] as const)(
    "recovers a rejected sign-in from %s before restarting encrypted messages",
    async (status) => {
      let finish: (result: { success: boolean }) => void = () => undefined;
      mockRequestAuth.mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const value =
        status === "load-failed"
          ? contextFor(null, {
              availability: "failed",
              loadError: "E2EE_SESSION_EXPIRED",
            })
          : contextFor(
              createFakeE2eeEngine({ status, error: "E2EE_SESSION_EXPIRED" })
            );
      renderGate(value);
      fireEvent.click(screen.getByRole("button", { name: "Sign in again" }));
      expect(mockRequestAuth).toHaveBeenCalledWith({ serverRejected: true });
      expect(
        screen.getByRole("button", { name: "Sign in again" })
      ).toBeDisabled();
      expect(value.restart).not.toHaveBeenCalled();
      finish({ success: true });
      await waitFor(() => expect(value.restart).toHaveBeenCalledTimes(1));
    }
  );

  it.each(["declined", "failed"])(
    "does not restart after %s sign-in recovery",
    async (outcome) => {
      if (outcome === "declined")
        mockRequestAuth.mockResolvedValue({ success: false });
      else mockRequestAuth.mockRejectedValue(new Error("unavailable"));
      const value = contextFor(null, {
        availability: "failed",
        loadError: "E2EE_SESSION_EXPIRED",
      });
      renderGate(value);
      fireEvent.click(screen.getByRole("button", { name: "Sign in again" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Sign-in did not finish"
      );
      expect(value.restart).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Sign in again" })
      ).not.toBeDisabled();
    }
  );

  it.each(["loading", "enrolling", "unsupported", "ready"] as const)(
    "keeps %s progress visible when an old session error remains",
    (status) => {
      renderGate(
        contextFor(
          createFakeE2eeEngine({ status, error: "E2EE_SESSION_EXPIRED" })
        )
      );
      expect(
        screen.queryByRole("button", { name: "Sign in again" })
      ).not.toBeInTheDocument();
      expect(mockRequestAuth).not.toHaveBeenCalled();
    }
  );

  it.each(["idle", "disabled", "proxy", "unavailable", "elsewhere"] as const)(
    "keeps the %s gate ahead of an old session error",
    (availability) => {
      renderGate(
        contextFor(null, { availability, loadError: "E2EE_SESSION_EXPIRED" })
      );
      expect(
        screen.queryByRole("button", { name: "Sign in again" })
      ).not.toBeInTheDocument();
      expect(mockRequestAuth).not.toHaveBeenCalled();
    }
  );

  it("returns to enrollment when a recovered engine clears its session error", async () => {
    mockRequestAuth.mockResolvedValue({ success: true });
    const engine = createFakeE2eeEngine({
      status: "needs-enrollment",
      error: "E2EE_SESSION_EXPIRED",
    });
    const value = contextFor(engine);
    renderGate(value);
    fireEvent.click(screen.getByRole("button", { name: "Sign in again" }));
    await waitFor(() => expect(value.restart).toHaveBeenCalledTimes(1));
    act(() => engine.update({ status: "needs-enrollment", error: null }));
    expect(
      await screen.findByRole("heading", { name: "Turn on encrypted DMs" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Sign in again" })
    ).not.toBeInTheDocument();
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
        name: "Sign to enable Encrypted DMs",
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
        name: "Sign to enable Encrypted DMs",
      })
    );
    const declined = await screen.findByText("Signature cancelled.");
    // Declining is a choice: announced politely, never as an alert.
    expect(declined.tagName).toBe("OUTPUT");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  const walletConnectRecoveryCopy =
    "Couldn't reach the wallet app on your phone. Reconnect your wallet to pair it again, then approve the signature.";

  it.each([
    {
      scenario: "upgrading with a remote wallet",
      upgrade: { superseded: 1 },
      remote: true,
      signLabel: "Sign to upgrade Encrypted DMs",
      alert: walletConnectRecoveryCopy,
      reconnectCount: 1,
    },
    {
      scenario: "enabling for the first time with a remote wallet",
      upgrade: null,
      remote: true,
      signLabel: "Sign to enable Encrypted DMs",
      alert: walletConnectRecoveryCopy,
      reconnectCount: 1,
    },
    {
      scenario: "upgrading with a non-remote wallet",
      upgrade: { superseded: 1 },
      remote: false,
      signLabel: "Sign to upgrade Encrypted DMs",
      alert: "Your wallet couldn't sign. Unlock it and try again.",
      reconnectCount: 0,
    },
  ])(
    "shows wallet session failure feedback when $scenario",
    async ({ upgrade, remote, signLabel, alert, reconnectCount }) => {
      mockIsRemoteWallet.mockReturnValue(remote);
      const engine = createFakeE2eeEngine({
        status: "needs-enrollment",
        upgrade,
      });
      jest.mocked(engine.enroll).mockRejectedValueOnce(
        new E2eeError("E2EE_SIGNATURE_FAILED", undefined, {
          cause: new Error("Session topic doesn't exist"),
        })
      );
      renderGate(contextFor(engine));
      fireEvent.click(screen.getByRole("button", { name: signLabel }));

      expect(await screen.findByRole("alert")).toHaveTextContent(alert);
      expect(
        screen.queryAllByRole("button", { name: "Reconnect wallet" })
      ).toHaveLength(reconnectCount);
      expect(
        screen.queryByText("Signature cancelled.")
      ).not.toBeInTheDocument();
    }
  );

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
