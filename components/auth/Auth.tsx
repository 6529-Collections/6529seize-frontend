"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Modal } from "react-bootstrap";
import { isAddress } from "viem";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import {
  AppToastContainer,
  showAppToast,
} from "@/components/utils/toast/AppToast";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import {
  InvalidRoleStateError,
  MissingActiveProfileError,
} from "@/errors/authentication";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import type { ApiWave } from "@/generated/models/ApiWave";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { groupProfileProxies } from "@/helpers/profile-proxy.helpers";
import { getProfileConnectedStatus } from "@/helpers/ProfileHelpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ConnectionMismatchError,
  MobileSigningError,
  SigningProviderError,
  useSecureSign,
} from "@/hooks/useSecureSign";
import { commonApiFetch } from "@/services/api/common-api";
import { AUTH_SIGNATURE_FAILED_MESSAGE } from "@/services/auth/auth.messages";
import {
  canStoreAnotherWalletAccount,
  getAuthJwt,
  getWalletAddress,
  PROFILE_SWITCHED_EVENT,
  removeAuthJwt,
  setActiveWalletAccount,
  syncConnectedWalletProfile,
} from "@/services/auth/auth.utils";
import { validateAuthImmediate } from "@/services/auth/immediate-validation.utils";
import { getRole, validateJwt } from "@/services/auth/jwt-validation.utils";
import {
  getSessionClientType,
  getSessionNonce,
  loginWithSessionV2,
  persistSessionResponse,
} from "@/services/auth/session-v2.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import { measureMobileLaunchAsync } from "@/utils/monitoring/mobileLaunchTiming";
import { validateRoleForAuthentication } from "@/utils/role-validation";
import DotLoader from "../dotLoader/DotLoader";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import styles from "./Auth.module.scss";
import { useSeizeConnectContext } from "./SeizeConnectContext";

// Custom error classes for authentication failures
class AuthenticationNonceError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown
  ) {
    super(message);
    this.name = "AuthenticationNonceError";
  }
}

class InvalidSignerAddressError extends Error {
  constructor(signerAddress: string) {
    super(`Invalid signer address: ${signerAddress}`);
    this.name = "InvalidSignerAddressError";
  }
}

class NonceResponseValidationError extends Error {
  constructor(
    message: string,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = "NonceResponseValidationError";
  }
}

type AuthContextType = {
  readonly connectedProfile: ApiIdentity | null;
  readonly isAuthenticated?: boolean;
  readonly fetchingProfile: boolean;
  readonly connectionStatus: ProfileConnectedStatus;
  readonly receivedProfileProxies: ApiProfileProxy[];
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly showWaves: boolean;
  readonly sessionUpgradeRequired: boolean;
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly requestSessionUpgrade?: () => Promise<{ success: boolean }>;
  readonly setToast: (toast: AppToastInput) => void;
  readonly setActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => Promise<void>;
};

type AuthLoadingState = "idle" | "validating" | "signing";
type SignModalReason = "auth" | "session-upgrade";
type SessionUpgradePromptMode = "sign" | "reshare";
type MutableCurrentRef<T> = {
  current: T;
};

interface SessionUpgradeReminderState {
  readonly dismissedUntil: number;
}

interface SessionUpgradePromptStatus {
  readonly shouldShow: boolean;
  readonly canDismiss: boolean;
  readonly timeLeftMs: number;
}

interface AuthRolloutSettings {
  readonly structuredSignaturesRequired: boolean;
  readonly sessionV2MigrationDeadline: string | null;
}

interface AuthorizedWalletValidationResult {
  readonly isValid: boolean;
  readonly requiresSessionUpgrade?: boolean;
}

interface RunImmediateAuthValidationParams {
  readonly currentAddress: string;
  readonly operationId: string;
  readonly latestAddressRef: MutableCurrentRef<string | undefined>;
  readonly activeValidationOperationIdRef: MutableCurrentRef<string | null>;
  readonly abortControllerRef: MutableCurrentRef<AbortController | null>;
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
  readonly setSessionUpgradeRequired: (required: boolean) => void;
  readonly setShowSignModal: (show: boolean) => void;
  readonly invalidateAll: () => void;
  readonly reset: () => void;
  readonly authRolloutSettings: AuthRolloutSettings;
}

const SESSION_UPGRADE_REMINDER_STORAGE_KEY =
  "6529-session-v2-upgrade-reminders";
const AUTH_MODAL_LOCALE = DEFAULT_LOCALE;
const SESSION_UPGRADE_REMINDER_MS = 2 * 60 * 60 * 1000;
const DEFAULT_AUTH_ROLLOUT_SETTINGS: AuthRolloutSettings = {
  structuredSignaturesRequired: false,
  sessionV2MigrationDeadline: null,
};

const normalizeSessionV2MigrationDeadline = (
  deadline: Date | string | null | undefined
): string | null => {
  if (deadline instanceof Date) {
    return Number.isFinite(deadline.getTime()) ? deadline.toISOString() : null;
  }

  return deadline ?? null;
};

const normalizeReminderAddress = (address: string): string =>
  address.toLowerCase();

const normalizeWalletAddress = (walletAddress: string): string =>
  walletAddress.trim().toLowerCase();

const isProfileForAddress = ({
  profile,
  address,
}: {
  readonly profile: ApiIdentity | null;
  readonly address: string | null | undefined;
}): boolean => {
  if (!profile || !address) {
    return false;
  }

  const normalizedAddress = normalizeWalletAddress(address);
  const walletAddresses = [
    profile.primary_wallet,
    ...(profile.wallets?.map((wallet) => wallet.wallet) ?? []),
  ].filter(
    (walletAddress): walletAddress is string =>
      typeof walletAddress === "string" && walletAddress.trim().length > 0
  );

  if (walletAddresses.length === 0) {
    return true;
  }

  return walletAddresses.some(
    (walletAddress) =>
      normalizeWalletAddress(walletAddress) === normalizedAddress
  );
};

const isPublicWave = (wave: ApiWave): boolean => !wave.visibility?.scope?.group;

const parseSessionUpgradeReminders = (): Record<
  string,
  SessionUpgradeReminderState
> => {
  const raw = safeLocalStorage.getItem(SESSION_UPGRADE_REMINDER_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const reminders: Record<string, SessionUpgradeReminderState> = {};
    for (const [address, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") {
        continue;
      }

      const record = value as Partial<SessionUpgradeReminderState>;
      if (
        typeof record.dismissedUntil === "number" &&
        Number.isFinite(record.dismissedUntil)
      ) {
        reminders[address] = {
          dismissedUntil: record.dismissedUntil,
        };
      }
    }
    return reminders;
  } catch {
    return {};
  }
};

const writeSessionUpgradeReminders = (
  reminders: Readonly<Record<string, SessionUpgradeReminderState>>
): void => {
  safeLocalStorage.setItem(
    SESSION_UPGRADE_REMINDER_STORAGE_KEY,
    JSON.stringify(reminders)
  );
};

const getSessionUpgradeReminder = (
  address: string
): SessionUpgradeReminderState | null => {
  const reminders = parseSessionUpgradeReminders();
  return reminders[normalizeReminderAddress(address)] ?? null;
};

const hasSessionUpgradeRollout = (settings: AuthRolloutSettings): boolean => {
  return (
    settings.structuredSignaturesRequired ||
    !!settings.sessionV2MigrationDeadline?.trim()
  );
};

const getSessionUpgradeGlobalDeadline = (
  settings: AuthRolloutSettings
): number | null => {
  const configuredDeadline = settings.sessionV2MigrationDeadline;
  if (!configuredDeadline) {
    return null;
  }

  const timestamp = Date.parse(configuredDeadline);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getSessionUpgradeEffectiveDeadline = (
  settings: AuthRolloutSettings,
  now: number = Date.now()
): number | null => {
  if (settings.structuredSignaturesRequired) {
    return now;
  }

  return getSessionUpgradeGlobalDeadline(settings);
};

const setSessionUpgradeReminder = (
  address: string,
  state: SessionUpgradeReminderState
): void => {
  writeSessionUpgradeReminders({
    ...parseSessionUpgradeReminders(),
    [normalizeReminderAddress(address)]: state,
  });
};

const clearSessionUpgradeReminder = (address: string): void => {
  const reminders = parseSessionUpgradeReminders();
  delete reminders[normalizeReminderAddress(address)];
  writeSessionUpgradeReminders(reminders);
};

const getOrCreateSessionUpgradePromptStatus = (
  address: string,
  settings: AuthRolloutSettings,
  now: number = Date.now()
): SessionUpgradePromptStatus => {
  const existingReminder = getSessionUpgradeReminder(address);
  const reminder = existingReminder ?? {
    dismissedUntil: 0,
  };

  if (!existingReminder) {
    setSessionUpgradeReminder(address, reminder);
  }

  const deadline = getSessionUpgradeEffectiveDeadline(settings, now);
  const timeLeftMs = deadline === null ? 0 : Math.max(0, deadline - now);
  const canDismiss = timeLeftMs > 0;

  return {
    shouldShow: !canDismiss || now >= reminder.dismissedUntil,
    canDismiss,
    timeLeftMs,
  };
};

const dismissSessionUpgradePrompt = (
  address: string,
  settings: AuthRolloutSettings,
  now: number = Date.now()
): SessionUpgradePromptStatus => {
  const deadline = getSessionUpgradeEffectiveDeadline(settings, now);
  const timeLeftMs = deadline === null ? 0 : Math.max(0, deadline - now);
  const canDismiss = timeLeftMs > 0;
  const dismissedUntil = canDismiss
    ? Math.min(now + SESSION_UPGRADE_REMINDER_MS, deadline ?? now)
    : now;
  const nextReminder = {
    dismissedUntil,
  };

  setSessionUpgradeReminder(address, nextReminder);

  return {
    shouldShow: now >= dismissedUntil,
    canDismiss,
    timeLeftMs,
  };
};

const formatSessionUpgradeTimeLeft = (timeLeftMs: number): string => {
  if (timeLeftMs <= 0) {
    return t(AUTH_MODAL_LOCALE, "auth.signModal.timeLeft.now");
  }

  const oneHourMs = 60 * 60 * 1000;
  const oneDayMs = 24 * oneHourMs;
  const wholeDays = Math.floor(timeLeftMs / oneDayMs);

  if (wholeDays > 3) {
    return t(
      AUTH_MODAL_LOCALE,
      wholeDays === 1
        ? "auth.signModal.timeLeft.days.one"
        : "auth.signModal.timeLeft.days.many",
      { count: formatInteger(AUTH_MODAL_LOCALE, wholeDays) }
    );
  }

  const wholeHours = Math.floor(timeLeftMs / oneHourMs);
  if (wholeHours < 1) {
    return t(AUTH_MODAL_LOCALE, "auth.signModal.timeLeft.lessThanOneHour");
  }

  return t(
    AUTH_MODAL_LOCALE,
    wholeHours === 1
      ? "auth.signModal.timeLeft.hours.one"
      : "auth.signModal.timeLeft.hours.many",
    { count: formatInteger(AUTH_MODAL_LOCALE, wholeHours) }
  );
};

const getSessionUpgradePromptMode = (
  canSignActiveWallet: boolean
): SessionUpgradePromptMode => {
  if (canSignActiveWallet || getSessionClientType() === "web") {
    return "sign";
  }
  return "reshare";
};

const isCurrentValidationOperation = ({
  latestAddressRef,
  activeValidationOperationIdRef,
  currentAddress,
  operationId,
}: {
  readonly latestAddressRef: MutableCurrentRef<string | undefined>;
  readonly activeValidationOperationIdRef: MutableCurrentRef<string | null>;
  readonly currentAddress: string;
  readonly operationId: string;
}): boolean =>
  latestAddressRef.current === currentAddress &&
  activeValidationOperationIdRef.current === operationId;

const runImmediateAuthValidation = async ({
  currentAddress,
  operationId,
  latestAddressRef,
  activeValidationOperationIdRef,
  abortControllerRef,
  activeProfileProxy,
  hasActiveWalletAddress,
  canSignActiveWallet,
  setAuthLoadingState,
  setSignModalReason,
  setSessionUpgradePromptMode,
  setSessionUpgradeTimeLeftMs,
  setSessionUpgradeCanDismiss,
  setSessionUpgradeRequired,
  setShowSignModal,
  invalidateAll,
  reset,
  authRolloutSettings,
}: RunImmediateAuthValidationParams): Promise<void> => {
  if (
    isCurrentValidationOperation({
      latestAddressRef,
      activeValidationOperationIdRef,
      currentAddress,
      operationId,
    }) === false
  ) {
    return;
  }

  const abortController = new AbortController();
  abortControllerRef.current = abortController;
  setAuthLoadingState("validating");

  try {
    const result = await measureMobileLaunchAsync(
      "auth_immediate_validation",
      () =>
        validateAuthImmediate({
          params: {
            currentAddress,
            connectionAddress: currentAddress,
            jwt: getAuthJwt(),
            activeProfileProxy,
            isConnected: hasActiveWalletAddress,
            operationId,
            abortSignal: abortController.signal,
          },
          callbacks: {
            onShowSignModal: setShowSignModal,
            onSessionUpgradeRequired: () => {
              if (!hasSessionUpgradeRollout(authRolloutSettings)) {
                return;
              }

              setSessionUpgradeRequired(true);
              const status = getOrCreateSessionUpgradePromptStatus(
                currentAddress,
                authRolloutSettings
              );
              setSignModalReason("session-upgrade");
              setSessionUpgradePromptMode(
                getSessionUpgradePromptMode(canSignActiveWallet)
              );
              setSessionUpgradeTimeLeftMs(status.timeLeftMs);
              setSessionUpgradeCanDismiss(status.canDismiss);
              setShowSignModal(status.shouldShow);
            },
            onInvalidateCache: invalidateAll,
            onReset: reset,
            onRemoveJwt: () => removeAuthJwt(),
            onLogError: logErrorSecurely,
          },
        })
    );

    if (
      result.wasCancelled ||
      isCurrentValidationOperation({
        latestAddressRef,
        activeValidationOperationIdRef,
        currentAddress,
        operationId,
      }) === false
    ) {
      return;
    }
  } finally {
    if (
      abortControllerRef.current === abortController &&
      activeValidationOperationIdRef.current === operationId
    ) {
      abortControllerRef.current = null;
      activeValidationOperationIdRef.current = null;
      setAuthLoadingState("idle");
    }
  }
};

export const AuthContext = createContext<AuthContextType>({
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  showWaves: false,
  requestAuth: async () => ({ success: false }),
  sessionUpgradeRequired: false,
  requestSessionUpgrade: async () => ({ success: false }),
  setToast: () => {},
  setActiveProfileProxy: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export default function Auth({
  children,
  enableWalletAuthentication = true,
}: {
  readonly children: React.ReactNode;
  readonly enableWalletAuthentication?: boolean;
}) {
  const { invalidateAll, invalidateAuthSensitiveQueries } = useContext(
    ReactQueryWrapperContext
  );
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const seizeSettingsContext = useSeizeSettingsOptional();

  const {
    address,
    hasValidWalletAuth: isAddressAuthorized,
    isConnected,
    hasActiveWalletAddress,
    canSignActiveWallet,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    isSafeWallet,
    connectionState,
  } = useSeizeConnectContext();

  const {
    signMessage,
    isSigningPending,
    reset: resetSigning,
  } = useSecureSign({
    signatureType: isSafeWallet ? "contract" : "eoa",
  });
  const [showSignModal, setShowSignModal] = useState(false);
  const [signModalReason, setSignModalReason] =
    useState<SignModalReason>("auth");
  const [sessionUpgradePromptMode, setSessionUpgradePromptMode] =
    useState<SessionUpgradePromptMode>("sign");
  const [sessionUpgradeTimeLeftMs, setSessionUpgradeTimeLeftMs] = useState(0);
  const [sessionUpgradeCanDismiss, setSessionUpgradeCanDismiss] =
    useState(true);
  const [sessionUpgradeRequired, setSessionUpgradeRequired] = useState(false);
  const signModalReasonRef = useRef<SignModalReason>(signModalReason);

  const { profile: loadedProfile, isLoading: fetchingProfile } = useIdentity({
    handleOrWallet: address,
    initialProfile: null,
  });
  const isConnectedProfileForAddress = isProfileForAddress({
    profile: loadedProfile,
    address,
  });
  const connectedProfile = isConnectedProfileForAddress ? loadedProfile : null;
  const isConnectedProfileSettling = Boolean(
    address && loadedProfile && !isConnectedProfileForAddress
  );
  const isFetchingConnectedProfile =
    fetchingProfile || isConnectedProfileSettling;

  // Race condition prevention: AbortController and operation tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestAddressRef = useRef<string | undefined>(address);
  const activeValidationOperationIdRef = useRef<string | null>(null);
  const expiredSessionUpgradeAddressRef = useRef<string | null>(null);
  const [pendingProfileSwitch, setPendingProfileSwitch] = useState<{
    readonly targetAddress: string | null;
  } | null>(null);
  const [authLoadingState, setAuthLoadingState] =
    useState<AuthLoadingState>("idle");
  const settingsAuth = seizeSettingsContext?.seizeSettings.auth;
  const authRolloutSettings = useMemo<AuthRolloutSettings>(() => {
    if (!settingsAuth) {
      return DEFAULT_AUTH_ROLLOUT_SETTINGS;
    }

    return {
      structuredSignaturesRequired:
        settingsAuth.structured_signatures_required === true,
      sessionV2MigrationDeadline: normalizeSessionV2MigrationDeadline(
        settingsAuth.session_v2_migration_deadline
      ),
    };
  }, [settingsAuth]);

  // Centralized abort mechanism for cancelling in-flight operations
  const abortCurrentAuthOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeValidationOperationIdRef.current = null;
    setAuthLoadingState("idle");
  }, []);

  const { data: profileProxies } = useQuery<ApiProfileProxy[]>({
    queryKey: [
      QueryKey.PROFILE_PROFILE_PROXIES,
      { handleOrWallet: connectedProfile?.query },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileProxy[]>({
        endpoint: `profiles/${connectedProfile?.query}/proxies/`,
      }),
    enabled: !!connectedProfile?.query,
  });

  const receivedProfileProxies = useMemo(() => {
    return groupProfileProxies({
      profileProxies: profileProxies ?? [],
      onlyActive: true,
      profileId: connectedProfile?.id ?? null,
    }).received;
  }, [profileProxies, connectedProfile?.id]);

  const [activeProfileProxy, setActiveProfileProxy] =
    useState<ApiProfileProxy | null>(null);
  const authRole = (() => {
    try {
      const authJwt = getAuthJwt();
      return getRole(authJwt);
    } catch (error) {
      logErrorSecurely("derive_auth_role", error);
      return null;
    }
  })();

  useEffect(() => {
    if (!address) {
      setActiveProfileProxy(null);
      return;
    }

    if (!authRole) {
      setActiveProfileProxy(null);
      return;
    }

    const activeProxy = receivedProfileProxies?.find(
      (proxy) => proxy.created_by.id === authRole
    );

    setActiveProfileProxy(activeProxy ?? null);
  }, [address, authRole, receivedProfileProxies]);

  const reset = useCallback(() => {
    invalidateAll();
    setActiveProfileProxy(null);
    seizeDisconnectAndLogout();
  }, [invalidateAll, seizeDisconnectAndLogout]);

  // Comprehensive cleanup effect for unmount and address changes
  useEffect(() => {
    return () => {
      // Cancel any pending auth operations
      abortCurrentAuthOperation();
      // Reset signing state
      resetSigning();
    };
  }, [resetSigning, abortCurrentAuthOperation]);

  // Cleanup when address changes to prevent stale responses
  useEffect(() => {
    return () => {
      abortCurrentAuthOperation();
    };
  }, [address, abortCurrentAuthOperation]);

  useEffect(() => {
    latestAddressRef.current = address;
  }, [address]);

  useEffect(() => {
    signModalReasonRef.current = signModalReason;
  }, [signModalReason]);

  useEffect(() => {
    if (!address || !connectedProfile?.id) {
      return;
    }

    syncConnectedWalletProfile(
      address,
      connectedProfile.id,
      connectedProfile.handle ?? null
    );
  }, [address, connectedProfile?.id, connectedProfile?.handle]);

  // Immediate authentication effect with race condition prevention
  useEffect(() => {
    if (!enableWalletAuthentication) {
      abortCurrentAuthOperation();
      setShowSignModal(false);
      setAuthLoadingState("idle");
      setSessionUpgradeRequired(false);
      return;
    }

    // Clear previous operations when dependencies change
    abortCurrentAuthOperation();

    // Don't start validation during transitional states
    if (connectionState === "connecting") {
      return;
    }

    if (!address || connectionState !== "connected") {
      setShowSignModal(false);
      setSessionUpgradeRequired(false);
      return;
    }

    if (!isAddressAuthorized) {
      setSessionUpgradeRequired(false);
      if (isConnected) {
        setSignModalReason("auth");
        setShowSignModal(true);
      }
      return;
    }

    // Clear stale non-upgrade sign modal state when returning to an authorized
    // account. Keep an active session-upgrade prompt visible while validation
    // reruns, otherwise the prompt blinks during auth state rehydration.
    if (signModalReasonRef.current !== "session-upgrade") {
      setShowSignModal(false);
    }

    const activeStoredAddress = getWalletAddress();
    if (
      activeStoredAddress &&
      activeStoredAddress.toLowerCase() !== address.toLowerCase()
    ) {
      setActiveWalletAccount(address);
    }

    // Capture current address at validation time to prevent race conditions
    const currentAddress = address;
    setSessionUpgradeRequired(false);

    // Generate unique operation ID for this validation attempt
    const operationId = `auth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    activeValidationOperationIdRef.current = operationId;

    // IMMEDIATE validation - no setTimeout to prevent timing window vulnerability
    void runImmediateAuthValidation({
      currentAddress,
      operationId,
      latestAddressRef,
      activeValidationOperationIdRef,
      abortControllerRef,
      activeProfileProxy,
      hasActiveWalletAddress,
      canSignActiveWallet,
      setAuthLoadingState,
      setSignModalReason,
      setSessionUpgradePromptMode,
      setSessionUpgradeTimeLeftMs,
      setSessionUpgradeCanDismiss,
      setSessionUpgradeRequired,
      setShowSignModal,
      invalidateAll,
      reset,
      authRolloutSettings,
    }).catch((error) => {
      logErrorSecurely("auth_immediate_validation_unhandled", error);
    });

    // No cleanup needed - immediate execution prevents stale timeouts
  }, [
    address,
    activeProfileProxy,
    connectionState,
    enableWalletAuthentication,
    isAddressAuthorized,
    isConnected,
    hasActiveWalletAddress,
    canSignActiveWallet,
    abortCurrentAuthOperation,
    invalidateAll,
    reset,
    authRolloutSettings,
  ]);

  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<ApiSessionNonceResponse> => {
    // Input validation - fail fast on invalid input
    if (!signerAddress || typeof signerAddress !== "string") {
      throw new InvalidSignerAddressError(signerAddress);
    }

    // Use viem's comprehensive address validation
    // This includes EIP-55 checksum validation and format checking
    if (!isAddress(signerAddress)) {
      throw new InvalidSignerAddressError(signerAddress);
    }

    try {
      const response = await getSessionNonce({ signerAddress });

      // Response validation - fail fast on invalid response
      if (!response) {
        throw new NonceResponseValidationError(
          "Nonce API returned null or undefined response"
        );
      }

      if (
        !response.signable_message ||
        typeof response.signable_message !== "string" ||
        response.signable_message.length === 0
      ) {
        throw new NonceResponseValidationError(
          "Invalid signable_message in API response",
          response
        );
      }

      if (
        !response.server_signature ||
        typeof response.server_signature !== "string" ||
        response.server_signature.trim().length === 0
      ) {
        throw new NonceResponseValidationError(
          "Invalid server_signature in API response",
          response
        );
      }

      // Return valid response - FAIL-FAST: Only returns valid data or throws
      return response;
    } catch (error) {
      // Re-throw our custom errors without modification
      if (
        error instanceof NonceResponseValidationError ||
        error instanceof InvalidSignerAddressError
      ) {
        throw error;
      }

      // Wrap API/network errors in our custom error type
      throw new AuthenticationNonceError(
        "Failed to obtain authentication nonce from server",
        error
      );
    }
  };

  const setToast = (toast: AppToastInput) => {
    showAppToast(toast);
  };

  const getSignature = async ({
    message,
  }: {
    message: string;
  }): Promise<{
    signature: string | null;
    userRejected: boolean;
  }> => {
    try {
      const result = await signMessage(message);

      // Handle specific mobile signing errors
      if (result.error) {
        if (result.error instanceof ConnectionMismatchError) {
          setToast({
            message:
              "Wallet address mismatch. Disconnect and reconnect the correct wallet.",
            type: "error",
          });
        } else if (result.error instanceof SigningProviderError) {
          setToast({
            message:
              "Wallet provider error. Reconnect your wallet and try again.",
            type: "error",
          });
        } else if (result.error instanceof MobileSigningError) {
          // Show mobile-specific error messages
          setToast({
            type: "error",
            title: "Couldn't sign in with this wallet.",
            description: "Check your wallet and try again.",
            details: getToastErrorDetails(result.error),
          });
        }
      }

      return {
        signature: result.signature,
        userRejected: result.userRejected,
      };
    } catch (error) {
      // Fallback error handling with secure logging
      logErrorSecurely("getSignature", error);
      setToast({
        type: "error",
        title: "Couldn't sign in with this wallet.",
        description: "Check your wallet and try again.",
        details: getToastErrorDetails(error),
      });
      return {
        signature: null,
        userRejected: false,
      };
    }
  };

  const requestSignIn = async ({
    signerAddress,
    role,
  }: {
    readonly signerAddress: string;
    readonly role: string | null;
  }): Promise<{ success: boolean }> => {
    try {
      if (!canStoreAnotherWalletAccount(signerAddress)) {
        setToast({
          message: "You've reached the connected profile limit.",
          type: "error",
        });
        return { success: false };
      }

      const nonceResponse = await getNonce({ signerAddress });
      const { signable_message, server_signature } = nonceResponse;

      const clientSignature = await getSignature({ message: signable_message });
      if (clientSignature.userRejected) {
        setToast({
          message: "Authentication was canceled in your wallet.",
          type: "error",
        });
        return { success: false };
      }

      if (!clientSignature.signature) {
        setToast({
          message: AUTH_SIGNATURE_FAILED_MESSAGE,
          type: "error",
        });
        return { success: false };
      }

      const isPersisted = await loginWithSessionV2({
        serverSignature: server_signature,
        clientSignature: clientSignature.signature,
        signerAddress,
        role,
      }).then(persistSessionResponse);
      if (!isPersisted) {
        setToast({
          message: "Couldn't save this connected profile. Please try again.",
          type: "error",
        });
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      // Handle specific authentication nonce errors with detailed messages
      if (error instanceof InvalidSignerAddressError) {
        setToast({
          message: "Enter a valid wallet address.",
          type: "error",
        });
      } else if (error instanceof NonceResponseValidationError) {
        setToast({
          message:
            "Couldn't verify the authentication response. Please try again.",
          type: "error",
        });
      } else if (error instanceof AuthenticationNonceError) {
        setToast({
          message:
            "Couldn't reach the authentication service. Please try again.",
          type: "error",
        });
      } else {
        // Handle other errors (login API errors, etc.)
        logErrorSecurely("requestSignIn", error);
        setToast({
          type: "error",
          title: "Couldn't authenticate.",
          description: "Reconnect your wallet and try again.",
          details: getToastErrorDetails(error),
        });
      }
      return { success: false };
    }
  };

  // These functions have been moved above to fix initialization order

  const dispatchProfileSwitchedEvent = (
    profileProxy: ApiProfileProxy | null
  ) => {
    if (globalThis.window === undefined) {
      return;
    }

    globalThis.dispatchEvent(
      new CustomEvent(PROFILE_SWITCHED_EVENT, {
        detail: { profileProxy },
      })
    );
  };

  const ensureConnectedWalletAddress = (): string | null => {
    if (address) {
      return address;
    }

    setToast({
      message: "Connect your wallet to continue.",
      type: "error",
    });
    return null;
  };

  const showSessionUpgradePrompt = useCallback(
    (
      walletAddress: string,
      { forceShow = false }: { readonly forceShow?: boolean } = {}
    ): SessionUpgradePromptStatus => {
      const status = getOrCreateSessionUpgradePromptStatus(
        walletAddress,
        authRolloutSettings
      );
      setSignModalReason("session-upgrade");
      setSessionUpgradePromptMode(
        getSessionUpgradePromptMode(canSignActiveWallet)
      );
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      setShowSignModal(forceShow ? true : status.shouldShow);
      return status;
    },
    [authRolloutSettings, canSignActiveWallet]
  );

  const expireSessionUpgradeAuth = useCallback(
    async (walletAddress: string): Promise<void> => {
      const normalizedAddress = walletAddress.toLowerCase();
      if (expiredSessionUpgradeAddressRef.current === normalizedAddress) {
        return;
      }
      expiredSessionUpgradeAddressRef.current = normalizedAddress;

      clearSessionUpgradeReminder(walletAddress);
      setShowSignModal(false);
      setSignModalReason("auth");
      setSessionUpgradeRequired(false);
      await removeAuthJwt();
      invalidateAll();
    },
    [invalidateAll]
  );

  useEffect(() => {
    if (!address || signModalReason !== "session-upgrade") {
      return;
    }

    const refreshSessionUpgradePrompt = () => {
      const status = getOrCreateSessionUpgradePromptStatus(
        address,
        authRolloutSettings
      );
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      if (status.timeLeftMs <= 0) {
        expireSessionUpgradeAuth(address).catch((error) => {
          logErrorSecurely("session_upgrade_deadline_expired_logout", error);
        });
        return;
      }
      if (status.shouldShow) {
        setShowSignModal(true);
      }
    };

    refreshSessionUpgradePrompt();
    const interval = globalThis.setInterval(
      refreshSessionUpgradePrompt,
      60 * 1000
    );

    return () => {
      globalThis.clearInterval(interval);
    };
  }, [address, authRolloutSettings, expireSessionUpgradeAuth, signModalReason]);

  const authenticateUnauthorizedWallet = async (
    walletAddress: string
  ): Promise<boolean> => {
    const { success } = await requestSignIn({
      signerAddress: walletAddress,
      role: null,
    });

    if (!success) {
      setShowSignModal(false);
      try {
        await seizeDisconnect();
      } catch (error) {
        logErrorSecurely("requestAuth_disconnect_after_failed_signin", error);
      }
      return false;
    }

    invalidateAll();
    setShowSignModal(false);
    return true;
  };

  const disconnectAfterFailedSignIn = async (): Promise<void> => {
    try {
      await seizeDisconnect();
    } catch (error) {
      logErrorSecurely("requestAuth_disconnect_after_failed_signin", error);
    }
  };

  const getAuthorizedWalletValidationResult = async ({
    walletAddress,
    role,
  }: {
    readonly walletAddress: string;
    readonly role: string | null;
  }): Promise<AuthorizedWalletValidationResult> => {
    if (signModalReason === "session-upgrade") {
      return { isValid: false, requiresSessionUpgrade: true };
    }

    const validationResult = await validateJwt({
      jwt: getAuthJwt(),
      wallet: walletAddress,
      role,
      operationId: `manual-auth-${Date.now()}`,
      abortSignal: new AbortController().signal,
      activeProfileProxy,
    });

    if (
      validationResult.requiresSessionUpgrade &&
      !hasSessionUpgradeRollout(authRolloutSettings)
    ) {
      return { isValid: true };
    }

    return validationResult;
  };

  const prepareAuthorizedWalletReauthentication = async ({
    walletAddress,
    validationResult,
  }: {
    readonly walletAddress: string;
    readonly validationResult: AuthorizedWalletValidationResult;
  }): Promise<boolean> => {
    if (!validationResult.requiresSessionUpgrade) {
      setSignModalReason("auth");
      setSessionUpgradeRequired(false);
      await removeAuthJwt();
      return true;
    }

    setSessionUpgradeRequired(true);
    const promptStatus = showSessionUpgradePrompt(walletAddress, {
      forceShow: true,
    });
    if (promptStatus.timeLeftMs <= 0) {
      await expireSessionUpgradeAuth(walletAddress);
      return false;
    }
    return canSignActiveWallet;
  };

  const handleAuthorizedWalletSignInFailure = async (
    requiresSessionUpgrade: boolean | undefined
  ): Promise<false> => {
    setShowSignModal(false);
    if (!requiresSessionUpgrade) {
      await disconnectAfterFailedSignIn();
    }
    return false;
  };

  const finishAuthorizedWalletAuthentication = (): boolean => {
    const isSuccess = !!getAuthJwt();
    if (isSuccess) {
      setSignModalReason("auth");
      setShowSignModal(false);
    }
    return isSuccess;
  };

  const authenticateAuthorizedWallet = async (
    walletAddress: string
  ): Promise<boolean> => {
    const role = activeProfileProxy
      ? validateRoleForAuthentication(activeProfileProxy)
      : null;

    const validationResult = await getAuthorizedWalletValidationResult({
      walletAddress,
      role,
    });
    if (!validationResult.requiresSessionUpgrade) {
      setSessionUpgradeRequired(false);
    }

    if (
      validationResult.requiresSessionUpgrade &&
      signModalReason !== "session-upgrade"
    ) {
      setSessionUpgradeRequired(true);
      const promptStatus = getOrCreateSessionUpgradePromptStatus(
        walletAddress,
        authRolloutSettings
      );
      if (promptStatus.timeLeftMs <= 0) {
        await expireSessionUpgradeAuth(walletAddress);
        return false;
      }
      return finishAuthorizedWalletAuthentication();
    }

    if (!validationResult.isValid) {
      const canReauthenticate = await prepareAuthorizedWalletReauthentication({
        walletAddress,
        validationResult,
      });
      if (!canReauthenticate) {
        return false;
      }

      const { success } = await requestSignIn({
        signerAddress: walletAddress,
        role,
      });

      if (!success) {
        return await handleAuthorizedWalletSignInFailure(
          validationResult.requiresSessionUpgrade
        );
      }

      invalidateAll();
      if (validationResult.requiresSessionUpgrade) {
        clearSessionUpgradeReminder(walletAddress);
        setSessionUpgradeRequired(false);
      }
    }

    return finishAuthorizedWalletAuthentication();
  };

  const requestAuth = async (): Promise<{ success: boolean }> => {
    const connectedAddress = ensureConnectedWalletAddress();
    if (!connectedAddress) {
      return { success: false };
    }

    if (!enableWalletAuthentication) {
      return { success: true };
    }

    // Set loading state for signing
    setAuthLoadingState("signing");

    try {
      const success = isAddressAuthorized
        ? await authenticateAuthorizedWallet(connectedAddress)
        : await authenticateUnauthorizedWallet(connectedAddress);
      return { success };
    } finally {
      setAuthLoadingState("idle");
    }
  };

  const requestSessionUpgrade = async (): Promise<{ success: boolean }> => {
    const connectedAddress = ensureConnectedWalletAddress();
    if (!connectedAddress) {
      return { success: false };
    }

    if (!enableWalletAuthentication) {
      return { success: true };
    }

    setAuthLoadingState("signing");
    setSignModalReason("session-upgrade");

    try {
      const promptStatus = showSessionUpgradePrompt(connectedAddress, {
        forceShow: true,
      });
      if (promptStatus.timeLeftMs <= 0) {
        await expireSessionUpgradeAuth(connectedAddress);
        return { success: false };
      }

      if (!canSignActiveWallet) {
        return { success: false };
      }

      const role = activeProfileProxy
        ? validateRoleForAuthentication(activeProfileProxy)
        : null;
      const { success } = await requestSignIn({
        signerAddress: connectedAddress,
        role,
      });

      if (!success) {
        return { success: await handleAuthorizedWalletSignInFailure(true) };
      }

      invalidateAll();
      clearSessionUpgradeReminder(connectedAddress);
      setSessionUpgradeRequired(false);
      return { success: finishAuthorizedWalletAuthentication() };
    } finally {
      setAuthLoadingState("idle");
    }
  };

  const onActiveProfileProxy = async (
    profileProxy: ApiProfileProxy | null
  ): Promise<void> => {
    const isSameSelection =
      (profileProxy?.id ?? null) === (activeProfileProxy?.id ?? null);
    if (isSameSelection) {
      return;
    }

    if (!address) {
      setActiveProfileProxy(null);
      return;
    }

    if (!enableWalletAuthentication) {
      setActiveProfileProxy(profileProxy);
      dispatchProfileSwitchedEvent(profileProxy);
      return;
    }

    await removeAuthJwt();
    try {
      const { success } = await requestSignIn({
        signerAddress: address,
        role: profileProxy ? validateRoleForAuthentication(profileProxy) : null,
      });
      if (success) {
        setActiveProfileProxy(profileProxy);
        dispatchProfileSwitchedEvent(profileProxy);
      }
    } catch (error) {
      // Handle InvalidRoleStateError specifically
      if (error instanceof InvalidRoleStateError) {
        logErrorSecurely("onActiveProfileProxy_invalid_role_state", error);
        setToast({
          message: "Select a valid profile and try again.",
          type: "error",
        });
        // Reset to null state to force user to select valid profile
        setActiveProfileProxy(null);
        return;
      }

      // Handle MissingActiveProfileError
      if (error instanceof MissingActiveProfileError) {
        logErrorSecurely("onActiveProfileProxy_missing_profile", error);
        setToast({
          message:
            "Couldn't authenticate this profile. Select a profile and try again.",
          type: "error",
        });
        setActiveProfileProxy(null);
        return;
      }

      // Re-throw other errors to be handled by calling code
      throw error;
    }
  };

  const navigateAfterProfileSwitch = useCallback(() => {
    if (typeof globalThis.location === "undefined") {
      return;
    }

    const activeWaveId = getActiveWaveIdFromUrl({
      pathname,
      searchParams: new URLSearchParams(globalThis.location.search),
    });
    if (!activeWaveId) {
      return;
    }

    const cachedWave = queryClient.getQueryData<ApiWave>([
      QueryKey.WAVE,
      { wave_id: activeWaveId },
    ]);
    if (cachedWave && isPublicWave(cachedWave)) {
      return;
    }

    const isMessagesRoute =
      pathname === "/messages" || pathname.startsWith("/messages/");
    if (isMessagesRoute) {
      router.replace("/messages");
      return;
    }

    const isWavesRoute =
      pathname === "/waves" || pathname.startsWith("/waves/");
    if (isWavesRoute || pathname === "/") {
      router.replace("/waves");
    }
  }, [pathname, queryClient, router]);

  useEffect(() => {
    const onProfileSwitched = () => {
      setPendingProfileSwitch({
        targetAddress: getWalletAddress()?.toLowerCase() ?? null,
      });
    };

    if (globalThis.window === undefined) {
      return;
    }

    globalThis.window.addEventListener(
      PROFILE_SWITCHED_EVENT,
      onProfileSwitched
    );
    return () => {
      globalThis.window.removeEventListener(
        PROFILE_SWITCHED_EVENT,
        onProfileSwitched
      );
    };
  }, []);

  useEffect(() => {
    if (!pendingProfileSwitch) {
      return;
    }

    const targetAddress = pendingProfileSwitch.targetAddress;
    const currentAddress = address?.toLowerCase() ?? null;
    if (targetAddress && targetAddress !== currentAddress) {
      return;
    }

    if (isFetchingConnectedProfile) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      navigateAfterProfileSwitch();
      invalidateAuthSensitiveQueries();
      setPendingProfileSwitch(null);
    }, 0);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    address,
    invalidateAuthSensitiveQueries,
    isFetchingConnectedProfile,
    navigateAfterProfileSwitch,
    pendingProfileSwitch,
  ]);

  const showWaves = useMemo(() => {
    return (
      !!connectedProfile?.handle &&
      !activeProfileProxy &&
      !!address &&
      isAddressAuthorized
    );
  }, [
    connectedProfile?.handle,
    activeProfileProxy,
    address,
    isAddressAuthorized,
  ]);

  const onCancelSignRequest = useCallback(() => {
    if (signModalReason === "session-upgrade") {
      if (!address || !sessionUpgradeCanDismiss) {
        return;
      }
      const status = dismissSessionUpgradePrompt(address, authRolloutSettings);
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      setShowSignModal(false);
      return;
    }

    setShowSignModal(false);

    if (!isAddressAuthorized) {
      void seizeDisconnect().catch((error) => {
        logErrorSecurely("onCancelSignRequest_disconnect", error);
      });
      return;
    }

    void seizeDisconnectAndLogout().catch((error) => {
      logErrorSecurely("onCancelSignRequest_disconnectAndLogout", error);
    });
  }, [
    address,
    authRolloutSettings,
    isAddressAuthorized,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    sessionUpgradeCanDismiss,
    signModalReason,
  ]);

  // Computed modal visibility to prevent flickering during rapid state changes
  const shouldShowSignModal = useMemo(() => {
    const shouldHideDuringValidation =
      authLoadingState === "validating" &&
      signModalReason !== "session-upgrade";
    return (
      showSignModal &&
      !shouldHideDuringValidation &&
      connectionState === "connected"
    );
  }, [showSignModal, authLoadingState, connectionState, signModalReason]);

  const isSignRequestInProgress =
    isSigningPending || authLoadingState === "signing";
  const isSessionUpgradePrompt = signModalReason === "session-upgrade";
  const isConnectionShareUpgradePrompt =
    isSessionUpgradePrompt && sessionUpgradePromptMode === "reshare";
  const isDisconnectedWebSessionUpgradePrompt =
    isSessionUpgradePrompt &&
    sessionUpgradePromptMode === "sign" &&
    !canSignActiveWallet &&
    getSessionClientType() === "web";
  const sessionUpgradeTimeLeftText = useMemo(
    () => formatSessionUpgradeTimeLeft(sessionUpgradeTimeLeftMs),
    [sessionUpgradeTimeLeftMs]
  );
  const signModalTitleId = useId();
  const signModalTitle = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.connectionUpdateRequired");
    }
    if (isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.upgradeAuthentication");
    }
    return t(AUTH_MODAL_LOCALE, "auth.signModal.authenticationRequest");
  })();
  const signModalLead = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.connectionShareLead");
    }
    if (isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.sessionUpgradeLead");
    }
    return t(AUTH_MODAL_LOCALE, "auth.signModal.authLead");
  })();
  const signModalPrimaryListItem = (() => {
    if (isConnectionShareUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.connectionSharePrimary");
    }
    if (isDisconnectedWebSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.disconnectedUpgradePrimary");
    }
    if (isSessionUpgradePrompt) {
      return t(AUTH_MODAL_LOCALE, "auth.signModal.sessionUpgradePrimary");
    }
    return t(AUTH_MODAL_LOCALE, "auth.signModal.authPrimary");
  })();
  const signModalSharedConnectionListItem = t(
    AUTH_MODAL_LOCALE,
    "auth.signModal.sharedConnection"
  );
  const signModalSecondaryListItem = isSessionUpgradePrompt
    ? t(AUTH_MODAL_LOCALE, "auth.signModal.timeLeft", {
        timeLeft: sessionUpgradeTimeLeftText,
      })
    : t(AUTH_MODAL_LOCALE, "auth.signModal.noGas");
  const signModalConfirmText = isDisconnectedWebSessionUpgradePrompt
    ? t(AUTH_MODAL_LOCALE, "auth.signModal.connect")
    : t(AUTH_MODAL_LOCALE, "auth.signModal.sign");
  const reconnectActiveWalletForSessionUpgrade = async (): Promise<void> => {
    try {
      await seizeDisconnect();
    } catch (error) {
      logErrorSecurely("session_upgrade_disconnect_before_connect", error);
      return;
    }

    seizeConnect();
  };
  const onConfirmSignRequest = () => {
    if (isDisconnectedWebSessionUpgradePrompt) {
      void reconnectActiveWalletForSessionUpgrade();
      return;
    }
    void requestAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        requestAuth,
        setToast,
        connectedProfile: connectedProfile ?? null,
        isAuthenticated: Boolean(
          connectedProfile?.handle && isAddressAuthorized
        ),
        fetchingProfile: isFetchingConnectedProfile,
        receivedProfileProxies,
        activeProfileProxy,
        showWaves,
        sessionUpgradeRequired,
        connectionStatus: getProfileConnectedStatus({
          profile: connectedProfile ?? null,
          isProxy: !!activeProfileProxy,
        }),
        requestSessionUpgrade,
        setActiveProfileProxy: onActiveProfileProxy,
      }}
    >
      {children}
      <AppToastContainer />
      {enableWalletAuthentication && (
        <Modal
          show={shouldShowSignModal}
          onHide={() => {
            // Only allow modal dismissal when not actively validating
            if (authLoadingState === "validating") {
              return;
            }
            if (isSessionUpgradePrompt) {
              onCancelSignRequest();
              return;
            }
            setShowSignModal(false);
          }}
          backdrop="static"
          keyboard={false}
          centered
          aria-labelledby={signModalTitleId}
          dialogClassName={styles["signModalDialog"] ?? ""}
          contentClassName={styles["signModalSurface"] ?? ""}
        >
          <Modal.Header className={styles["signModalHeader"]}>
            <Modal.Title
              id={signModalTitleId}
              className={styles["signModalTitle"]}
            >
              {signModalTitle}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className={styles["signModalBody"]}>
            <p className={styles["signModalLead"]}>{signModalLead}</p>

            <ul className={styles["signModalList"]}>
              <li>{signModalPrimaryListItem}</li>
              {isDisconnectedWebSessionUpgradePrompt && (
                <li>{signModalSharedConnectionListItem}</li>
              )}
              <li>{signModalSecondaryListItem}</li>
            </ul>
            {isSessionUpgradePrompt && (
              <p className={styles["signModalLearnMore"]}>
                <Link href="/about/tech/wallet-authentication">
                  {t(AUTH_MODAL_LOCALE, "auth.signModal.learnMore")}
                </Link>
              </p>
            )}
          </Modal.Body>
          <Modal.Footer className={styles["signModalFooter"]}>
            {!isSignRequestInProgress &&
              (!isSessionUpgradePrompt || sessionUpgradeCanDismiss) && (
                <Button
                  variant="link"
                  className={styles["signModalCancelButton"]}
                  onClick={onCancelSignRequest}
                >
                  {isSessionUpgradePrompt
                    ? t(AUTH_MODAL_LOCALE, "auth.signModal.remindLater")
                    : t(AUTH_MODAL_LOCALE, "auth.signModal.cancel")}
                </Button>
              )}
            {!isConnectionShareUpgradePrompt && (
              <Button
                variant="link"
                className={styles["signModalConfirmButton"]}
                onClick={onConfirmSignRequest}
                disabled={isSignRequestInProgress}
              >
                {isSigningPending ? (
                  <span className={styles["signModalButtonContent"]}>
                    {t(AUTH_MODAL_LOCALE, "auth.signModal.confirmInWallet")}{" "}
                    <DotLoader />
                  </span>
                ) : (
                  signModalConfirmText
                )}
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </AuthContext.Provider>
  );
}
