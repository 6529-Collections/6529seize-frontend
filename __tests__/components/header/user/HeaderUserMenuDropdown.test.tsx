import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import HeaderUserMenuDropdown from "@/components/header/user/HeaderUserMenuDropdown";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { AuthContextType } from "@/components/auth/authTypes";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import WebSidebarUser from "@/components/layout/sidebar/WebSidebarUser";
import { useChainSwitcher } from "@/components/header/useChainSwitcher";
import { PROFILE_DOUBLE_ACTIVATE_DELAY_MS } from "@/components/header/profile-activation.constants";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { mainnet } from "viem/chains";

jest.mock("@/components/header/user/HeaderUserProxyDropdownItem", () => () => (
  <div data-testid="item" />
));
jest.mock(
  "@/components/header/user/connected/HeaderUserConnectedAccounts",
  () =>
    (props: {
      readonly accounts: SeizeConnectContextType["connectedAccounts"];
      readonly canAddAccount: boolean;
      readonly onAddAccount: () => void;
      readonly onSignOutAll: () => void;
      readonly onSelectAccount: (address: string) => void;
    }) => (
      <div data-testid="connected-accounts">
        {props.canAddAccount && (
          <button onClick={props.onAddAccount}>Add profile</button>
        )}
        {props.accounts?.length > 1 && (
          <button onClick={props.onSignOutAll}>Sign out all</button>
        )}
        <button
          onClick={() => {
            const nextAccount = props.accounts?.find(
              (account: { isActive: boolean }) => !account.isActive
            );
            if (nextAccount) {
              props.onSelectAccount(nextAccount.address);
            }
          }}
        >
          Switch
        </button>
      </div>
    )
);
jest.mock("@/components/auth/SeizeConnectContext");
jest.mock("@/components/header/useChainSwitcher", () => ({
  useChainSwitcher: jest.fn(),
}));
jest.mock("@/components/header/share/HeaderShare", () => ({
  HeaderConnectModal: ({ show }: { readonly show: boolean }) =>
    show ? <div role="dialog" aria-label="Connect Device modal" /> : null,
}));
jest.mock("@/components/header/user/HeaderUserConnect", () => () => null);
jest.mock("@/components/user/utils/level/UserLevel", () => () => null);
jest.mock("@/components/auth/connection-state-indicator", () => ({
  getConnectionProfileIndicator: () => ({
    avatarClassName: "",
    overlayClassName: "",
    title: "Connected",
  }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (value: string) => value,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  useIsMobileDeviceStatus: () => ({
    isMobileDevice: false,
    isDeviceDetectionResolved: true,
  }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null, isLoading: false }),
}));
jest.mock("react-use", () => ({ useClickAway: jest.fn() }));

const mockConnect = jest.mocked(useSeizeConnectContext);
const mockUseChainSwitcher = jest.mocked(useChainSwitcher);

const profileBase: ApiIdentity = {
  id: "profile-1",
  handle: "alice",
  normalised_handle: "alice",
  pfp: null,
  cic: 0,
  rep: 0,
  level: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  consolidation_key: "profile-1",
  display: "Alice",
  primary_wallet: "0xabc",
  banner1: null,
  banner2: null,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  wallets: [{ wallet: "0xabc", display: "Alice", tdh: 0 }],
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};

const profileMin: ApiProfileMin = {
  id: "profile-min-1",
  handle: "proxy",
  pfp: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  primary_address: "0xproxy",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};

const profileProxy: ApiProfileProxy = {
  id: "proxy-1",
  granted_to: profileMin,
  created_at: 0,
  created_by: profileMin,
  actions: [],
};

type ConnectedAccount = SeizeConnectContextType["connectedAccounts"][number];

function connectedAccount(
  address: string,
  isActive: boolean
): ConnectedAccount {
  return {
    address,
    role: null,
    profileId: null,
    profileHandle: null,
    isActive,
    isConnected: true,
  };
}

interface RenderOptions {
  readonly address?: string | undefined;
  readonly isAuthenticated?: boolean | undefined;
  readonly isConnected?: boolean | undefined;
  readonly isCollapsed?: boolean | undefined;
  readonly connectedAccounts?: readonly ConnectedAccount[] | undefined;
  readonly canAddConnectedAccount?: boolean | undefined;
  readonly seizeAddConnectedAccount?: (() => void) | undefined;
  readonly seizeConnect?: (() => void) | undefined;
  readonly seizeConnectFresh?: (() => Promise<void>) | undefined;
  readonly seizeDisconnect?: (() => Promise<void>) | undefined;
  readonly seizeDisconnectAndLogout?: (() => Promise<void>) | undefined;
  readonly seizeDisconnectAndLogoutAll?: (() => Promise<void>) | undefined;
  readonly seizeSwitchConnectedAccount?:
    | ((address: string) => void)
    | undefined;
  readonly requestSessionUpgrade?:
    | (() => Promise<{ success: boolean }>)
    | undefined;
  readonly sessionUpgradeRequired?: boolean | undefined;
  readonly chains?: readonly { readonly id: number; readonly name: string }[];
  readonly currentChainName?: string | undefined;
  readonly nextChainName?: string | undefined;
  readonly switchToNextChain?: (() => boolean) | undefined;
  readonly profile?: ApiIdentity | undefined;
  readonly onOpenConnect?: (() => void) | undefined;
}

function createConnectContext(
  overrides: Partial<SeizeConnectContextType> = {}
): SeizeConnectContextType {
  const address = overrides.address ?? "0xabc";
  return {
    address,
    walletName: undefined,
    walletIcon: undefined,
    isSafeWallet: false,
    seizeConnect: jest.fn(),
    seizeConnectFresh: jest.fn().mockResolvedValue(undefined),
    seizeDisconnect: jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogout: jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogoutAll: jest.fn().mockResolvedValue(undefined),
    seizeAcceptConnection: jest.fn(),
    seizeConnectOpen: false,
    isConnected: true,
    canSignActiveWallet: true,
    hasActiveWalletAddress: Boolean(address),
    hasValidWalletAuth: true,
    isAuthenticated: true,
    connectionState: "connected",
    walletState: address
      ? { status: "connected", address }
      : { status: "disconnected" },
    hasInitializationError: false,
    initializationError: undefined,
    connectedAccounts: [],
    seizeSwitchConnectedAccount: jest.fn(),
    seizeAddConnectedAccount: jest.fn(),
    canAddConnectedAccount: false,
    connectedAccountUnreadNotifications: {},
    ...overrides,
  };
}

function createAuthContext(
  overrides: Partial<AuthContextType> = {}
): AuthContextType {
  return {
    connectedProfile: profileBase,
    isAuthenticated: true,
    fetchingProfile: false,
    connectionStatus: ProfileConnectedStatus.HAVE_PROFILE,
    receivedProfileProxies: [profileProxy],
    activeProfileProxy: null,
    showWaves: true,
    sessionUpgradeRequired: false,
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    requestSessionUpgrade: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
    setActiveProfileProxy: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderWebSidebar(options: RenderOptions) {
  const setToast = jest.fn();
  mockConnect.mockReturnValue(
    createConnectContext({
      address: options.address ?? "0xabc",
      isAuthenticated: true,
      hasValidWalletAuth: true,
      isConnected: true,
      connectedAccounts: options.connectedAccounts ?? [],
      connectedAccountUnreadNotifications: {},
      canAddConnectedAccount: false,
      seizeConnect: jest.fn(),
      seizeConnectFresh: jest.fn().mockResolvedValue(undefined),
      seizeAddConnectedAccount: jest.fn(),
      seizeDisconnect: jest.fn().mockResolvedValue(undefined),
      seizeDisconnectAndLogout: jest.fn().mockResolvedValue(undefined),
      seizeDisconnectAndLogoutAll: jest.fn().mockResolvedValue(undefined),
      seizeSwitchConnectedAccount:
        options.seizeSwitchConnectedAccount ?? jest.fn(),
    })
  );
  mockUseChainSwitcher.mockReturnValue({
    chains: [mainnet],
    currentChainName: "Ethereum",
    nextChainName: "Polygon",
    switchToNextChain: jest.fn(() => false),
  });

  render(
    <AuthContext.Provider value={createAuthContext({ setToast })}>
      <WebSidebarUser
        isCollapsed={options.isCollapsed ?? false}
        profile={profileBase}
      />
    </AuthContext.Provider>
  );

  return { setToast };
}

function renderDropdown(options: RenderOptions) {
  const connectContext = createConnectContext({
    address: options.address,
    isAuthenticated: options.isAuthenticated ?? !!options.address,
    isConnected: options.isConnected ?? Boolean(options.address),
    connectedAccounts: options.connectedAccounts ?? [],
    canAddConnectedAccount: options.canAddConnectedAccount ?? false,
    seizeAddConnectedAccount: options.seizeAddConnectedAccount || jest.fn(),
    seizeConnect: options.seizeConnect || jest.fn(),
    seizeConnectFresh:
      options.seizeConnectFresh || jest.fn().mockResolvedValue(undefined),
    seizeDisconnect:
      options.seizeDisconnect || jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogout:
      options.seizeDisconnectAndLogout ||
      jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogoutAll:
      options.seizeDisconnectAndLogoutAll ||
      jest.fn().mockResolvedValue(undefined),
    seizeSwitchConnectedAccount:
      options.seizeSwitchConnectedAccount || jest.fn(),
  });
  mockConnect.mockReturnValue(connectContext);
  const authValue = createAuthContext({
    requestSessionUpgrade:
      options.requestSessionUpgrade ||
      jest.fn().mockResolvedValue({ success: true }),
    sessionUpgradeRequired: options.sessionUpgradeRequired ?? false,
    setToast: jest.fn(),
  });
  mockUseChainSwitcher.mockReturnValue({
    chains: (options.chains ?? []) as ReturnType<
      typeof useChainSwitcher
    >["chains"],
    currentChainName: options.currentChainName ?? "Ethereum",
    nextChainName: options.nextChainName ?? "Polygon",
    switchToNextChain: options.switchToNextChain || jest.fn(() => false),
  });
  const onClose = jest.fn();
  render(
    <AuthContext.Provider value={authValue}>
      <HeaderUserMenuDropdown
        isOpen
        profile={options.profile ?? profileBase}
        onClose={onClose}
        onOpenConnect={options.onOpenConnect}
      />
    </AuthContext.Provider>
  );
  return { onClose, ...authValue, ...connectContext };
}

afterEach(() => jest.clearAllMocks());

describe("HeaderUserMenuDropdown", () => {
  it("shows profile handle as label", () => {
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
    });
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("groups Profile immediately above Logout and closes the menu", () => {
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
    });

    const profileLink = screen.getByRole("link", { name: "Profile" });
    const logoutButton = screen.getByRole("button", { name: "Logout" });
    expect(profileLink).toHaveAttribute("href", "/alice");
    expect(profileLink).not.toHaveAttribute("title");
    expect(profileLink).toHaveClass("tw-grid-cols-[1.5rem_minmax(0,1fr)]");
    expect(logoutButton).toHaveClass("tw-grid-cols-[1.5rem_minmax(0,1fr)]");
    expect(profileLink.parentElement).toBe(logoutButton.parentElement);
    expect(
      profileLink.compareDocumentPosition(logoutButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(profileLink);
    expect(onClose).toHaveBeenCalled();
  });

  it("uses a full-width divider between Connect Wallet and Connect Device", () => {
    const onOpenConnect = jest.fn();
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      onOpenConnect,
    });

    const connectWalletButton = screen.getByRole("button", {
      name: "Connect",
    });
    const connectDeviceButton = screen.getByRole("button", {
      name: "Connect Device",
    });
    expect(connectDeviceButton.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "1 2 20 20"
    );
    expect(connectDeviceButton.querySelector("path")).toHaveAttribute(
      "d",
      "M16.9 8.5V6.5a1.8 1.8 0 0 0-1.8-1.8H4.2a1.8 1.8 0 0 0-1.8 1.8v6.4a1.8 1.8 0 0 0 1.8 1.8h7.1"
    );
    expect(connectDeviceButton).not.toHaveAttribute("title");
    expect(connectWalletButton).toHaveClass(
      "tw-grid-cols-[1.5rem_minmax(0,1fr)]"
    );
    expect(connectDeviceButton).toHaveClass(
      "tw-grid-cols-[1.5rem_minmax(0,1fr)]"
    );
    expect(connectWalletButton.parentElement).toBe(
      connectDeviceButton.parentElement
    );
    expect(connectWalletButton.closest("ul")).toHaveClass("tw-divide-y-2");
    const connectionActionsDivider = screen.getByTestId(
      "connection-actions-divider"
    );
    expect(connectionActionsDivider).toHaveClass(
      "-tw-mx-2",
      "tw-border-t",
      "tw-border-iron-700"
    );
    expect(
      connectWalletButton.compareDocumentPosition(connectionActionsDivider) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      connectionActionsDivider.compareDocumentPosition(connectDeviceButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(connectDeviceButton);
    expect(onOpenConnect).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  it("opens the connect modal through the desktop account menu", () => {
    mockConnect.mockReturnValue(
      createConnectContext({
        address: "0xabc",
        isAuthenticated: true,
        hasValidWalletAuth: true,
        isConnected: true,
        connectedAccounts: [],
        connectedAccountUnreadNotifications: {},
        canAddConnectedAccount: false,
        seizeConnect: jest.fn(),
        seizeConnectFresh: jest.fn().mockResolvedValue(undefined),
        seizeAddConnectedAccount: jest.fn(),
        seizeDisconnect: jest.fn().mockResolvedValue(undefined),
        seizeDisconnectAndLogout: jest.fn().mockResolvedValue(undefined),
        seizeDisconnectAndLogoutAll: jest.fn().mockResolvedValue(undefined),
        seizeSwitchConnectedAccount: jest.fn(),
      })
    );
    mockUseChainSwitcher.mockReturnValue({
      chains: [mainnet],
      currentChainName: "Ethereum",
      nextChainName: "Polygon",
      switchToNextChain: jest.fn(() => false),
    });

    render(
      <AuthContext.Provider value={createAuthContext()}>
        <WebSidebarUser isCollapsed={false} profile={profileBase} />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: /account.*menu/i }));
    fireEvent.click(screen.getByRole("button", { name: "Connect Device" }));

    expect(
      screen.getByRole("dialog", { name: "Connect Device modal" })
    ).toBeInTheDocument();
  });

  it("switches to the next profile on a desktop sidebar double-click", () => {
    jest.useFakeTimers();
    const seizeSwitchConnectedAccount = jest.fn();
    renderWebSidebar({
      connectedAccounts: [
        connectedAccount("0xabc", true),
        connectedAccount("0xdef", false),
      ],
      seizeSwitchConnectedAccount,
    });

    const profileButton = screen.getByRole("button", {
      name: /double-click to switch profiles/i,
    });
    fireEvent.click(profileButton);
    expect(profileButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(profileButton);

    expect(seizeSwitchConnectedAccount).toHaveBeenCalledWith("0xdef");
    expect(profileButton).toHaveAttribute("aria-expanded", "false");
    jest.useRealTimers();
  });

  it("opens the desktop account menu immediately and retains the shared click window", () => {
    jest.useFakeTimers();
    renderWebSidebar({
      connectedAccounts: [
        connectedAccount("0xabc", true),
        connectedAccount("0xdef", false),
      ],
    });

    const profileButton = screen.getByRole("button", {
      name: /double-click to switch profiles/i,
    });
    fireEvent.click(profileButton);

    expect(profileButton).toHaveAttribute("aria-expanded", "true");
    act(() => {
      jest.advanceTimersByTime(PROFILE_DOUBLE_ACTIVATE_DELAY_MS);
    });

    expect(PROFILE_DOUBLE_ACTIVATE_DELAY_MS).toBe(400);
    expect(profileButton).toHaveAttribute("aria-expanded", "true");
    jest.useRealTimers();
  });

  it("opens immediately without profile switching when only one profile is connected", () => {
    const seizeSwitchConnectedAccount = jest.fn();
    renderWebSidebar({
      connectedAccounts: [connectedAccount("0xabc", true)],
      seizeSwitchConnectedAccount,
    });

    const profileButton = screen.getByRole("button", {
      name: "Open account and profiles menu",
    });
    fireEvent.click(profileButton);

    expect(profileButton).toHaveAttribute("aria-expanded", "true");
    expect(seizeSwitchConnectedAccount).not.toHaveBeenCalled();
  });

  it("connects wallet when not connected", async () => {
    const seizeConnectFresh = jest.fn().mockResolvedValue(undefined);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      seizeConnectFresh,
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() => {
      expect(seizeConnectFresh).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("disconnects wallet when connected", async () => {
    const seizeDisconnect = jest.fn().mockResolvedValue(undefined);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      seizeDisconnect,
    });
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    await waitFor(() => {
      expect(seizeDisconnect).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("starts authentication upgrade when legacy session action is shown", async () => {
    const requestSessionUpgrade = jest.fn().mockResolvedValue({
      success: false,
    });
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      requestSessionUpgrade,
      sessionUpgradeRequired: true,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Upgrade Authentication" })
    );

    await waitFor(() => {
      expect(requestSessionUpgrade).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("keeps manual authentication upgrade available while wallet is disconnected", () => {
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      sessionUpgradeRequired: true,
    });

    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade Authentication" })
    ).toBeInTheDocument();
  });

  it("shows switch chain control when wallet is connected and multiple chains exist", () => {
    const switchToNextChain = jest.fn(() => true);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      chains: [
        { id: 1, name: "Ethereum" },
        { id: 137, name: "Polygon" },
      ],
      currentChainName: "Ethereum",
      nextChainName: "Polygon",
      switchToNextChain,
    });

    expect(screen.getByText("Network: Ethereum")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch Chain" }));

    expect(switchToNextChain).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("falls back to wallet display when no handle", () => {
    const profile = { ...profileBase, handle: null };
    renderDropdown({ profile, address: "0xabc", isConnected: true });
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows add account action when at least one connected account is present", async () => {
    const seizeAddConnectedAccount = jest.fn();
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [connectedAccount("0xabc", true)],
      canAddConnectedAccount: true,
      seizeAddConnectedAccount,
    });

    expect(screen.getByTestId("connected-accounts")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add profile" }));
    await waitFor(() => {
      expect(seizeAddConnectedAccount).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("moves multi-profile sign out all to the profiles header", async () => {
    const seizeDisconnectAndLogoutAll = jest.fn().mockResolvedValue(undefined);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        connectedAccount("0xabc", true),
        connectedAccount("0xdef", false),
      ],
      seizeDisconnectAndLogoutAll,
    });

    expect(
      screen.queryByRole("button", { name: "Sign Out All Profiles" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out all" }));

    await waitFor(() => {
      expect(seizeDisconnectAndLogoutAll).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("keeps Logout available for multiple profiles", async () => {
    const seizeDisconnectAndLogout = jest.fn().mockResolvedValue(undefined);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        connectedAccount("0xabc", true),
        connectedAccount("0xdef", false),
      ],
      seizeDisconnectAndLogout,
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(seizeDisconnectAndLogout).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows an error toast when switching account fails", async () => {
    const seizeSwitchConnectedAccount = jest.fn().mockImplementation(() => {
      throw new Error("Switch failed");
    });

    const { setToast, onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        connectedAccount("0xabc", true),
        connectedAccount("0xdef", false),
      ],
      seizeSwitchConnectedAccount,
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    await waitFor(() => {
      expect(seizeSwitchConnectedAccount).toHaveBeenCalledWith("0xdef");
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
