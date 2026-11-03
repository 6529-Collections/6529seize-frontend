import SignedMessagesNotice from "@/components/device-signing/SignedMessagesNotice";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactElement } from "react";

const NOW = Date.UTC(2026, 9, 12, 12, 0);
const DAY = 86_400_000;
const ADDRESS = "0x1111111111111111111111111111111111111111";
const OWN_KEY = `0x${"aa".repeat(32)}`;

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const mockRequestGrant = jest.fn();
const mockSetToast = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestSignedMessagesGrant: mockRequestGrant,
    setToast: mockSetToast,
  }),
}));

let mockAccount: string | null = ADDRESS;
jest.mock("@/hooks/device-signing/useSignedMessagesAccount", () => ({
  useSignedMessagesAccount: () => mockAccount,
}));

const mockSeizeConnectFresh = jest.fn(async () => undefined);
let mockConnection: Record<string, unknown>;
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));

let mockIsRemoteWallet = false;
jest.mock("@/hooks/device-signing/useSignedMessagesWallet", () => ({
  useSignedMessagesWallet: () => ({
    isRemoteWallet: mockIsRemoteWallet,
    networkName: "Ethereum",
    isNetworkSupported: () => true,
    switchNetwork: async () => "switched",
  }),
}));

const mockReport = jest.fn();
jest.mock("@/utils/monitoring/signedMessagesEnableMonitoring", () => ({
  reportSignedMessagesEnable: (...args: unknown[]) => mockReport(...args),
}));

jest.mock("@/hooks/device-signing/useMinuteClock", () => ({
  useMinuteClock: () => NOW,
}));

let mockLocal: {
  loaded: boolean;
  grant: ApiDeviceGrant | null;
  publicKeys: string[];
};
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => mockLocal,
}));

let mockGrants: ApiDeviceGrant[] | undefined;
const mockRevoke = jest.fn();
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: () => ({ data: mockGrants }),
  useRevokeDeviceGrant: () => ({ revoke: mockRevoke, isRevoking: false }),
}));

const grant = (overrides: Partial<ApiDeviceGrant> = {}): ApiDeviceGrant =>
  ({
    id: `0x${"1".repeat(64)}`,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: OWN_KEY,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Chrome on macOS",
    domain: "6529.io",
    issued_at: NOW - DAY,
    expires_at: NOW + 100 * DAY,
    created_at: NOW - DAY,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  }) as ApiDeviceGrant;

const otherDevice = grant({
  id: `0x${"2".repeat(64)}`,
  device_key: `0x${"bb".repeat(32)}`,
  device_label: "Firefox on Windows",
});

describe("SignedMessagesNotice", () => {
  beforeEach(() => {
    localStorage.clear();
    mockEnabled = true;
    mockAccount = ADDRESS;
    mockLocal = { loaded: true, grant: null, publicKeys: [OWN_KEY] };
    mockGrants = [];
    mockRequestGrant.mockReset().mockResolvedValue({ success: true });
    mockRevoke.mockReset();
    mockSetToast.mockReset();
    mockReport.mockReset();
    mockSeizeConnectFresh.mockClear();
    mockIsRemoteWallet = false;
    mockConnection = {
      address: ADDRESS,
      canSignActiveWallet: true,
      connectedAccounts: [],
      isWalletConnectionPending: false,
      seizeConnectFresh: mockSeizeConnectFresh,
      seizeConnectOpen: false,
    };
  });

  it("offers to turn on signed messages with one signature while the composer is empty", async () => {
    render(<SignedMessagesNotice composerEmpty />);

    expect(
      screen.getByRole("region", {
        name: "Turn on signed messages (one signature)",
      })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Turn on" }));

    expect(mockRequestGrant).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(mockSetToast).toHaveBeenCalledWith({
        message: "Signed messages are on in this browser.",
        type: "success",
      })
    );
  });

  it("stays out of the way while the user is typing", () => {
    render(<SignedMessagesNotice composerEmpty={false} />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
  });

  it("remembers a dismissal for this wallet", () => {
    const { rerender } = render(<SignedMessagesNotice composerEmpty />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
    expect(localStorage.getItem("6529-signed-messages-notice")).toContain(
      ADDRESS
    );
  });

  it("shows nothing while this browser holds an active grant", () => {
    mockLocal = { ...mockLocal, grant: grant() };
    render(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
  });

  it("reminds in the grant's last 14 days and after it expires", () => {
    mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW + 5 * DAY }) };
    const { rerender } = render(<SignedMessagesNotice composerEmpty />);
    expect(screen.getByText(/^Signed messages end on/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Renew" })).toBeVisible();

    mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW - DAY }) };
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(
      screen.getByText("Signed messages have ended in this browser")
    ).toBeVisible();
  });

  it("renders nothing without an eligible account or with the flag off", () => {
    mockAccount = null;
    const { rerender } = render(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();

    mockAccount = ADDRESS;
    mockEnabled = false;
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
  });

  describe("turning on", () => {
    const renderNotice = () => render(<SignedMessagesNotice composerEmpty />);
    const turnOn = () =>
      act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Turn on" }));
      });
    const status = () => screen.getByRole("status");
    /** A grant whose signature request stays open until answered. */
    const waitForSignature = () => {
      let resolve: (value: unknown) => void = () => undefined;
      mockRequestGrant.mockImplementation(
        (options?: { onSignatureRequested?: () => void }) => {
          options?.onSignatureRequested?.();
          return new Promise((done) => {
            resolve = done;
          });
        }
      );
      return (value: unknown) =>
        act(async () => {
          resolve(value);
        });
    };
    const rerenderWith = async (
      rerender: (ui: ReactElement) => void,
      next: Record<string, unknown>
    ) => {
      mockConnection = { ...mockConnection, ...next };
      await act(async () => {
        rerender(<SignedMessagesNotice composerEmpty />);
      });
    };

    afterEach(() => {
      jest.useRealTimers();
    });

    it("opens the wallet connection when no wallet is live, then signs without a second click", async () => {
      mockConnection = { ...mockConnection, canSignActiveWallet: false };
      const { rerender } = renderNotice();

      await turnOn();
      expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
      expect(status()).toHaveTextContent(
        "Connect your wallet to continue. If it's locked, unlock it first."
      );
      expect(screen.getByRole("button", { name: "Turn on" })).toBeDisabled();
      expect(mockRequestGrant).not.toHaveBeenCalled();

      await rerenderWith(rerender, { seizeConnectOpen: true });
      await rerenderWith(rerender, {
        seizeConnectOpen: false,
        canSignActiveWallet: true,
      });

      expect(mockRequestGrant).toHaveBeenCalledTimes(1);
      expect(mockRequestGrant).toHaveBeenCalledWith(
        expect.objectContaining({ silent: true })
      );
      await waitFor(() =>
        expect(mockSetToast).toHaveBeenCalledWith({
          message: "Signed messages are on in this browser.",
          type: "success",
        })
      );
    });

    it("says when a locked wallet was not connected", async () => {
      jest.useFakeTimers();
      mockConnection = { ...mockConnection, canSignActiveWallet: false };
      const { rerender } = renderNotice();
      await turnOn();
      await rerenderWith(rerender, { seizeConnectOpen: true });
      await rerenderWith(rerender, { seizeConnectOpen: false });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(status()).toHaveTextContent(
        "Your wallet didn't connect. Unlock it and try again."
      );
      expect(screen.getByRole("button", { name: "Turn on" })).toBeEnabled();
      expect(mockReport).toHaveBeenCalledWith("notice", "connect-cancelled");
    });

    it("names the account to switch to and offers to reconnect", async () => {
      mockConnection = {
        ...mockConnection,
        canSignActiveWallet: false,
        connectedAccounts: [
          { address: ADDRESS, isActive: true, isConnected: false },
          {
            address: "0x2222222222222222222222222222222222222222",
            isActive: false,
            isConnected: true,
          },
        ],
      };
      renderNotice();
      await turnOn();

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Your wallet is on a different account. Switch it to 0x1111…1111 to continue."
      );
      expect(mockSeizeConnectFresh).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: "Reconnect wallet" })
        );
      });
      expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
    });

    it("tells the user to check the wallet, then that it may be locked", async () => {
      jest.useFakeTimers();
      waitForSignature();
      renderNotice();
      await turnOn();

      expect(status()).toHaveTextContent("Check your wallet to sign");
      act(() => {
        jest.advanceTimersByTime(8000);
      });
      expect(status()).toHaveTextContent(
        "Open your wallet to finish signing. It may be locked."
      );
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("answers a declined signature calmly, without an alert", async () => {
      const answer = waitForSignature();
      renderNotice();
      await turnOn();
      await answer({ success: false, reason: "rejected" });

      expect(status()).toHaveTextContent(
        "Signature canceled. Nothing changed, and you can try again any time."
      );
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("button", { name: "Turn on" })).toBeEnabled();
    });

    it("explains any other failure as an alert", async () => {
      const answer = waitForSignature();
      renderNotice();
      await turnOn();
      await answer({ success: false, reason: "challenge-failed" });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Couldn't reach 6529.io to start signing. Check your connection and try again."
      );
      expect(mockReport).toHaveBeenCalledWith(
        "notice",
        "challenge-failed",
        "browser"
      );
    });

    it("never shows phone pairing to a browser wallet whose error mentions WebSocket", async () => {
      // The grant names a "WebSocket ..." wallet error walletconnect-session.
      const answer = waitForSignature();
      renderNotice();
      await turnOn();
      await answer({ success: false, reason: "walletconnect-session" });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Your wallet couldn't sign. Unlock it and try again."
      );
      expect(screen.queryByText(/on your phone/)).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Reconnect wallet" })
      ).toBeNull();
    });

    it("reports the renew prompt as its own source", async () => {
      mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW + 5 * DAY }) };
      renderNotice();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Renew" }));
      });

      expect(mockRequestGrant).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith("renew", "start");
    });

    describe("with a WalletConnect wallet on a phone", () => {
      beforeEach(() => {
        mockIsRemoteWallet = true;
      });

      it("asks to approve on the phone and hints after 8 seconds", async () => {
        jest.useFakeTimers();
        waitForSignature();
        renderNotice();
        await turnOn();

        expect(status()).toHaveTextContent(
          "Open your wallet app on your phone and approve the signature"
        );
        expect(status()).not.toHaveTextContent(/unlock/i);
        act(() => {
          jest.advanceTimersByTime(8000);
        });
        expect(status()).toHaveTextContent(
          "Don't see it? Open the wallet app on your phone. If nothing is waiting there, reconnect your wallet."
        );
        expect(
          screen.queryByRole("button", { name: "Reconnect wallet" })
        ).toBeNull();
      });

      it("offers to pair again after 20 seconds and signs again once reconnected", async () => {
        jest.useFakeTimers();
        waitForSignature();
        const { rerender } = renderNotice();
        await turnOn();
        act(() => {
          jest.advanceTimersByTime(20_000);
        });

        expect(status()).toHaveTextContent(
          "Still nothing on your phone? Reconnect your wallet to pair it again. You'll be asked to sign again once it reconnects."
        );
        await act(async () => {
          fireEvent.click(
            screen.getByRole("button", { name: "Reconnect wallet" })
          );
        });
        expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
        expect(mockReport).toHaveBeenCalledWith(
          "notice",
          "walletconnect-no-answer",
          "remote"
        );

        await rerenderWith(rerender, {
          canSignActiveWallet: false,
          seizeConnectOpen: true,
        });
        await rerenderWith(rerender, {
          canSignActiveWallet: true,
          seizeConnectOpen: false,
        });

        expect(mockRequestGrant).toHaveBeenCalledTimes(2);
      });

      it("offers to pair again after a WalletConnect session error", async () => {
        const answer = waitForSignature();
        renderNotice();
        await turnOn();
        await answer({ success: false, reason: "walletconnect-session" });

        expect(screen.getByRole("alert")).toHaveTextContent(
          "Couldn't reach the wallet app on your phone. Reconnect your wallet to pair it again, then approve the signature."
        );
        expect(
          screen.getByRole("button", { name: "Reconnect wallet" })
        ).toBeVisible();
        expect(mockReport).toHaveBeenCalledWith(
          "notice",
          "walletconnect-session",
          "remote"
        );
      });
    });
  });

  describe("new-device alert", () => {
    beforeEach(() => {
      mockLocal = { ...mockLocal, grant: grant() };
    });

    it("treats the first list as a baseline and alerts only for later grants", () => {
      mockGrants = [grant(), otherDevice];
      const { rerender } = render(
        <SignedMessagesNotice composerEmpty={false} />
      );
      expect(screen.queryByTestId("signed-messages-notice")).toBeNull();

      const newDevice = grant({
        id: `0x${"3".repeat(64)}`,
        device_key: `0x${"cc".repeat(32)}`,
        device_label: "Safari on iPhone",
      });
      mockGrants = [newDevice, grant(), otherDevice];
      rerender(<SignedMessagesNotice composerEmpty={false} />);

      expect(
        screen.getByText("Safari on iPhone can now post as you. Not you?")
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "Revoke" })).toBeVisible();
    });

    it("never alerts for this browser's own keys, revoked or expired grants", () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [
        grant({ id: `0x${"4".repeat(64)}` }),
        { ...otherDevice, revoked_at: NOW - 1 },
        grant({
          id: `0x${"5".repeat(64)}`,
          device_key: `0x${"dd".repeat(32)}`,
          expires_at: NOW - 1,
        }),
      ];
      rerender(<SignedMessagesNotice composerEmpty />);
      expect(screen.queryByText(/can now post as you/)).toBeNull();
    });

    it("revokes the new device and confirms it", async () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);
      mockRevoke.mockResolvedValue(true);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
      });

      expect(mockRevoke).toHaveBeenCalledWith(otherDevice);
      expect(screen.queryByText(/can now post as you/)).toBeNull();
    });

    it("keeps the alert when revoking fails and can be dismissed", async () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);
      mockRevoke.mockResolvedValue(false);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
      });
      expect(screen.getByText(/can now post as you/)).toBeVisible();

      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByText(/can now post as you/)).toBeNull();
    });
  });
});
