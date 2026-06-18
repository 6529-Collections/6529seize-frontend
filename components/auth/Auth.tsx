"use client";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import { publicEnv } from "@/config/env";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import {
  InvalidRoleStateError,
  MissingActiveProfileError,
} from "@/errors/authentication";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { groupProfileProxies } from "@/helpers/profile-proxy.helpers";
import { getProfileConnectedStatus } from "@/helpers/ProfileHelpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useIdentity } from "@/hooks/useIdentity";
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
  readonly fetchingProfile: boolean;
  readonly connectionStatus: ProfileConnectedStatus;
  readonly receivedProfileProxies: ApiProfileProxy[];
  readonly activeProfileProxy: ApiProfileProxy | null;
  readonly showWaves: boolean;
  readonly requestAuth: () => Promise<{ success: boolean }>;
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
  readonly startedAt: number;
  readonly dismissedUntil: number;
}

interface SessionUpgradePromptStatus {
  readonly shouldShow: boolean;
  readonly canDismiss: boolean;
  readonly timeLeftMs: number;
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
  readonly setShowSignModal: (show: boolean) => void;
  readonly invalidateAll: () => void;
  readonly reset: () => void;
}

const SESSION_UPGRADE_REMINDER_STORAGE_KEY =
  "6529-session-v2-upgrade-reminders";
const SESSION_UPGRADE_GRACE_MS = 72 * 60 * 60 * 1000;
const SESSION_UPGRADE_REMINDER_MS = 2 * 60 * 60 * 1000;

const normalizeReminderAddress = (address: string): string =>
  address.toLowerCase();

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
        typeof record.startedAt === "number" &&
        Number.isFinite(record.startedAt) &&
        typeof record.dismissedUntil === "number" &&
        Number.isFinite(record.dismissedUntil)
      ) {
        reminders[address] = {
          startedAt: record.startedAt,
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

const getSessionUpgradeGlobalDeadline = (): number | null => {
  const configuredDeadline = publicEnv.SESSION_V2_MIGRATION_DEADLINE;
  if (!configuredDeadline) {
    return null;
  }

  const timestamp = Date.parse(configuredDeadline);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getSessionUpgradeEffectiveDeadline = (
  reminder: SessionUpgradeReminderState
): number => {
  const localDeadline = reminder.startedAt + SESSION_UPGRADE_GRACE_MS;
  const globalDeadline = getSessionUpgradeGlobalDeadline();
  return globalDeadline === null
    ? localDeadline
    : Math.min(localDeadline, globalDeadline);
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
  now: number = Date.now()
): SessionUpgradePromptStatus => {
  const existingReminder = getSessionUpgradeReminder(address);
  const reminder = existingReminder ?? {
    startedAt: now,
    dismissedUntil: 0,
  };

  if (!existingReminder) {
    setSessionUpgradeReminder(address, reminder);
  }

  const deadline = getSessionUpgradeEffectiveDeadline(reminder);
  const timeLeftMs = Math.max(0, deadline - now);
  const canDismiss = timeLeftMs > 0;

  return {
    shouldShow: !canDismiss || now >= reminder.dismissedUntil,
    canDismiss,
    timeLeftMs,
  };
};

const dismissSessionUpgradePrompt = (
  address: string,
  now: number = Date.now()
): SessionUpgradePromptStatus => {
  const reminder = getSessionUpgradeReminder(address) ?? {
    startedAt: now,
    dismissedUntil: 0,
  };
  const deadline = getSessionUpgradeEffectiveDeadline(reminder);
  const dismissedUntil = Math.min(now + SESSION_UPGRADE_REMINDER_MS, deadline);
  const nextReminder = {
    startedAt: reminder.startedAt,
    dismissedUntil,
  };

  setSessionUpgradeReminder(address, nextReminder);

  return {
    shouldShow: now >= dismissedUntil,
    canDismiss: deadline > now,
    timeLeftMs: Math.max(0, deadline - now),
  };
};

const formatSessionUpgradeTimeLeft = (timeLeftMs: number): string => {
  if (timeLeftMs <= 0) {
    return "0 hours";
  }

  const totalHours = Math.ceil(timeLeftMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0) {
    return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
  }

  const dayText = `${days} ${days === 1 ? "day" : "days"}`;
  if (hours === 0) {
    return dayText;
  }

  return `${dayText} ${hours} ${hours === 1 ? "hour" : "hours"}`;
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
  setShowSignModal,
  invalidateAll,
  reset,
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
              const status =
                getOrCreateSessionUpgradePromptStatus(currentAddress);
              setSignModalReason("session-upgrade");
              setSessionUpgradePromptMode(
                canSignActiveWallet ? "sign" : "reshare"
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
  fetchingProfile: false,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  showWaves: false,
  requestAuth: async () => ({ success: false }),
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
  const { invalidateAll } = useContext(ReactQueryWrapperContext);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    address,
    hasValidWalletAuth: isAddressAuthorized,
    isConnected,
    hasActiveWalletAddress,
    canSignActiveWallet,
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

  const { profile: connectedProfile, isLoading: fetchingProfile } = useIdentity(
    {
      handleOrWallet: address,
      initialProfile: null,
    }
  );

  // Race condition prevention: AbortController and operation tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestAddressRef = useRef<string | undefined>(address);
  const activeValidationOperationIdRef = useRef<string | null>(null);
  const expiredSessionUpgradeAddressRef = useRef<string | null>(null);
  const [authLoadingState, setAuthLoadingState] =
    useState<AuthLoadingState>("idle");

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
      return;
    }

    if (!isAddressAuthorized) {
      if (isConnected) {
        setSignModalReason("auth");
        setShowSignModal(true);
      }
      return;
    }

    // Clear any stale sign modal state when returning to an authorized account.
    // If JWT validation still needs a signature, validateAuthImmediate will
    // re-open it via onShowSignModal(true).
    setShowSignModal(false);

    const activeStoredAddress = getWalletAddress();
    if (
      activeStoredAddress &&
      activeStoredAddress.toLowerCase() !== address.toLowerCase()
    ) {
      setActiveWalletAccount(address);
    }

    // Capture current address at validation time to prevent race conditions
    const currentAddress = address;

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
      setShowSignModal,
      invalidateAll,
      reset,
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
      const isSingleWebSessionV2 = getSessionClientType() === "web";
      if (
        !canStoreAnotherWalletAccount(signerAddress, {
          allowAdditionalAccounts: !isSingleWebSessionV2,
        })
      ) {
        setToast({
          message: isSingleWebSessionV2
            ? "Disconnect the current profile before connecting another profile"
            : "You've reached the connected profile limit.",
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
      const status = getOrCreateSessionUpgradePromptStatus(walletAddress);
      setSignModalReason("session-upgrade");
      setSessionUpgradePromptMode(canSignActiveWallet ? "sign" : "reshare");
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      setShowSignModal(forceShow ? true : status.shouldShow);
      return status;
    },
    [canSignActiveWallet]
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
      const status = getOrCreateSessionUpgradePromptStatus(address);
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      if (status.timeLeftMs <= 0) {
        expireSessionUpgradeAuth(address).catch((error) => {
          logErrorSecurely("session_upgrade_grace_expired_logout", error);
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
  }, [address, expireSessionUpgradeAuth, signModalReason]);

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

    return await validateJwt({
      jwt: getAuthJwt(),
      wallet: walletAddress,
      role,
      operationId: `manual-auth-${Date.now()}`,
      abortSignal: new AbortController().signal,
      activeProfileProxy,
    });
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
      await removeAuthJwt();
      return true;
    }

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
    const activeWaveId = getActiveWaveIdFromUrl({ pathname, searchParams });
    if (!activeWaveId) {
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
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const onProfileSwitched = () => {
      invalidateAll();
      navigateAfterProfileSwitch();
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
  }, [invalidateAll, navigateAfterProfileSwitch]);

  const showWaves = useMemo(() => {
    return !!connectedProfile?.handle && !activeProfileProxy && !!address;
  }, [connectedProfile?.handle, activeProfileProxy, address]);

  const onCancelSignRequest = useCallback(() => {
    if (signModalReason === "session-upgrade") {
      if (!address || !sessionUpgradeCanDismiss) {
        return;
      }
      const status = dismissSessionUpgradePrompt(address);
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
    isAddressAuthorized,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    sessionUpgradeCanDismiss,
    signModalReason,
  ]);

  // Computed modal visibility to prevent flickering during rapid state changes
  const shouldShowSignModal = useMemo(() => {
    return (
      showSignModal &&
      authLoadingState !== "validating" &&
      connectionState === "connected"
    );
  }, [showSignModal, authLoadingState, connectionState]);

  const isSessionUpgradePrompt = signModalReason === "session-upgrade";
  const isConnectionShareUpgradePrompt =
    isSessionUpgradePrompt && sessionUpgradePromptMode === "reshare";
  const sessionUpgradeTimeLeftText = useMemo(
    () => formatSessionUpgradeTimeLeft(sessionUpgradeTimeLeftMs),
    [sessionUpgradeTimeLeftMs]
  );
  const signModalTitle = (() => {
    if (isConnectionShareUpgradePrompt) {
      return "Connection Update Required";
    }
    if (isSessionUpgradePrompt) {
      return "Upgrade Authentication";
    }
    return "Sign Authentication Request";
  })();
  const signModalLead = (() => {
    if (isConnectionShareUpgradePrompt) {
      return "This shared connection uses the previous authentication flow. Reshare the connection from a device that is already signed in with the new authentication.";
    }
    if (isSessionUpgradePrompt) {
      return "We have upgraded wallet authentication. Sign once to move this connected wallet to the new secure session.";
    }
    return "To connect your wallet, you will need to sign a message to confirm your identity.";
  })();
  const signModalPrimaryListItem = (() => {
    if (isConnectionShareUpgradePrompt) {
      return "Use connection sharing from an active session-v2 web connection, then open the new shared connection on this device.";
    }
    if (isSessionUpgradePrompt) {
      return "Your current connection will stay available while the new session is created.";
    }
    return "This signature will be used to generate a secure token (JWT) to authenticate your session.";
  })();
  const signModalSecondaryListItem = isSessionUpgradePrompt
    ? `Temporary access time remaining: ${sessionUpgradeTimeLeftText}.`
    : "Your signature will not cost any gas and is purely for authentication purposes.";

  return (
    <AuthContext.Provider
      value={{
        requestAuth,
        setToast,
        connectedProfile: connectedProfile ?? null,
        fetchingProfile,
        receivedProfileProxies,
        activeProfileProxy,
        showWaves,
        connectionStatus: getProfileConnectedStatus({
          profile: connectedProfile ?? null,
          isProxy: !!activeProfileProxy,
        }),
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
          dialogClassName={styles["signModalDialog"] ?? ""}
          contentClassName={styles["signModalSurface"] ?? ""}
        >
          <Modal.Header className={styles["signModalHeader"]}>
            <div className={styles["signModalTitle"]}>{signModalTitle}</div>
          </Modal.Header>
          <Modal.Body className={styles["signModalBody"]}>
            <p className={styles["signModalLead"]}>{signModalLead}</p>

            <ul className={styles["signModalList"]}>
              <li>{signModalPrimaryListItem}</li>
              <li>{signModalSecondaryListItem}</li>
            </ul>
          </Modal.Body>
          <Modal.Footer className={styles["signModalFooter"]}>
            {(!isSessionUpgradePrompt || sessionUpgradeCanDismiss) && (
              <Button
                variant="link"
                className={styles["signModalCancelButton"]}
                onClick={onCancelSignRequest}
              >
                {isSessionUpgradePrompt ? "Remind me later" : "Cancel"}
              </Button>
            )}
            {!isConnectionShareUpgradePrompt && (
              <Button
                variant="link"
                className={styles["signModalConfirmButton"]}
                onClick={() => requestAuth()}
                disabled={isSigningPending}
              >
                {isSigningPending ? (
                  <span className={styles["signModalButtonContent"]}>
                    Confirm in your wallet <DotLoader />
                  </span>
                ) : (
                  "Sign"
                )}
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </AuthContext.Provider>
  );
}
