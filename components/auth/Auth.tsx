"use client";

import "react-toastify/dist/ReactToastify.css";
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
import { Slide, toast, ToastContainer } from "react-toastify";
import { isAddress } from "viem";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import {
  InvalidRoleStateError,
  MissingActiveProfileError,
} from "@/errors/authentication";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiLoginRequest } from "@/generated/models/ApiLoginRequest";
import type { ApiLoginResponse } from "@/generated/models/ApiLoginResponse";
import type { ApiNonceResponse } from "@/generated/models/ApiNonceResponse";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { groupProfileProxies } from "@/helpers/profile-proxy.helpers";
import { getProfileConnectedStatus } from "@/helpers/ProfileHelpers";
import { useIdentity } from "@/hooks/useIdentity";
import {
  ConnectionMismatchError,
  MobileSigningError,
  SigningProviderError,
  useSecureSign,
} from "@/hooks/useSecureSign";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  canStoreAnotherWalletAccount,
  getAuthJwt,
  getWalletAddress,
  isAuthAddressAuthorized,
  PROFILE_SWITCHED_EVENT,
  removeAuthJwt,
  setActiveWalletAccount,
  setAuthJwt,
  syncConnectedWalletProfile,
} from "@/services/auth/auth.utils";
import { validateAuthImmediate } from "@/services/auth/immediate-validation.utils";
import { getRole, validateJwt } from "@/services/auth/jwt-validation.utils";
import {
  logErrorSecurely,
  sanitizeErrorForUser,
} from "@/utils/error-sanitizer";
import { validateRoleForAuthentication } from "@/utils/role-validation";
import DotLoader from "../dotLoader/DotLoader";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import styles from "./Auth.module.scss";
import { useSeizeConnectContext } from "./SeizeConnectContext";
import type { TypeOptions } from "react-toastify";

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
  readonly setToast: ({
    message,
    type,
  }: {
    message: string | React.ReactNode;
    type: TypeOptions;
  }) => void;
  readonly setActiveProfileProxy: (
    profileProxy: ApiProfileProxy | null
  ) => Promise<void>;
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
    connectedAccounts,
    isConnected,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    isSafeWallet,
    connectionState,
  } = useSeizeConnectContext();

  const isAddressAuthorized = useMemo(() => {
    return isAuthAddressAuthorized({
      address,
      connectedAccounts,
    });
  }, [address, connectedAccounts]);

  const {
    signMessage,
    isSigningPending,
    reset: resetSigning,
  } = useSecureSign({
    signatureType: isSafeWallet ? "contract" : "eoa",
  });
  const [showSignModal, setShowSignModal] = useState(false);

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
  const [authLoadingState, setAuthLoadingState] = useState<
    "idle" | "validating" | "signing"
  >("idle");

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
    const validateImmediately = async () => {
      if (
        latestAddressRef.current !== currentAddress ||
        activeValidationOperationIdRef.current !== operationId
      ) {
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setAuthLoadingState("validating");

      try {
        const result = await validateAuthImmediate({
          params: {
            currentAddress,
            connectionAddress: currentAddress,
            jwt: getAuthJwt(),
            activeProfileProxy,
            isConnected,
            operationId,
            abortSignal: abortController.signal,
          },
          callbacks: {
            onShowSignModal: setShowSignModal,
            onInvalidateCache: invalidateAll,
            onReset: reset,
            onRemoveJwt: removeAuthJwt,
            onLogError: logErrorSecurely,
          },
        });

        if (
          result.wasCancelled ||
          latestAddressRef.current !== currentAddress ||
          activeValidationOperationIdRef.current !== operationId
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

    validateImmediately();

    // No cleanup needed - immediate execution prevents stale timeouts
  }, [
    address,
    activeProfileProxy,
    connectionState,
    enableWalletAuthentication,
    isAddressAuthorized,
    isConnected,
    abortCurrentAuthOperation,
    invalidateAll,
    reset,
  ]);

  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<ApiNonceResponse> => {
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
      const response = await commonApiFetch<ApiNonceResponse>({
        endpoint: "auth/nonce",
        params: {
          signer_address: signerAddress,
        },
      });

      // Response validation - fail fast on invalid response
      if (!response) {
        throw new NonceResponseValidationError(
          "Nonce API returned null or undefined response"
        );
      }

      if (
        !response.nonce ||
        typeof response.nonce !== "string" ||
        response.nonce.trim().length === 0
      ) {
        throw new NonceResponseValidationError(
          "Invalid nonce in API response",
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

  const setToast = ({
    message,
    type,
  }: {
    message: string | React.ReactNode;
    type: TypeOptions;
  }) => {
    toast(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      draggable: false,
      closeOnClick: true,
      transition: Slide,
      theme: "dark",
      type,
    });
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
              "Wallet address mismatch. Please disconnect and reconnect your wallet.",
            type: "error",
          });
        } else if (result.error instanceof SigningProviderError) {
          setToast({
            message:
              "Wallet provider error. Please reconnect your wallet and try again.",
            type: "error",
          });
        } else if (result.error instanceof MobileSigningError) {
          // Show mobile-specific error messages
          setToast({
            message: result.error.message,
            type: "error",
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
        message: sanitizeErrorForUser(error),
        type: "error",
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
          message: "Maximum connected profiles reached",
          type: "error",
        });
        return { success: false };
      }

      const nonceResponse = await getNonce({ signerAddress });
      const { nonce, server_signature } = nonceResponse;

      const clientSignature = await getSignature({ message: nonce });
      if (clientSignature.userRejected) {
        setToast({
          message: "Authentication rejected",
          type: "error",
        });
        return { success: false };
      }

      if (!clientSignature.signature) {
        setToast({
          message: "Error requesting authentication, please try again",
          type: "error",
        });
        return { success: false };
      }

      const tokenResponse = await commonApiPost<
        ApiLoginRequest,
        ApiLoginResponse
      >({
        endpoint: "auth/login",
        body: {
          server_signature,
          client_signature: clientSignature.signature,
          is_safe_wallet: isSafeWallet,
          client_address: signerAddress,
          ...(role != null && { role }),
        },
      });
      const isPersisted = setAuthJwt(
        signerAddress,
        tokenResponse.token,
        tokenResponse.refresh_token,
        role ?? undefined
      );
      if (!isPersisted) {
        setToast({
          message: "Failed to persist connected profile",
          type: "error",
        });
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      // Handle specific authentication nonce errors with detailed messages
      if (error instanceof InvalidSignerAddressError) {
        setToast({
          message: "Invalid wallet address format",
          type: "error",
        });
      } else if (error instanceof NonceResponseValidationError) {
        setToast({
          message: "Authentication server error, please try again",
          type: "error",
        });
      } else if (error instanceof AuthenticationNonceError) {
        setToast({
          message: "Failed to connect to authentication server",
          type: "error",
        });
      } else {
        // Handle other errors (login API errors, etc.)
        logErrorSecurely("requestSignIn", error);
        setToast({
          message: sanitizeErrorForUser(error),
          type: "error",
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
      message: "Please connect your wallet",
      type: "error",
    });
    return null;
  };

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

  const authenticateAuthorizedWallet = async (
    walletAddress: string
  ): Promise<boolean> => {
    const abortController = new AbortController();
    const operationId = `manual-auth-${Date.now()}`;
    const role = activeProfileProxy
      ? validateRoleForAuthentication(activeProfileProxy)
      : null;

    const { isValid } = await validateJwt({
      jwt: getAuthJwt(),
      wallet: walletAddress,
      role,
      operationId,
      abortSignal: abortController.signal,
      activeProfileProxy,
    });

    if (!isValid) {
      removeAuthJwt();
      const { success } = await requestSignIn({
        signerAddress: walletAddress,
        role,
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
    }

    const isSuccess = !!getAuthJwt();
    if (isSuccess) {
      setShowSignModal(false);
    }

    return isSuccess;
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

    removeAuthJwt();
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
          message: "Invalid profile role state. Please select a valid profile.",
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
          message: "Profile authentication failed. Please select a profile.",
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
  }, [isAddressAuthorized, seizeDisconnect, seizeDisconnectAndLogout]);

  // Computed modal visibility to prevent flickering during rapid state changes
  const shouldShowSignModal = useMemo(() => {
    return (
      showSignModal &&
      authLoadingState !== "validating" &&
      connectionState === "connected"
    );
  }, [showSignModal, authLoadingState, connectionState]);

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
      <ToastContainer />
      {enableWalletAuthentication && (
        <Modal
          show={shouldShowSignModal}
          onHide={() => {
            // Only allow modal dismissal when not actively validating
            if (authLoadingState !== "validating") {
              setShowSignModal(false);
            }
          }}
          backdrop="static"
          keyboard={false}
          centered
          dialogClassName={styles["signModalDialog"] ?? ""}
          contentClassName={styles["signModalSurface"] ?? ""}
        >
          <Modal.Header className={styles["signModalHeader"]}>
            <div className={styles["signModalTitle"]}>
              Sign Authentication Request
            </div>
          </Modal.Header>
          <Modal.Body className={styles["signModalBody"]}>
            <p className={styles["signModalLead"]}>
              To connect your wallet, you will need to sign a message to confirm
              your identity.
            </p>

            <ul className={styles["signModalList"]}>
              <li>
                This signature will be used to generate a secure token (JWT) to
                authenticate your session.
              </li>
              <li>
                Your signature will not cost any gas and is purely for
                authentication purposes.
              </li>
            </ul>
          </Modal.Body>
          <Modal.Footer className={styles["signModalFooter"]}>
            <Button
              variant="link"
              className={styles["signModalCancelButton"]}
              onClick={onCancelSignRequest}
            >
              Cancel
            </Button>
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
          </Modal.Footer>
        </Modal>
      )}
    </AuthContext.Provider>
  );
}
