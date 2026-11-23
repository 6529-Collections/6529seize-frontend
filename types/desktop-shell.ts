/**
 * Type-only contract for the 6529 Desktop bridge: the objects the desktop
 * shell defines on `window` before page scripts run.
 *
 * The member names match the existing desktop preload so that one website
 * build works in every desktop host. The contract deliberately omits the
 * desktop app's local features (seed wallets, local database, workers, logs,
 * IPFS node, validator): the web UI never calls them, and seed wallets must
 * never expose key material to the page.
 *
 * Read these objects only through `helpers/desktop-shell.ts`.
 */

import type { RefreshTokenSessionClientType } from "@/services/auth/session-v2.types";

/** Same union the session layer uses for refresh-token sessions. */
export type DesktopSessionClientType = RefreshTokenSessionClientType;

/**
 * Shell event listeners receive the host's event object first, then the
 * payload, matching the existing desktop preload.
 */
export type DesktopShellListener<TArgs extends readonly unknown[] = []> = (
  event: unknown,
  ...args: TArgs
) => void;

interface DesktopNotificationNavigationContext {
  readonly targetAddress?: string | null | undefined;
  readonly targetProfileId?: string | null | undefined;
  readonly targetProfileHandle?: string | null | undefined;
}

export interface DesktopNotificationNavigatePayload extends DesktopNotificationNavigationContext {
  readonly path: string;
}

export interface DesktopNavigationState {
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

export interface DesktopShellInfo {
  readonly port?: number | undefined;
  readonly scheme?: string | undefined;
  readonly environment?: string | undefined;
  /** True in a shell that defines `window.desktopWallet`. */
  readonly supportsWalletForwarding?: boolean | undefined;
  /**
   * False in a shell that never downloads or installs updates itself (the
   * new 6529 Desktop); absent in the older app, which does.
   */
  readonly supportsInAppUpdates?: boolean | undefined;
  readonly [key: string]: unknown;
}

/** Shell services: navigation, external links and deep links. */
export interface DesktopShellApi {
  readonly openExternal: (url: string) => void;
  readonly openExternalChrome?: ((url: string) => void) | undefined;
  readonly openExternalFirefox?: ((url: string) => void) | undefined;
  readonly openExternalBrave?: ((url: string) => void) | undefined;
  readonly goBack: () => void;
  readonly goForward: () => void;
  readonly getNavigationState: () => Promise<DesktopNavigationState>;
  readonly onNavigationStateChange: (
    callback: DesktopShellListener<[DesktopNavigationState?]>
  ) => void;
  readonly offNavigationStateChange: (
    callback: DesktopShellListener<[DesktopNavigationState?]>
  ) => void;
  readonly onNavigate: (callback: DesktopShellListener<[string]>) => void;
  readonly offNavigate: (callback: DesktopShellListener<[string]>) => void;
  /** Tells the shell to deliver deep links it queued before the page loaded. */
  readonly navigationReady: () => Promise<void>;
  readonly onNotificationNavigate: (
    callback: DesktopShellListener<[DesktopNotificationNavigatePayload]>
  ) => void;
  readonly offNotificationNavigate: (
    callback: DesktopShellListener<[DesktopNotificationNavigatePayload]>
  ) => void;
  readonly onOpenSearch: (callback: DesktopShellListener) => void;
  readonly offOpenSearch: (callback: DesktopShellListener) => void;
  /** Absent in the Electron app, which never removes this listener. */
  readonly offWalletConnection?:
    | ((callback: DesktopShellListener<[unknown]>) => void)
    | undefined;
  readonly onWalletConnection: (
    callback: DesktopShellListener<[unknown]>
  ) => void;
  readonly getInfo: () => Promise<DesktopShellInfo>;
}

/** Desktop session responses never carry the refresh token into the page. */
export interface DesktopNativeAuthSessionResponse {
  readonly encrypted_device_setup?: string | null | undefined;
  readonly client_type: DesktopSessionClientType;
  readonly address: string;
  readonly role: string | null;
  readonly access_token: string;
  readonly access_token_expires_at: string;
  readonly native_refresh_token: "";
  readonly refresh_token_expires_at: string;
}

export interface DesktopNativeConnectionShareResponse {
  readonly connection_share_code: string;
  readonly expires_at: string;
  readonly address: string;
  readonly role: string | null;
  readonly target_client_type: DesktopSessionClientType;
  readonly deep_link_path: string;
}

export interface DesktopNativeLegacyConnectionShareResponse {
  readonly refresh_token: string;
  readonly address: string;
  readonly role: string | null;
  readonly deep_link_path: string;
}

/** API failures cross the bridge as plain data, then become errors again. */
export interface DesktopNativeAuthFailure {
  readonly kind: "native-auth-api-error";
  readonly status: number;
  readonly message: string;
  readonly retryAfter?: string | undefined;
}

export type DesktopNativeAuthResult<T> = T | DesktopNativeAuthFailure;

interface DesktopProfile {
  readonly address: string;
  readonly role: string | null;
  readonly jwt: string | null;
  readonly profileId: string | null;
  readonly profileHandle: string | null;
  readonly authSessionVersion: "v2" | null;
  /** Refresh credentials stay in the shell and never enter this snapshot. */
  readonly refreshToken: null;
}

export interface DesktopProfileState {
  readonly version: 1;
  readonly accounts: readonly DesktopProfile[];
  readonly activeAddress: string | null;
}

/**
 * Sign-in runs in the shell: it calls the API itself, keeps the refresh token
 * in OS-protected storage and returns only the access token to the page.
 */
export interface DesktopNativeAuth {
  readonly isAvailable: () => Promise<boolean>;
  readonly profilesReady: () => Promise<void>;
  readonly restartProfileRestore: () => Promise<void>;
  readonly restoreProfiles: (
    current: DesktopProfileState
  ) => Promise<DesktopProfileState>;
  readonly saveProfiles: (state: DesktopProfileState) => Promise<void>;
  readonly removeRefreshToken: (request: {
    readonly client_type?: DesktopSessionClientType | undefined;
    readonly client_address: string;
  }) => Promise<void>;
  readonly sessionLogin: (request: {
    readonly client_type?: DesktopSessionClientType | undefined;
    readonly server_signature: string;
    readonly client_signature: string;
    readonly client_address: string;
    readonly role?: string | null | undefined;
  }) => Promise<DesktopNativeAuthSessionResponse>;
  /**
   * The only method that reports API failures as data. The others reject with
   * an Error; the page validates every result either way.
   */
  readonly sessionRefresh: (request: {
    readonly client_type?: DesktopSessionClientType | undefined;
    readonly client_address: string;
  }) => Promise<DesktopNativeAuthResult<DesktopNativeAuthSessionResponse>>;
  readonly createConnectionShare: (request: {
    readonly encrypted_device_setup?: string | undefined;
    readonly access_token?: string | null | undefined;
    readonly target_client_type?: DesktopSessionClientType | undefined;
    readonly client_type?: DesktopSessionClientType | undefined;
    readonly client_address?: string | undefined;
  }) => Promise<DesktopNativeConnectionShareResponse>;
  readonly createLegacyDesktopConnectionShare: (request: {
    readonly access_token?: string | null | undefined;
    readonly client_type?: DesktopSessionClientType | undefined;
    readonly client_address?: string | undefined;
  }) => Promise<DesktopNativeLegacyConnectionShareResponse>;
  readonly redeemConnectionShare: (request: {
    readonly access_token?: string | null | undefined;
    readonly connection_share_code: string;
    readonly target_client_type?: DesktopSessionClientType | undefined;
  }) => Promise<DesktopNativeAuthSessionResponse>;
  readonly sessionLogout: (request: {
    readonly access_token?: string | null | undefined;
    readonly client_type?: DesktopSessionClientType | undefined;
    readonly client_address: string;
    readonly all_sessions: boolean;
  }) => Promise<void>;
}

/** Positional arguments, in the order the existing desktop shell expects. */
export type DesktopShowNotificationArgs = [
  id: number,
  pfp: string,
  title: string,
  body: string,
  redirectPath: string,
  navigationContext?: DesktopNotificationNavigationContext,
];

export interface DesktopNotifications {
  readonly showNotification: (...args: DesktopShowNotificationArgs) => void;
  readonly setBadge: (count: number) => void;
}

export interface DesktopUpdateInfo {
  readonly version?: string | undefined;
  readonly [key: string]: unknown;
}

export interface DesktopUpdater {
  readonly checkUpdates: () => void;
  /** The Tauri host returns its IPC promise; the older app returns nothing. */
  readonly downloadUpdate: () => Promise<void> | undefined;
  /** The auto-installing host returns a promise that rejects when it can't. */
  readonly installUpdate: () => Promise<void> | void;
  readonly onUpdateAvailable: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
  readonly offUpdateAvailable: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
  readonly onUpdateNotAvailable: (
    callback: DesktopShellListener<[unknown?]>
  ) => void;
  readonly offUpdateNotAvailable: (
    callback: DesktopShellListener<[unknown?]>
  ) => void;
  readonly onUpdateError: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly offUpdateError: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly onUpdateProgress: (
    callback: DesktopShellListener<[unknown?]>
  ) => void;
  readonly offUpdateProgress: (
    callback: DesktopShellListener<[unknown?]>
  ) => void;
  readonly onUpdateDownloaded: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
  readonly offUpdateDownloaded: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
  /**
   * Auto-installing 6529 Desktop builds only (`getInfo()` reports
   * `supportsInAppUpdates: true`): the update state (U1-U14), its change
   * event and the two settings. Absent in older builds.
   */
  readonly getState?: (() => Promise<unknown>) | undefined;
  readonly onUpdateState?:
    | ((callback: DesktopShellListener<[unknown?]>) => void)
    | undefined;
  readonly offUpdateState?:
    | ((callback: DesktopShellListener<[unknown?]>) => void)
    | undefined;
  /**
   * Work in this window would be lost by a restart: "Restart to update" is
   * refused with `reason` until it is cleared. Auto-installing builds only.
   */
  readonly setBusy?:
    | ((busy: boolean, reason?: string) => Promise<void>)
    | undefined;
  readonly setSettings?:
    | ((settings: {
        readonly check?: boolean;
        readonly auto?: boolean;
      }) => Promise<unknown>)
    | undefined;
}

/** Small key-value store owned by the shell. */
export interface DesktopStore {
  readonly get: (key: string) => Promise<unknown>;
  readonly set: (key: string, value: unknown) => Promise<void>;
  readonly remove: (key: string) => Promise<void>;
}

/**
 * Wallet forwarding (`window.desktopWallet`): the shell opens a signature
 * request in the system browser for a profile that signed in with a
 * browser wallet. The shell keeps the request id; the page sees only the
 * short request code and the answer. Advertised by
 * `getInfo().supportsWalletForwarding === true`; absent in older builds.
 * Answers are validated with the parsers in `lib/desktop/wallet-forwarding`.
 */
export interface DesktopWallet {
  /** Opens one request in the browser and resolves with its answer. */
  readonly request: (request: {
    readonly method: string;
    readonly params: unknown;
    readonly address: string;
    readonly chainId: number;
  }) => Promise<unknown>;
  /** Cancels the open request (it then answers `cancelled`). */
  readonly cancel: () => Promise<void>;
  /** Opens the open request's browser page again (rate-limited). */
  readonly reopen: () => Promise<void>;
  /** `{ pending: false }` or `{ pending: true, code, method, expiresAt }`. */
  readonly status: () => Promise<unknown>;
  /** `{ version, methods, context?, transactionRules? }`: what it forwards. */
  readonly capabilities: () => Promise<unknown>;
  /** Calls back with the status when a request starts or ends. */
  readonly onStatusChange: (callback: (status: unknown) => void) => () => void;
  /**
   * Calls back when a transaction approved after its request ended was
   * sent (`{ ok, value | transactionHash, chainId }`). Optional: builds
   * without transaction forwarding do not define it.
   */
  readonly onLateTransaction?: (
    callback: (event: unknown) => void
  ) => () => void;
}
