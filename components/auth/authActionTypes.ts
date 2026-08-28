import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type {
  AuthLoadingState,
  AuthRolloutSettings,
  RequestAuthOptions,
  SessionUpgradePromptStatus,
  SignModalReason,
} from "./authTypes";

export type SignMessage = (message: string) => Promise<{
  readonly signature: string | null;
  readonly userRejected: boolean;
  readonly error?: unknown;
}>;

export interface CreateAuthRequestActionsParams {
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly address: string | undefined;
  readonly authRolloutSettings: AuthRolloutSettings;
  readonly canSignActiveWallet: boolean;
  readonly enableWalletAuthentication: boolean;
  readonly expireSessionUpgradeAuth: (walletAddress: string) => Promise<void>;
  readonly invalidateAll: () => void;
  readonly isActiveChainSupported: () => boolean;
  readonly isAddressAuthorized: boolean;
  readonly seizeDisconnect: () => Promise<void>;
  readonly resetSessionUpgradeExpiryDedupe: (walletAddress: string) => void;
  readonly setActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => void;
  readonly setAuthLoadingState: (state: AuthLoadingState) => void;
  readonly setSessionUpgradeRequired: (required: boolean) => void;
  readonly setShowSignModal: (show: boolean) => void;
  readonly setSignModalReason: (reason: SignModalReason) => void;
  readonly setToast: (toast: AppToastInput) => void;
  readonly showSessionUpgradePrompt: (
    walletAddress: string,
    options?: {
      readonly forceShow?: boolean;
      readonly allowWithoutDeadline?: boolean;
    }
  ) => SessionUpgradePromptStatus;
  readonly signMessage: SignMessage;
  readonly signModalReason: SignModalReason;
}

export interface AuthRequestActions {
  readonly onActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => Promise<void>;
  readonly requestAuth: (
    options?: RequestAuthOptions
  ) => Promise<{ success: boolean }>;
  readonly requestSessionUpgrade: () => Promise<{ success: boolean }>;
}
