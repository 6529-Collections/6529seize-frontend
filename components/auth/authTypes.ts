import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

export type AuthContextType = {
  readonly connectedProfile: ApiIdentity | null;
  readonly isAuthenticated?: boolean;
  readonly fetchingProfile: boolean;
  readonly connectionStatus: ProfileConnectedStatus;
  readonly receivedProfileProxies: ApiProfileProxy[];
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly showWaves: boolean;
  readonly sessionUpgradeRequired: boolean;
  readonly requestAuth: (
    options?: RequestAuthOptions
  ) => Promise<{ success: boolean }>;
  readonly requestSessionUpgrade?: () => Promise<{ success: boolean }>;
  readonly ensureActiveSessionV2WebSession?: (params?: {
    readonly address?: string | undefined;
    readonly abortSignal?: AbortSignal | undefined;
  }) => Promise<boolean>;
  readonly setToast: (toast: AppToastInput) => void;
  readonly setActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => Promise<void>;
};

export interface RequestAuthOptions {
  /** Revalidate with the server even when the local JWT has not expired. */
  readonly serverRejected?: boolean;
  /** Cancel recovery if the account or token changes before it can finish. */
  readonly expectedAuthStateFingerprint?: string;
}

export type AuthLoadingState = "idle" | "validating" | "signing";
export type SignModalReason = "auth" | "session-upgrade";
export type SessionUpgradePromptMode = "sign" | "reshare";

export type MutableCurrentRef<T> = {
  current: T;
};

export interface SessionUpgradeReminderState {
  readonly dismissedUntil: number;
}

export interface SessionUpgradePromptStatus {
  readonly shouldShow: boolean;
  readonly canDismiss: boolean;
  readonly timeLeftMs: number;
}

export interface AuthRolloutSettings {
  readonly structuredSignaturesRequired: boolean;
  readonly sessionV2MigrationDeadline: string | null;
}

export interface AuthorizedWalletValidationResult {
  readonly isValid: boolean;
  readonly wasCancelled?: boolean;
  readonly requiresSessionUpgrade?: boolean;
}

export interface RunImmediateAuthValidationParams {
  readonly currentAddress: string;
  readonly operationId: string;
  readonly latestAddressRef: MutableCurrentRef<string | undefined>;
  readonly activeValidationOperationIdRef: MutableCurrentRef<string | null>;
  readonly abortControllerRef: MutableCurrentRef<AbortController | null>;
  readonly terminalAuthTransitionScopeRef: MutableCurrentRef<string | null>;
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly hasActiveWalletAddress: boolean;
  readonly canSignActiveWallet: boolean;
  readonly setAuthLoadingState: (state: AuthLoadingState) => void;
  readonly setSignModalReason: (reason: SignModalReason) => void;
  readonly setSessionUpgradePromptMode: (
    mode: SessionUpgradePromptMode
  ) => void;
  readonly setSessionUpgradeTimeLeftMs: (timeLeftMs: number) => void;
  readonly setSessionUpgradeCanDismiss: (canDismiss: boolean) => void;
  readonly setSessionUpgradeHasDeadline: (hasDeadline: boolean) => void;
  readonly setSessionUpgradeRequired: (required: boolean) => void;
  readonly setShowSignModal: (show: boolean) => void;
  readonly invalidateAll: () => void;
  readonly reset: () => void;
  readonly resetSessionUpgradeExpiryDedupe: (walletAddress: string) => void;
  readonly authRolloutSettings: AuthRolloutSettings;
}
