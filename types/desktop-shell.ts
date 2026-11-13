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

export type DesktopSessionClientType = "native" | "desktop";

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

export interface DesktopNotificationNavigatePayload
  extends DesktopNotificationNavigationContext {
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
interface DesktopNativeAuthFailure {
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
  readonly downloadUpdate: () => void;
  readonly installUpdate: () => void;
  readonly onUpdateAvailable: (callback: DesktopShellListener<[DesktopUpdateInfo?]>) => void;
  readonly offUpdateAvailable: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
  readonly onUpdateNotAvailable: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly offUpdateNotAvailable: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly onUpdateError: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly offUpdateError: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly onUpdateProgress: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly offUpdateProgress: (callback: DesktopShellListener<[unknown?]>) => void;
  readonly onUpdateDownloaded: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
  readonly offUpdateDownloaded: (
    callback: DesktopShellListener<[DesktopUpdateInfo?]>
  ) => void;
}

/** Small key-value store owned by the shell. */
export interface DesktopStore {
  readonly get: (key: string) => Promise<unknown>;
  readonly set: (key: string, value: unknown) => Promise<void>;
  readonly remove: (key: string) => Promise<void>;
}
