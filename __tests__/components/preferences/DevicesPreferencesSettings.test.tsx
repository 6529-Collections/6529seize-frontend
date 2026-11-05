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

const mockRenameDevice = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: (...args: unknown[]) => mockRenameDevice(...args),
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
    mockEncryptionEnabled = false;
    mockEncryptionQuery.mockReset().mockReturnValue({});
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
      within(rows[0]!).getByText(
        "Signed Posts · Can post, edit, delete, and react"
      )
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

  it("warns about both permissions and local history for a linked grant", () => {
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
    expect(
      within(dialog).getByText(
        /clears this device’s local encrypted chat history/
      )
    ).toBeVisible();
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
      screen.getByRole("button", { name: "Enable Signed Posts" })
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
        name: "Enable Signed Posts",
      })
    ).toBeNull();

    mockLocalGrant = null;
    mockAccount = null;
    rerender(<DevicesPreferencesSettings />);
    expect(
      screen.queryByRole("button", {
        name: "Enable Signed Posts",
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
