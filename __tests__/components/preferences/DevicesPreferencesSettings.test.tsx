import DevicesPreferencesSettings from "@/components/preferences/DevicesPreferencesSettings";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";

const mockRenameDevice = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: (...args: unknown[]) => mockRenameDevice(...args),
}));

const mockRevokeE2eeDevice = jest.fn();
const mockRestart = jest.fn();
let mockE2ee: Record<string, unknown>;
jest.mock("@/hooks/e2ee/useE2ee", () => ({ useE2ee: () => mockE2ee }));
const mockRemoveLocal = jest.fn();
jest.mock("@/lib/e2ee/local-data", () => ({
  removeE2eeProfileLocalData: (...args: unknown[]) => mockRemoveLocal(...args),
}));

const mockEncryptionQuery = jest.fn();
let mockEncryptionEnabled = false;
jest.mock("@/config/e2eeEnv", () => ({
  isE2eeEnabled: () => mockEncryptionEnabled,
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => mockEncryptionQuery(),
}));

const NOW = Date.UTC(2026, 9, 12, 12, 0);
const DAY = 86_400_000;
const ADDRESS = "0x1111111111111111111111111111111111111111";
const OWN_KEY = `0x${"aa".repeat(32)}`;
const PHONE_E2EE_KEY = `0x${"e2".repeat(32)}`;
const THIS_E2EE_KEY = `0x${"e1".repeat(32)}`;

const mockSetToast = jest.fn();
const mockRequestGrant = jest.fn();
let mockAuth: Record<string, unknown>;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
const mockSeizeConnectFresh = jest.fn(async () => undefined);
let mockConnection: Record<string, unknown>;
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));
jest.mock("@/hooks/device-signing/useSignedMessagesWallet", () => ({
  useSignedMessagesWallet: () => ({
    isRemoteWallet: false,
    networkName: "Ethereum",
    isNetworkSupported: () => true,
    switchNetwork: async () => "switched",
  }),
}));
const mockReport = jest.fn();
jest.mock("@/utils/monitoring/signedMessagesEnableMonitoring", () => ({
  reportSignedMessagesEnable: (...args: unknown[]) => mockReport(...args),
}));

let mockAccount: string | null = ADDRESS;
jest.mock("@/hooks/device-signing/useSignedMessagesAccount", () => ({
  useSignedMessagesAccount: () => mockAccount,
}));
jest.mock("@/hooks/device-signing/useMinuteClock", () => ({
  useMinuteClock: () => NOW,
}));

let mockLocalGrant: ApiDeviceGrant | null = null;
let mockOwnKey = OWN_KEY;
let mockLocalState: { loaded: boolean; failed: boolean } = {
  loaded: true,
  failed: false,
};
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => ({
    ...mockLocalState,
    grant: mockLocalGrant,
    // An unreadable key store reports no keys (see useLocalDeviceKeys).
    publicKeys:
      mockLocalState.failed || !mockLocalState.loaded ? [] : [mockOwnKey],
  }),
}));

let mockQuery: Record<string, unknown>;
const mockRevoke = jest.fn();
let mockGrantsAddress: string | null | undefined;
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: (address: string | null) => {
    mockGrantsAddress = address;
    return mockQuery;
  },
  useRevokeDeviceGrant: () => ({ revoke: mockRevoke, isRevoking: false }),
}));

jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () =>
    function MockConfirmationDialog({
      isOpen,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onClose,
      children,
    }: {
      readonly isOpen: boolean;
      readonly title: string;
      readonly message: string;
      readonly confirmText: string;
      readonly cancelText: string;
      readonly onConfirm: () => void;
      readonly onClose: () => void;
      readonly children?: ReactNode;
    }) {
      return isOpen ? (
        <div role="dialog" aria-label={title}>
          <p>{message}</p>
          {children}
          <button type="button" onClick={onClose}>
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      ) : null;
    }
);

const grant = (overrides: Partial<ApiDeviceGrant> = {}): ApiDeviceGrant =>
  ({
    id: `0x${"1".repeat(64)}`,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: OWN_KEY,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "Chrome on macOS",
    domain: "6529.io",
    issued_at: NOW - 10 * DAY,
    expires_at: NOW + 170 * DAY,
    created_at: NOW - 10 * DAY,
    revoked_at: null,
    last_used_at: NOW - DAY,
    ...overrides,
  }) as ApiDeviceGrant;

const phone = grant({
  id: `0x${"2".repeat(64)}`,
  device_key: `0x${"bb".repeat(32)}`,
  device_label: "Safari on iPhone",
  last_used_at: null,
});

describe("DevicesPreferencesSettings", () => {
  beforeEach(() => {
    mockRevokeE2eeDevice.mockReset().mockResolvedValue(undefined);
    mockRestart.mockReset();
    mockRemoveLocal.mockReset().mockResolvedValue(undefined);
    mockE2ee = {
      status: "disabled",
      engine: null,
      thisDevice: null,
      profileId: "profile",
      restart: mockRestart,
    };
    mockEncryptionEnabled = false;
    mockEncryptionQuery.mockReset().mockReturnValue({});
    mockAccount = ADDRESS;
    mockLocalGrant = null;
    mockLocalState = { loaded: true, failed: false };
    mockOwnKey = OWN_KEY;
    mockGrantsAddress = undefined;
    mockAuth = {
      activeProfileProxy: null,
      isAuthenticated: true,
      setToast: mockSetToast,
      requestSignedMessagesGrant: mockRequestGrant,
    };
    mockQuery = {
      data: [],
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    };
    mockSetToast.mockReset();
    mockRevoke.mockReset();
    mockRequestGrant.mockReset().mockResolvedValue({ success: true });
    mockReport.mockReset();
    mockSeizeConnectFresh.mockClear();
    mockConnection = {
      address: ADDRESS,
      canSignActiveWallet: true,
      connectedAccounts: [],
      isWalletConnectionPending: false,
      seizeConnectFresh: mockSeizeConnectFresh,
      seizeConnectOpen: false,
    };
  });

  it("lists every grant with this device, scopes, dates and status", () => {
    mockQuery = {
      ...mockQuery,
      data: [
        grant(),
        phone,
        grant({
          id: `0x${"3".repeat(64)}`,
          device_key: `0x${"cc".repeat(32)}`,
          device_label: "Firefox on Windows",
          expires_at: NOW - DAY,
        }),
        grant({
          id: `0x${"4".repeat(64)}`,
          device_key: `0x${"dd".repeat(32)}`,
          device_label: "Edge on Windows",
          revoked_at: NOW - 2 * DAY,
        }),
      ],
    };
    render(<DevicesPreferencesSettings />);

    const list = screen.getByRole("list", { name: "Devices" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(within(rows[0]!).getByText("This device")).toBeVisible();
    expect(within(rows[0]!).getByText("Active")).toBeVisible();
    expect(
      within(rows[0]!).getByText(
        "Signed Posts · Can post, edit, delete, and react"
      )
    ).toBeVisible();
    expect(within(rows[0]!).getByText(/Active now/)).toBeVisible();
    expect(within(rows[1]!).queryByText("This device")).toBeNull();
    expect(within(rows[1]!).getByText(/Not active yet/)).toBeVisible();
    expect(within(rows[2]!).getByText("Expired")).toBeVisible();
    expect(
      within(rows[2]!).queryByRole("button", { name: /^Revoke / })
    ).toBeNull();
    expect(within(rows[3]!).getByText("Revoked")).toBeVisible();
    expect(within(rows[3]!).getByText(/Revoked Oct/)).toBeVisible();
    expect(
      within(rows[3]!).queryByRole("button", { name: /^Revoke / })
    ).toBeNull();
    expect(
      screen
        .getAllByRole("button", { name: /^Revoke / })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Revoke Chrome on macOS", "Revoke Safari on iPhone"]);
    expect(mockGrantsAddress).toBe(ADDRESS);
  });

  it("warns about both permissions and local history for a linked grant", () => {
    mockEncryptionEnabled = true;
    mockAuth = { ...mockAuth, connectedProfile: { id: "profile" } };
    mockQuery = { ...mockQuery, data: [phone] };
    mockEncryptionQuery.mockReturnValue({
      isSuccess: true,
      data: [
        {
          device_key: PHONE_E2EE_KEY,
          grant_id: phone.id,
          grant_message: "combined grant",
          revoked_at: null,
          grant: { expires_at: (NOW + DAY) / 1000 },
        },
      ],
    });

    render(<DevicesPreferencesSettings />);
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke Safari on iPhone" })
    );

    const dialog = screen.getByRole("dialog", {
      name: "Revoke access to signed posts and encrypted DMs for Safari on iPhone?",
    });
    // Encrypted messages are off in this browser: nothing can sign the
    // device's revocation here, so no deletion is promised.
    expect(
      within(dialog).getByText(/Its saved chat history stays on it/)
    ).toBeVisible();
  });

  it("shows one last-active time: the later use of either permission (F-11)", () => {
    mockEncryptionEnabled = true;
    mockAuth = { ...mockAuth, connectedProfile: { id: "profile" } };
    mockQuery = { ...mockQuery, data: [phone] };
    mockEncryptionQuery.mockReturnValue({
      isSuccess: true,
      data: [
        {
          grant_id: phone.id,
          grant_message: "combined grant",
          revoked_at: null,
          last_seen_at: NOW - 60_000,
          grant: { expires_at: (NOW + DAY) / 1000 },
        },
      ],
    });

    render(<DevicesPreferencesSettings />);

    const row = within(screen.getByRole("list", { name: "Devices" }))
      .getAllByRole("listitem")
      .at(0)!;
    expect(within(row).getByText(/Last active Oct 12, 2026/)).toBeVisible();
    expect(within(row).queryByText(/Not active yet|Not used yet/)).toBeNull();
  });

  describe("revoking this browser (F-06)", () => {
    it("names it as the browser in use and what stops", () => {
      mockQuery = { ...mockQuery, data: [grant(), phone] };
      render(<DevicesPreferencesSettings />);

      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Chrome on macOS" })
      );
      const dialog = screen.getByRole("dialog", {
        name: "Revoke this browser?",
      });
      expect(dialog).toHaveTextContent(
        "Chrome on macOS is the browser you’re using now."
      );
      expect(dialog).toHaveTextContent(
        "Posts from here won’t be signed until you turn signed posts back on."
      );
      // A signed-posts-only grant holds no encrypted chats to lose.
      expect(dialog).not.toHaveTextContent("encrypted chats");
      expect(
        within(dialog).getByRole("button", { name: "Revoke this browser" })
      ).toBeInTheDocument();
    });

    it("recognises this browser whatever the case of either key", () => {
      mockOwnKey = OWN_KEY.toUpperCase().replace("0X", "0x");
      mockQuery = {
        ...mockQuery,
        data: [grant({ device_key: `0x${"aA".repeat(32)}` })],
      };
      render(<DevicesPreferencesSettings />);

      expect(screen.getByText("This device")).toBeVisible();
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Chrome on macOS" })
      );
      expect(
        screen.getByRole("dialog", { name: "Revoke this browser?" })
      ).toBeInTheDocument();
    });

    it("warns about encrypted chats and links to backup for a linked grant", async () => {
      mockEncryptionEnabled = true;
      mockAuth = { ...mockAuth, connectedProfile: { id: "profile" } };
      mockQuery = { ...mockQuery, data: [grant()] };
      mockRevoke.mockResolvedValue(true);
      mockEncryptionQuery.mockReturnValue({
        isSuccess: true,
        refetch: jest.fn(),
        data: [
          {
            grant_id: grant().id,
            grant_message: "combined grant",
            label: "Brave on Windows",
            revoked_at: null,
            grant: { expires_at: (NOW + DAY) / 1000 },
          },
        ],
      });

      render(<DevicesPreferencesSettings />);
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Brave on Windows" })
      );
      const dialog = screen.getByRole("dialog", {
        name: "Revoke this browser?",
      });
      expect(dialog).toHaveTextContent(
        "This browser stops receiving encrypted DMs, and the encrypted chats saved here are deleted."
      );
      expect(dialog).toHaveTextContent("This browser may not be backed up.");
      expect(
        within(dialog).getByRole("link", { name: "Check backup first" })
      ).toHaveAttribute("href", "/messages/encrypted/devices");

      await act(async () => {
        fireEvent.click(
          within(dialog).getByRole("button", { name: "Revoke this browser" })
        );
      });
      expect(mockRevoke).toHaveBeenCalledWith(grant());
    });
  });

  describe("revoking a grant with a linked encryption device", () => {
    const linkedPhone = {
      device_key: PHONE_E2EE_KEY,
      grant_id: phone.id,
      grant_message: "combined grant",
      label: "Safari on iPhone",
      revoked_at: null,
      grant: { expires_at: (NOW + DAY) / 1000 },
    };
    const linkedThis = {
      ...linkedPhone,
      device_key: THIS_E2EE_KEY,
      grant_id: grant().id,
      label: "Chrome on macOS",
    };
    const setUp = (
      ready: boolean,
      grants = [grant(), phone],
      devices = [linkedPhone, linkedThis]
    ) => {
      mockEncryptionEnabled = true;
      mockAuth = { ...mockAuth, connectedProfile: { id: "profile" } };
      mockQuery = { ...mockQuery, data: grants };
      mockEncryptionQuery.mockReturnValue({
        isSuccess: true,
        refetch: jest.fn(),
        data: devices,
      });
      mockE2ee = {
        ...mockE2ee,
        status: ready ? "ready" : "needs-enrollment",
        engine: ready
          ? {
              revokeDevice: mockRevokeE2eeDevice,
              getUpgrade: () => null,
              subscribe: () => () => undefined,
            }
          : null,
        thisDevice: ready ? { deviceKey: THIS_E2EE_KEY } : null,
      };
      const order: string[] = [];
      mockRevokeE2eeDevice.mockImplementation(async () => {
        order.push("signed");
      });
      mockRevoke.mockImplementation(async () => {
        order.push("grant");
        return true;
      });
      render(<DevicesPreferencesSettings />);
      return order;
    };
    const confirm = async (label: string, button = "Revoke") => {
      fireEvent.click(screen.getByRole("button", { name: `Revoke ${label}` }));
      const dialog = screen.getByRole("dialog");
      await act(async () => {
        fireEvent.click(within(dialog).getByRole("button", { name: button }));
      });
    };

    it("signs another device's revocation first when encrypted messages are on here", async () => {
      const order = setUp(true);
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Safari on iPhone" })
      );
      expect(
        within(screen.getByRole("dialog")).getByText(
          /deletes its saved chat history once it confirms the revocation/
        )
      ).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await confirm("Safari on iPhone");
      expect(mockRevokeE2eeDevice).toHaveBeenCalledWith(PHONE_E2EE_KEY);
      expect(order).toEqual(["signed", "grant"]);
      expect(mockRemoveLocal).not.toHaveBeenCalled();
      expect(mockSetToast).not.toHaveBeenCalled();
    });

    it("tells the user, by the grant's name, when another device's revocation could not be signed", async () => {
      // The encrypted device was renamed; the notice uses the grant's name,
      // as the revoke result does.
      const order = setUp(
        true,
        [grant(), phone],
        [{ ...linkedPhone, label: "Phone for chats" }, linkedThis]
      );
      mockRevokeE2eeDevice.mockRejectedValueOnce(new Error("offline"));
      await confirm("Phone for chats");
      expect(order).toEqual(["grant"]);
      expect(mockRemoveLocal).not.toHaveBeenCalled();
      expect(mockSetToast).toHaveBeenCalledTimes(1);
      expect(mockSetToast).toHaveBeenCalledWith({
        type: "warning",
        message:
          "Safari on iPhone was revoked, but this browser couldn’t sign the revocation of its encrypted messages. Its saved chat history stays on that device until it’s removed there.",
      });
    });

    it("lets the user confirm again after a revoke that failed", async () => {
      setUp(true);
      mockRevoke.mockResolvedValueOnce(false);
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Safari on iPhone" })
      );
      const button = within(screen.getByRole("dialog")).getByRole("button", {
        name: "Revoke",
      });
      await act(async () => {
        fireEvent.click(button);
      });
      expect(mockRevoke).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(button);
      });
      expect(mockRevokeE2eeDevice).toHaveBeenCalledTimes(2);
      expect(mockRevoke).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("says nothing more when that grant could not be revoked", async () => {
      setUp(true);
      mockRevokeE2eeDevice.mockRejectedValueOnce(new Error("offline"));
      mockRevoke.mockResolvedValueOnce(false);
      await confirm("Safari on iPhone");
      expect(mockSetToast).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("revokes a grant with no linked encryption device without signing", async () => {
      const tablet = grant({
        id: `0x${"3".repeat(64)}`,
        device_key: `0x${"cc".repeat(32)}`,
        device_label: "Firefox on Linux",
      });
      const order = setUp(true, [grant(), phone, tablet]);
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Firefox on Linux" })
      );
      expect(
        screen.getByRole("dialog", {
          name: "Revoke signed posts for Firefox on Linux?",
        })
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await confirm("Firefox on Linux");
      expect(order).toEqual(["grant"]);
      expect(mockRevoke).toHaveBeenCalledWith(tablet);
      expect(mockRevokeE2eeDevice).not.toHaveBeenCalled();
      expect(mockRemoveLocal).not.toHaveBeenCalled();
      expect(mockSetToast).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("lets the engine clear this browser when it signed its own revocation", async () => {
      setUp(true);
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Chrome on macOS" })
      );
      // This browser's own dialog says its encrypted chats go right away.
      expect(
        screen.getByRole("dialog", { name: "Revoke this browser?" })
      ).toHaveTextContent("the encrypted chats saved here are deleted");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await confirm("Chrome on macOS", "Revoke this browser");
      expect(mockRevokeE2eeDevice).toHaveBeenCalledWith(THIS_E2EE_KEY);
      expect(mockRemoveLocal).not.toHaveBeenCalled();
    });

    it("clears this browser's encrypted data itself when the engine is not ready", async () => {
      const order = setUp(false);
      await confirm("Chrome on macOS", "Revoke this browser");
      expect(order).toEqual(["grant"]);
      expect(mockRevokeE2eeDevice).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(mockRemoveLocal).toHaveBeenCalledWith("profile")
      );
      expect(mockRestart).toHaveBeenCalled();
    });

    it("signs once when confirm is pressed again while signing", async () => {
      setUp(true);
      let finishSigning: () => void = () => undefined;
      mockRevokeE2eeDevice.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finishSigning = resolve;
          })
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Safari on iPhone" })
      );
      const dialog = screen.getByRole("dialog");
      const button = within(dialog).getByRole("button", { name: "Revoke" });
      fireEvent.click(button);
      fireEvent.click(button);
      await act(async () => {
        finishSigning();
      });
      expect(mockRevokeE2eeDevice).toHaveBeenCalledTimes(1);
      expect(mockRevoke).toHaveBeenCalledTimes(1);
    });

    it("revokes once when confirm is pressed again while the grant is revoked", async () => {
      setUp(true);
      let finishRevoke: (revoked: boolean) => void = () => undefined;
      mockRevoke.mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            finishRevoke = resolve;
          })
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Safari on iPhone" })
      );
      const dialog = screen.getByRole("dialog");
      const button = within(dialog).getByRole("button", { name: "Revoke" });
      await act(async () => {
        fireEvent.click(button);
      });
      // Signed; the grant revoke is still in flight.
      expect(mockRevokeE2eeDevice).toHaveBeenCalledTimes(1);
      expect(mockRevoke).toHaveBeenCalledTimes(1);
      await act(async () => {
        fireEvent.click(button);
      });
      await act(async () => {
        finishRevoke(true);
      });
      expect(mockRevokeE2eeDevice).toHaveBeenCalledTimes(1);
      expect(mockRevoke).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("revokes another device's grant unsigned when encrypted messages are off here", async () => {
      const order = setUp(false);
      await confirm("Safari on iPhone");
      expect(order).toEqual(["grant"]);
      expect(mockRemoveLocal).not.toHaveBeenCalled();
      // The dialog already said its history stays on that device.
      expect(mockSetToast).not.toHaveBeenCalled();
    });
  });

  it("renames a linked grant through the same device record Mobile uses", async () => {
    mockEncryptionEnabled = true;
    mockAuth = { ...mockAuth, connectedProfile: { id: "profile" } };
    mockQuery = { ...mockQuery, data: [phone] };
    const deviceKey = `0x${"cc".repeat(32)}`;
    const refetch = jest.fn();
    mockRenameDevice.mockResolvedValueOnce({ label: "My phone" });
    mockEncryptionQuery.mockReturnValue({
      isSuccess: true,
      refetch,
      data: [
        {
          device_key: deviceKey,
          grant_id: phone.id,
          grant_message: "combined grant",
          label: "6529 app on iOS",
          revoked_at: null,
          grant: { expires_at: (NOW + DAY) / 1000 },
        },
      ],
    });

    render(<DevicesPreferencesSettings />);
    fireEvent.click(screen.getByText("Rename device"));
    fireEvent.change(screen.getByLabelText("Device name"), {
      target: { value: "My phone" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(mockRenameDevice).toHaveBeenCalledWith({
      endpoint: `e2ee/devices/${deviceKey}/label`,
      body: { label: "My phone" },
    });
  });

  it("revokes a device after confirmation", async () => {
    mockQuery = { ...mockQuery, data: [grant(), phone] };
    mockRevoke.mockResolvedValue(true);
    render(<DevicesPreferencesSettings />);

    fireEvent.click(
      screen.getByRole("button", { name: "Revoke Safari on iPhone" })
    );
    const dialog = screen.getByRole("dialog", {
      name: "Revoke signed posts for Safari on iPhone?",
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Revoke" }));
    });

    expect(mockRevoke).toHaveBeenCalledWith(phone);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the shared setup before connecting or signing", () => {
    mockConnection = { ...mockConnection, canSignActiveWallet: false };
    const setup = jest.fn();
    window.addEventListener("6529:device-setup", setup, { once: true });
    render(<DevicesPreferencesSettings />);

    expect(screen.getByText("No authorized devices yet.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Turn on signed posts" })
    );

    expect(setup).toHaveBeenCalledWith(
      expect.objectContaining({ detail: "posts" })
    );
    expect(mockSeizeConnectFresh).not.toHaveBeenCalled();
    expect(mockRequestGrant).not.toHaveBeenCalled();
  });

  it("hides the turn-on action when this browser already has a grant or cannot hold a key", () => {
    mockLocalGrant = grant();
    mockQuery = { ...mockQuery, data: [mockLocalGrant] };
    const { rerender } = render(<DevicesPreferencesSettings />);
    expect(
      screen.queryByRole("button", {
        name: "Turn on signed posts",
      })
    ).toBeNull();

    mockLocalGrant = null;
    mockAccount = null;
    rerender(<DevicesPreferencesSettings />);
    expect(
      screen.queryByRole("button", {
        name: "Turn on signed posts",
      })
    ).toBeNull();
  });

  describe("when this browser's keys cannot be read", () => {
    const UNREADABLE =
      "This browser couldn't read its own keys, so it can't mark which device below is this one. Check a device's name and dates before you revoke it.";
    const MAYBE_THIS =
      "This browser couldn't read its own keys, so this may be the permission this browser uses.";

    it("says so politely and warns before any revocation", async () => {
      mockLocalState = { loaded: true, failed: true };
      mockQuery = { ...mockQuery, data: [grant(), phone] };
      render(<DevicesPreferencesSettings />);

      const note = screen.getByText(UNREADABLE);
      expect(note).toHaveAttribute("role", "status");
      expect(screen.queryByText("This device")).toBeNull();

      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Chrome on macOS" })
      );
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText(MAYBE_THIS)).toBeVisible();
    });

    it("shows neither once the keys were read", async () => {
      mockQuery = { ...mockQuery, data: [grant(), phone] };
      render(<DevicesPreferencesSettings />);

      expect(screen.queryByText(UNREADABLE)).toBeNull();
      expect(screen.getByText("This device")).toBeVisible();
      fireEvent.click(
        screen.getByRole("button", { name: "Revoke Safari on iPhone" })
      );
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).queryByText(MAYBE_THIS)).toBeNull();
    });

    it("says nothing while the keys are still loading", () => {
      mockLocalState = { loaded: false, failed: false };
      mockQuery = { ...mockQuery, data: [grant(), phone] };
      render(<DevicesPreferencesSettings />);

      expect(screen.queryByText(UNREADABLE)).toBeNull();
    });
  });

  it("shows a recoverable error", () => {
    const refetch = jest.fn();
    mockQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      isSuccess: false,
      refetch,
    };
    render(<DevicesPreferencesSettings />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load your devices."
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows a loading state", () => {
    mockQuery = {
      ...mockQuery,
      data: undefined,
      isLoading: true,
      isSuccess: false,
    };
    render(<DevicesPreferencesSettings />);
    expect(screen.getByLabelText("Loading devices")).toBeInTheDocument();
  });

  it("does not load grants while acting through a proxy", () => {
    mockAuth = { ...mockAuth, activeProfileProxy: { id: "proxy" } };
    render(<DevicesPreferencesSettings />);
    expect(mockGrantsAddress).toBeNull();
    expect(
      screen.getByText("Switch to your own profile to manage devices.")
    ).toBeVisible();
  });
});
