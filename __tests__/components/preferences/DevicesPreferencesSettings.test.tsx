import DevicesPreferencesSettings from "@/components/preferences/DevicesPreferencesSettings";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

const NOW = Date.UTC(2026, 9, 12, 12, 0);
const DAY = 86_400_000;
const ADDRESS = "0x1111111111111111111111111111111111111111";
const OWN_KEY = `0x${"aa".repeat(32)}`;

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
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => ({
    loaded: true,
    grant: mockLocalGrant,
    publicKeys: [OWN_KEY],
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
    }: {
      readonly isOpen: boolean;
      readonly title: string;
      readonly message: string;
      readonly confirmText: string;
      readonly cancelText: string;
      readonly onConfirm: () => void;
      readonly onClose: () => void;
    }) {
      return isOpen ? (
        <div role="dialog" aria-label={title}>
          <p>{message}</p>
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
    mockAccount = ADDRESS;
    mockLocalGrant = null;
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
      within(rows[0]!).getByText("Can post, edit, delete, and react")
    ).toBeVisible();
    expect(within(rows[0]!).getByText(/Last used/)).toBeVisible();
    expect(within(rows[1]!).queryByText("This device")).toBeNull();
    expect(within(rows[1]!).getByText(/Not used yet/)).toBeVisible();
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

  it("revokes a device after confirmation", async () => {
    mockQuery = { ...mockQuery, data: [grant(), phone] };
    mockRevoke.mockResolvedValue(true);
    render(<DevicesPreferencesSettings />);

    fireEvent.click(
      screen.getByRole("button", { name: "Revoke Safari on iPhone" })
    );
    const dialog = screen.getByRole("dialog", {
      name: "Revoke Safari on iPhone",
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Revoke" }));
    });

    expect(mockRevoke).toHaveBeenCalledWith(phone);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explains an empty list and offers to turn on signed messages here", async () => {
    render(<DevicesPreferencesSettings />);

    expect(screen.getByText("No device can post as you yet.")).toBeVisible();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Turn on signed messages in this browser",
        })
      );
    });
    expect(mockRequestGrant).toHaveBeenCalledTimes(1);
    expect(mockReport).toHaveBeenCalledWith("devices", "start");
  });

  it("connects a wallet that is not live before signing, and says so", async () => {
    mockConnection = { ...mockConnection, canSignActiveWallet: false };
    const { rerender } = render(<DevicesPreferencesSettings />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Turn on signed messages in this browser",
        })
      );
    });
    expect(mockSeizeConnectFresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Connect your wallet to continue. If it's locked, unlock it first."
    );

    mockConnection = { ...mockConnection, seizeConnectOpen: true };
    await act(async () => {
      rerender(<DevicesPreferencesSettings />);
    });
    mockConnection = {
      ...mockConnection,
      seizeConnectOpen: false,
      canSignActiveWallet: true,
    };
    await act(async () => {
      rerender(<DevicesPreferencesSettings />);
    });
    expect(mockRequestGrant).toHaveBeenCalledTimes(1);
  });

  it("explains a failure next to the turn-on action", async () => {
    mockRequestGrant.mockResolvedValue({
      success: false,
      reason: "device-key",
    });
    render(<DevicesPreferencesSettings />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "Turn on signed messages in this browser",
        })
      );
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This browser couldn't prepare its signing key. Please try again."
    );
  });

  it("hides the turn-on action when this browser already has a grant or cannot hold a key", () => {
    mockLocalGrant = grant();
    const { rerender } = render(<DevicesPreferencesSettings />);
    expect(
      screen.queryByRole("button", {
        name: "Turn on signed messages in this browser",
      })
    ).toBeNull();

    mockLocalGrant = null;
    mockAccount = null;
    rerender(<DevicesPreferencesSettings />);
    expect(
      screen.queryByRole("button", {
        name: "Turn on signed messages in this browser",
      })
    ).toBeNull();
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
