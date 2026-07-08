"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent } from "react";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import {
  AppToastContainer,
  showAppToast,
} from "@/components/utils/toast/AppToast";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { groupProfileProxies } from "@/helpers/profile-proxy.helpers";
import { getProfileConnectedStatus } from "@/helpers/ProfileHelpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useSecureSign } from "@/hooks/useSecureSign";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getAuthJwt,
  getWalletAddress,
  hasActiveSessionV2Auth,
  PROFILE_SWITCHED_EVENT,
  setActiveWalletAccount,
  syncConnectedWalletProfile,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { getRole } from "@/services/auth/jwt-validation.utils";
import {
  getSessionClientType,
  verifyActiveSessionV2WebSession,
} from "@/services/auth/session-v2.utils";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import { AuthSignModal } from "./AuthSignModal";
import { createAuthRequestActions } from "./authActions";
import { AuthContext } from "./authContext";
import { useAuthImpactTracking } from "./auth-impact-tracking";
import { navigateAfterProfileSwitch } from "./authProfileNavigation";
import { isProfileForAddress } from "./authProfileUtils";
import {
  useSessionUpgradeDeadlineRefresh,
  useSessionUpgradeExpiry,
} from "./auth-session-upgrade-deadline";
import {
  AUTH_TOKEN_CHANGED_EVENT_NAME,
  DEFAULT_AUTH_ROLLOUT_SETTINGS,
  dismissSessionUpgradePrompt,
  getManualSessionUpgradePromptStatus,
  getOrCreateSessionUpgradePromptStatus,
  getSessionUpgradePromptMode,
  getStoredLegacySessionUpgradeAddress,
  hasSessionUpgradeRollout,
  normalizeSessionV2MigrationDeadline,
} from "./authSessionUpgrade";
import type {
  AuthContextType,
  AuthLoadingState,
  AuthRolloutSettings,
  SessionUpgradePromptStatus,
  SessionUpgradePromptMode,
  SignModalReason,
} from "./authTypes";
import { runImmediateAuthValidation } from "./authValidation";
import { useSeizeConnectContext } from "./SeizeConnectContext";

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
  const [sessionUpgradeHasDeadline, setSessionUpgradeHasDeadline] =
    useState(false);
  const [sessionUpgradeRequired, setSessionUpgradeRequired] = useState(false);
  const [authStorageRevision, setAuthStorageRevision] = useState(0);
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestAddressRef = useRef<string | undefined>(address);
  const activeValidationOperationIdRef = useRef<string | null>(null);
  const validationOperationCounterRef = useRef(0);
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

  const {
    authPromptTrackingReasonRef,
    resetTrackedAuthImpactKeys,
    syncVisibleAuthPromptTracking,
    trackForcedLogout,
  } = useAuthImpactTracking({
    address,
    hasActiveWalletAddress,
    isAddressAuthorized,
  });

  const abortCurrentAuthOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeValidationOperationIdRef.current = null;
    setAuthLoadingState("idle");
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const recheckStoredAuth = () => {
      setAuthStorageRevision((revision) => revision + 1);
    };

    globalThis.window.addEventListener("storage", recheckStoredAuth);
    globalThis.window.addEventListener(
      WALLET_ACCOUNTS_UPDATED_EVENT,
      recheckStoredAuth
    );
    globalThis.window.addEventListener(
      AUTH_TOKEN_CHANGED_EVENT_NAME,
      recheckStoredAuth
    );

    return () => {
      globalThis.window.removeEventListener("storage", recheckStoredAuth);
      globalThis.window.removeEventListener(
        WALLET_ACCOUNTS_UPDATED_EVENT,
        recheckStoredAuth
      );
      globalThis.window.removeEventListener(
        AUTH_TOKEN_CHANGED_EVENT_NAME,
        recheckStoredAuth
      );
    };
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
    trackForcedLogout({
      reason: "stored_auth_invalid",
      wasConnectedWallet: false,
    });
    invalidateAll();
    setActiveProfileProxy(null);
    seizeDisconnectAndLogout();
  }, [invalidateAll, seizeDisconnectAndLogout, trackForcedLogout]);

  const { expireSessionUpgradeAuth, resetSessionUpgradeExpiryDedupe } =
    useSessionUpgradeExpiry({
      hasActiveWalletAddress,
      invalidateAll,
      setSessionUpgradeHasDeadline,
      setSessionUpgradeRequired,
      setShowSignModal,
      setSignModalReason,
      trackForcedLogout,
    });

  useEffect(() => {
    return () => {
      abortCurrentAuthOperation();
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
    resetTrackedAuthImpactKeys();
  }, [address, resetTrackedAuthImpactKeys]);

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

  const verifyActiveWebSessionForAddress = useCallback(
    async (
      walletAddress: string,
      abortSignal?: AbortSignal
    ): Promise<boolean> => {
      try {
        return await verifyActiveSessionV2WebSession({
          address: walletAddress,
          abortSignal,
        });
      } catch (error) {
        if (!abortSignal?.aborted) {
          logErrorSecurely("session_v2_web_session_verification", error);
          throw error;
        }
        return false;
      }
    },
    []
  );

  const ensureActiveSessionV2WebSessionForActiveWallet = useCallback(
    async (params?: {
      readonly address?: string | undefined;
      readonly abortSignal?: AbortSignal | undefined;
    }): Promise<boolean> => {
      const walletAddress = params?.address ?? getWalletAddress() ?? address;
      if (!walletAddress || !getAuthJwt()) {
        return false;
      }

      return await verifyActiveWebSessionForAddress(
        walletAddress,
        params?.abortSignal
      );
    },
    [address, verifyActiveWebSessionForAddress]
  );

  // Immediate authentication effect with race condition prevention
  useEffect(() => {
    if (!enableWalletAuthentication) {
      abortCurrentAuthOperation();
      setShowSignModal(false);
      setAuthLoadingState("idle");
      setSessionUpgradeRequired(false);
      return undefined;
    }

    // Clear previous operations when dependencies change
    abortCurrentAuthOperation();

    // Don't start validation during transitional states
    if (connectionState === "connecting") {
      return undefined;
    }

    if (!address || connectionState !== "connected") {
      setShowSignModal(false);
      const storedAuthAddress = getWalletAddress();
      if (!storedAuthAddress || !getAuthJwt()) {
        setSessionUpgradeRequired(false);
        setSessionUpgradeHasDeadline(false);
        return undefined;
      }

      // Passive disconnected validation must not call session-refresh: that
      // endpoint rotates the web session cookie and can race during reload.
      // Explicit actions, such as connection sharing, still verify server
      // session state before proceeding.
      setSessionUpgradeHasDeadline(false);
      setSessionUpgradeRequired(
        !hasActiveSessionV2Auth({ address: storedAuthAddress })
      );
      return undefined;
    }

    if (!isAddressAuthorized) {
      setSessionUpgradeRequired(false);
      if (isConnected) {
        authPromptTrackingReasonRef.current = "wallet_not_authorized";
        setSignModalReason("auth");
        setShowSignModal(true);
      }
      return undefined;
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
    authPromptTrackingReasonRef.current = "auth_validation_failed";
    setSessionUpgradeRequired(false);

    // Generate unique operation ID for this validation attempt
    validationOperationCounterRef.current += 1;
    const operationId = `auth-${Date.now()}-${validationOperationCounterRef.current}`;
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
      setSessionUpgradeHasDeadline,
      setSessionUpgradeRequired,
      setShowSignModal,
      invalidateAll,
      reset,
      resetSessionUpgradeExpiryDedupe,
      authRolloutSettings,
    }).catch((error) => {
      logErrorSecurely("auth_immediate_validation_unhandled", error);
    });

    // No cleanup needed - immediate execution prevents stale timeouts
    return undefined;
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
    resetSessionUpgradeExpiryDedupe,
    authRolloutSettings,
    authStorageRevision,
  ]);

  const setToast = useCallback((toast: AppToastInput) => {
    showAppToast(toast);
  }, []);

  const showSessionUpgradePrompt = useCallback(
    (
      walletAddress: string,
      {
        forceShow = false,
        allowWithoutDeadline = false,
      }: {
        readonly forceShow?: boolean;
        readonly allowWithoutDeadline?: boolean;
      } = {}
    ): SessionUpgradePromptStatus => {
      const hasRollout = hasSessionUpgradeRollout(authRolloutSettings);
      const status =
        hasRollout || !allowWithoutDeadline
          ? getOrCreateSessionUpgradePromptStatus(
              walletAddress,
              authRolloutSettings
            )
          : getManualSessionUpgradePromptStatus();
      setSignModalReason("session-upgrade");
      setSessionUpgradePromptMode(
        getSessionUpgradePromptMode(Boolean(address) && canSignActiveWallet)
      );
      setSessionUpgradeTimeLeftMs(status.timeLeftMs);
      setSessionUpgradeCanDismiss(status.canDismiss);
      setSessionUpgradeHasDeadline(hasRollout);
      setShowSignModal(forceShow ? true : status.shouldShow);
      return status;
    },
    [address, authRolloutSettings, canSignActiveWallet]
  );

  useSessionUpgradeDeadlineRefresh({
    address,
    authRolloutSettings,
    expireSessionUpgradeAuth,
    signModalReason,
    setSessionUpgradeCanDismiss,
    setSessionUpgradeTimeLeftMs,
    setShowSignModal,
  });

  const { onActiveProfileProxy, requestAuth, requestSessionUpgrade } =
    createAuthRequestActions({
      activeProfileProxy,
      address,
      authRolloutSettings,
      canSignActiveWallet,
      enableWalletAuthentication,
      expireSessionUpgradeAuth,
      invalidateAll,
      isAddressAuthorized,
      seizeDisconnect,
      resetSessionUpgradeExpiryDedupe,
      setActiveProfileProxy,
      setAuthLoadingState,
      setSessionUpgradeRequired,
      setShowSignModal,
      setSignModalReason,
      setToast,
      showSessionUpgradePrompt,
      signMessage,
      signModalReason,
    });

  const navigateAfterProfileSwitchForRoute = useCallback(() => {
    navigateAfterProfileSwitch({ pathname, queryClient, router });
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
      navigateAfterProfileSwitchForRoute();
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
    navigateAfterProfileSwitchForRoute,
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
      if (!sessionUpgradeCanDismiss) {
        return;
      }
      const upgradeAddress = address ?? getStoredLegacySessionUpgradeAddress();
      if (upgradeAddress && hasSessionUpgradeRollout(authRolloutSettings)) {
        const status = dismissSessionUpgradePrompt(
          upgradeAddress,
          authRolloutSettings
        );
        setSessionUpgradeTimeLeftMs(status.timeLeftMs);
        setSessionUpgradeCanDismiss(status.canDismiss);
      }
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

  // Computed modal visibility to prevent flickering during rapid state changes
  const shouldShowSignModal = useMemo(() => {
    const shouldHideDuringValidation =
      authLoadingState === "validating" &&
      signModalReason !== "session-upgrade";
    return (
      showSignModal &&
      !shouldHideDuringValidation &&
      (connectionState === "connected" || isDisconnectedWebSessionUpgradePrompt)
    );
  }, [
    authLoadingState,
    connectionState,
    isDisconnectedWebSessionUpgradePrompt,
    showSignModal,
    signModalReason,
  ]);

  useEffect(() => {
    syncVisibleAuthPromptTracking({
      shouldShowSignModal,
      signModalReason,
    });
  }, [
    shouldShowSignModal,
    signModalReason,
    syncVisibleAuthPromptTracking,
  ]);

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
      setShowSignModal(false);
      globalThis.setTimeout(() => {
        void reconnectActiveWalletForSessionUpgrade();
      }, 0);
      return;
    }
    void requestAuth();
  };
  const onSessionUpgradeLearnMore = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onCancelSignRequest();
    router.push("/about/tech/wallet-authentication");
  };
  const authContextValue = useMemo<AuthContextType>(
    () => ({
      requestAuth,
      setToast,
      connectedProfile: connectedProfile ?? null,
      isAuthenticated: Boolean(connectedProfile?.handle && isAddressAuthorized),
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
      ensureActiveSessionV2WebSession:
        ensureActiveSessionV2WebSessionForActiveWallet,
      setActiveProfileProxy: onActiveProfileProxy,
    }),
    [
      activeProfileProxy,
      connectedProfile,
      ensureActiveSessionV2WebSessionForActiveWallet,
      isAddressAuthorized,
      isFetchingConnectedProfile,
      onActiveProfileProxy,
      receivedProfileProxies,
      requestAuth,
      requestSessionUpgrade,
      sessionUpgradeRequired,
      setToast,
      showWaves,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <AppToastContainer />
      <AuthSignModal
        enableWalletAuthentication={enableWalletAuthentication}
        isConnectionShareUpgradePrompt={isConnectionShareUpgradePrompt}
        isDisconnectedWebSessionUpgradePrompt={
          isDisconnectedWebSessionUpgradePrompt
        }
        isSessionUpgradePrompt={isSessionUpgradePrompt}
        isSigningPending={isSigningPending}
        isSignRequestInProgress={isSignRequestInProgress}
        onCancelSignRequest={onCancelSignRequest}
        onConfirmSignRequest={onConfirmSignRequest}
        onSessionUpgradeLearnMore={onSessionUpgradeLearnMore}
        sessionUpgradeCanDismiss={sessionUpgradeCanDismiss}
        sessionUpgradeHasDeadline={sessionUpgradeHasDeadline}
        sessionUpgradeTimeLeftMs={sessionUpgradeTimeLeftMs}
        shouldShowSignModal={shouldShowSignModal}
      />
    </AuthContext.Provider>
  );
}
