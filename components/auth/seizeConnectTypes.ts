export type WalletState =
  | { status: "initializing" }
  | { status: "error"; error: Error }
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string };

export interface SeizeConnectContextType {
  /** Current connected wallet address, undefined if not connected */
  address: string | undefined;

  /** Name of the connected wallet (e.g. "MetaMask", "Trust Wallet") */
  walletName: string | undefined;

  /** Icon URL of the connected wallet */
  walletIcon: string | undefined;

  /** Whether the connected wallet is a Safe (Gnosis Safe) wallet */
  isSafeWallet: boolean;

  /** Opens the wallet connection modal once AppKit is ready */
  seizeConnect: () => void;

  /**
   * Disconnects any live provider wallet before opening the connection modal.
   * Use this for user-facing "Connect Wallet" actions that should connect a
   * different authenticated profile.
   */
  seizeConnectFresh: () => Promise<void>;

  /**
   * Disconnects the current wallet connection
   * @throws {WalletDisconnectionError} When disconnection fails
   */
  seizeDisconnect: () => Promise<void>;

  /**
   * Disconnects wallet and clears authentication state
   * @throws {WalletDisconnectionError} When disconnection fails
   * @throws {AuthenticationError} When auth cleanup fails
   */
  seizeDisconnectAndLogout: () => Promise<void>;

  /**
   * Disconnects wallet and clears all authenticated profiles
   * @throws {WalletDisconnectionError} When disconnection fails
   * @throws {AuthenticationError} When auth cleanup fails
   */
  seizeDisconnectAndLogoutAll: () => Promise<void>;

  /**
   * Manually set the connected address (for internal use)
   * @param address - The wallet address to set as connected
   */
  seizeAcceptConnection: (address: string) => void;

  /** Whether the connection modal is currently open */
  seizeConnectOpen: boolean;

  /** Whether a wallet is currently connected to the app */
  isConnected: boolean;

  /** Whether the active wallet has a live signer connection */
  canSignActiveWallet: boolean;

  /** Whether there is an active wallet address, regardless of auth validity */
  hasActiveWalletAddress: boolean;

  /** Whether the active wallet address has valid auth state */
  hasValidWalletAuth: boolean;

  /** @deprecated Use hasActiveWalletAddress or hasValidWalletAuth. */
  isAuthenticated: boolean;

  /** Current connection state for better timing control */
  connectionState:
    | "initializing"
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";

  /** Unified wallet state machine for advanced consumers */
  walletState: WalletState;

  /** Whether there was an initialization error */
  hasInitializationError: boolean;

  /** The initialization error if one occurred */
  initializationError: Error | undefined;

  /** All authenticated wallet accounts available for switching */
  connectedAccounts: readonly {
    readonly address: string;
    readonly role: string | null;
    readonly profileId: string | null;
    readonly profileHandle: string | null;
    readonly isActive: boolean;
    readonly isConnected: boolean;
  }[];

  /** Switches the active authenticated account */
  seizeSwitchConnectedAccount: (address: string) => void;

  /** Opens wallet flow to add another authorized account */
  seizeAddConnectedAccount: () => void;

  /** Whether another account can be added */
  canAddConnectedAccount: boolean;

  /** Unread notification counts keyed by connected account address (lowercased) */
  connectedAccountUnreadNotifications: Readonly<Record<string, number>>;
}
