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
import { E2EE_MESSAGES } from "@/i18n/messages/e2ee";
import { contextFor, E2eeTestProvider } from "../e2ee/fakeE2eeEngine";

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
let mockNetworkSupported = true;
jest.mock("@/hooks/device-signing/useSignedMessagesWallet", () => ({
  useSignedMessagesWallet: () => ({
    isRemoteWallet: mockIsRemoteWallet,
    networkName: "Ethereum",
    isNetworkSupported: () => mockNetworkSupported,
    switchNetwork: async () => "switched",
  }),
}));

// Local dev-auth browser tests only; off everywhere else.
let mockHasLocalTestSigner = false;
jest.mock("@/components/auth/signedMessagesTestSigner", () => ({
  hasLocalTestSigner: () => mockHasLocalTestSigner,
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
  failed?: boolean;
  grant: ApiDeviceGrant | null;
  publicKeys: string[];
};
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => mockLocal,
}));

// Whether the announced grant's device also has encrypted DMs (e2ee/me).
let mockReadsDms = false;
const mockReadsDmsHook = jest.fn();
jest.mock(
  "@/components/preferences/devices-security/useGrantReadsEncryptedDms",
  () => ({
    useGrantReadsEncryptedDms: (...args: unknown[]) => {
      mockReadsDmsHook(...args);
      return mockReadsDms;
    },
  })
);

const NEW_DEVICE_POSTS =
  /^It can now post as you\. Set up on .+\. If this wasn’t you, revoke it\.$/u;

let mockGrants: ApiDeviceGrant[] | undefined;
const mockRevoke = jest.fn();
const mockAcknowledge = jest.fn();
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: () => ({ data: mockGrants }),
  useAcknowledgeDeviceGrant: () => ({
    acknowledge: mockAcknowledge,
    isAcknowledging: false,
  }),
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
    mockReadsDms = false;
    mockReadsDmsHook.mockReset();
    mockRequestGrant.mockReset().mockResolvedValue({ success: true });
    mockRevoke.mockReset();
    mockAcknowledge.mockReset();
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

  it("opens setup before requesting any wallet signature", () => {
    const setup = jest.fn();
    window.addEventListener("6529:device-setup", setup, { once: true });
    render(<SignedMessagesNotice composerEmpty />);

    expect(
      screen.getByRole("region", {
        name: "Turn on signed posts",
      })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Turn on" }));

    expect(setup).toHaveBeenCalledWith(
      expect.objectContaining({ detail: "posts" })
    );
    expect(mockRequestGrant).not.toHaveBeenCalled();
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
    expect(screen.getByText(/^Signed posts end on/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Renew" })).toBeVisible();

    mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW - DAY }) };
    rerender(<SignedMessagesNotice composerEmpty />);
    expect(
      screen.getByText("Signed posts have ended in this browser")
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

  describe("renewing", () => {
    const renderNotice = () => {
      mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW + 5 * DAY }) };
      return render(<SignedMessagesNotice composerEmpty />);
    };
    const turnOn = () =>
      act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Renew" }));
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

    it("treats a local test signer as the live wallet on a supported network", async () => {
      mockHasLocalTestSigner = true;
      mockNetworkSupported = false;
      mockConnection = { ...mockConnection, canSignActiveWallet: false };
      try {
        renderNotice();
        await turnOn();
        await waitFor(() => expect(mockRequestGrant).toHaveBeenCalledTimes(1));
        expect(mockSeizeConnectFresh).not.toHaveBeenCalled();
      } finally {
        mockHasLocalTestSigner = false;
        mockNetworkSupported = true;
      }
    });

    it("opens the wallet connection when no wallet is live, then signs without a second click", async () => {
      mockConnection = { ...mockConnection, canSignActiveWallet: false };
      const { rerender } = renderNotice();

      await turnOn();
      expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
      expect(status()).toHaveTextContent(
        "Connect your wallet to continue. If it's locked, unlock it first."
      );
      expect(screen.getByRole("button", { name: "Renew" })).toBeDisabled();
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
          message: "Signed posts are on in this browser.",
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
      expect(screen.getByRole("button", { name: "Renew" })).toBeEnabled();
      expect(mockReport).toHaveBeenCalledWith("renew", "connect-cancelled");
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

      expect(status()).toHaveTextContent("Signature cancelled.");
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("button", { name: "Renew" })).toBeEnabled();
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
        "renew",
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
          "renew",
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
          "renew",
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

      // The same words as the encrypted inbox's alert for a new device.
      expect(
        screen.getByRole("region", { name: "New device: Safari on iPhone" })
      ).toBeVisible();
      expect(screen.getByText(NEW_DEVICE_POSTS)).toBeVisible();
      expect(screen.getByRole("button", { name: "Revoke" })).toBeVisible();
      expect(screen.getByRole("button", { name: "It was me" })).toBeVisible();
      expect(mockReadsDmsHook).toHaveBeenLastCalledWith(newDevice, ADDRESS);
    });

    it("names both permissions when the new device also reads encrypted DMs", () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockReadsDms = true;
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);

      expect(
        screen.getByText(
          /^It can now post as you and read your encrypted DMs\. Set up on /u
        )
      ).toBeVisible();
      expect(screen.queryByText(NEW_DEVICE_POSTS)).toBeNull();
    });

    it("asks about encrypted DMs only while a device is announced", () => {
      render(<SignedMessagesNotice composerEmpty />);
      expect(mockReadsDmsHook).toHaveBeenLastCalledWith(null, ADDRESS);
    });

    it("neither alerts nor offers to turn on when this browser's keys could not be read", () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      // This browser's own grant, granted after the baseline: with its keys
      // unreadable it must not look like another device, or like none.
      mockLocal = { loaded: true, failed: true, grant: null, publicKeys: [] };
      mockGrants = [grant({ id: `0x${"6".repeat(64)}` })];
      rerender(<SignedMessagesNotice composerEmpty />);

      expect(screen.queryByTestId("signed-messages-notice")).toBeNull();
      expect(screen.queryByText(/can now post as you/)).toBeNull();
      expect(screen.queryByRole("button", { name: "Turn on" })).toBeNull();
    });

    it("remembers a local grant after key loss and still alerts for a new device", () => {
      mockLocal = { ...mockLocal, grant: null };
      const { rerender, unmount } = render(
        <SignedMessagesNotice composerEmpty />
      );

      const ownGrant = grant();
      mockLocal = { ...mockLocal, grant: ownGrant };
      mockGrants = [ownGrant];
      rerender(<SignedMessagesNotice composerEmpty />);
      expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();

      unmount();
      mockLocal = { loaded: true, grant: null, publicKeys: [] };
      const { rerender: rerenderAfterKeyLoss } = render(
        <SignedMessagesNotice composerEmpty />
      );
      expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
      expect(screen.getByRole("button", { name: "Turn on" })).toBeVisible();

      mockGrants = [ownGrant, otherDevice];
      rerenderAfterKeyLoss(<SignedMessagesNotice composerEmpty />);
      expect(
        screen.getByText("New device: Firefox on Windows")
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
      expect(
        screen.queryByText(/^New device: /u)
      ).toBeNull();
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
      expect(
        screen.queryByText(/^New device: /u)
      ).toBeNull();
    });

    it("acknowledges an alert explicitly after a failed revoke", async () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);
      mockRevoke.mockResolvedValue(false);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
      });
      expect(
        screen.getByText(/^New device: /u)
      ).toBeVisible();

      expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
      mockAcknowledge.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "It was me" }));
      });
      expect(screen.getByRole("button", { name: "It was me" })).toBeVisible();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "It was me" }));
      });
      expect(mockAcknowledge).toHaveBeenCalledWith(otherDevice.id);
      expect(
        screen.queryByText(/^New device: /u)
      ).toBeNull();
    });

    it("clears an alert acknowledged on another device when the grant list refreshes", () => {
      mockGrants = [];
      const { rerender } = render(<SignedMessagesNotice composerEmpty />);
      mockGrants = [otherDevice];
      rerender(<SignedMessagesNotice composerEmpty />);
      expect(screen.getByRole("button", { name: "It was me" })).toBeVisible();

      mockGrants = [{ ...otherDevice, notice_acknowledged: true }];
      rerender(<SignedMessagesNotice composerEmpty />);
      expect(screen.queryByRole("button", { name: "It was me" })).toBeNull();
      expect(mockAcknowledge).not.toHaveBeenCalled();
      expect(mockRevoke).not.toHaveBeenCalled();
    });
  });

  describe("when encrypted DMs can be turned on too (F-18)", () => {
    // An idle engine: encrypted DMs are allowed but not set up here yet.
    const renderWithEncryption = () =>
      render(
        <E2eeTestProvider value={contextFor(null)}>
          <SignedMessagesNotice composerEmpty />
        </E2eeTestProvider>
      );

    it("names both permissions, as the setup dialog it opens does", () => {
      const setup = jest.fn();
      window.addEventListener("6529:device-setup", setup, { once: true });
      renderWithEncryption();

      expect(
        screen.getByRole("region", {
          name: E2EE_MESSAGES["e2ee.deviceStatus.enableBoth"],
        })
      ).toBeVisible();
      expect(
        screen.getByText(
          "One wallet signature, no gas. Lasts 180 days in this browser."
        )
      ).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Turn on" }));
      expect(setup).toHaveBeenCalledWith(
        expect.objectContaining({ detail: "both" })
      );
    });

    it("says renewing also turns on encrypted DMs", () => {
      mockLocal = { ...mockLocal, grant: grant({ expires_at: NOW - DAY }) };
      renderWithEncryption();

      expect(
        screen.getByText(/The same one signature also turns on encrypted DMs\.$/)
      ).toBeVisible();
    });
  });
});
