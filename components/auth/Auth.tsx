"use client";

import styles from "./Auth.module.scss";
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAppKit } from "@reown/appkit/react";
import { useSecureSign, MobileSigningError, ConnectionMismatchError, SigningProviderError } from "../../hooks/useSecureSign";
import { useMobileWalletConnection } from "../../hooks/useMobileWalletConnection";
import {
  getAuthJwt,
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  removeAuthJwt,
  setAuthJwt,
} from "../../services/auth/auth.utils";
import { commonApiFetch, commonApiPost } from "../../services/api/common-api";
import { jwtDecode } from "jwt-decode";
import { ProfileConnectedStatus } from "../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import { getProfileConnectedStatus } from "../../helpers/ProfileHelpers";
import { ApiNonceResponse } from "../../generated/models/ApiNonceResponse";
import { ApiLoginRequest } from "../../generated/models/ApiLoginRequest";
import { ApiLoginResponse } from "../../generated/models/ApiLoginResponse";
import { ApiProfileProxy } from "../../generated/models/ApiProfileProxy";
import { groupProfileProxies } from "../../helpers/profile-proxy.helpers";
import { Modal, Button } from "react-bootstrap";
import DotLoader from "../dotLoader/DotLoader";
import { useSeizeConnectContext } from "./SeizeConnectContext";
import { ApiRedeemRefreshTokenRequest } from "../../generated/models/ApiRedeemRefreshTokenRequest";
import { ApiRedeemRefreshTokenResponse } from "../../generated/models/ApiRedeemRefreshTokenResponse";
import { areEqualAddresses } from "../../helpers/Helpers";
import { ApiIdentity } from "../../generated/models/ApiIdentity";
import { sanitizeErrorForUser, logErrorSecurely } from "../../utils/error-sanitizer";

// Custom error classes for authentication failures
class AuthenticationNonceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AuthenticationNonceError';
  }
}

class InvalidSignerAddressError extends Error {
  constructor(signerAddress: string) {
    super(`Invalid signer address: ${signerAddress}`);
    this.name = 'InvalidSignerAddressError';
  }
}

class NonceResponseValidationError extends Error {
  constructor(message: string, public readonly response?: unknown) {
    super(message);
    this.name = 'NonceResponseValidationError';
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
}: {
  readonly children: React.ReactNode;
}) {
  const { invalidateAll } = useContext(ReactQueryWrapperContext);

  const { address, isConnected, seizeDisconnectAndLogout, isSafeWallet, connectionState } =
    useSeizeConnectContext();

  const { open } = useAppKit();
  const { signMessage, isSigningPending, reset: resetSigning } = useSecureSign();
  const { mobileInfo, getMobileInstructions } = useMobileWalletConnection();
  const [showSignModal, setShowSignModal] = useState(false);

  const [connectedProfile, setConnectedProfile] = useState<ApiIdentity>();
  const [fetchingProfile, setFetchingProfile] = useState(false);
  
  // Race condition prevention: AbortController and operation tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [authLoadingState, setAuthLoadingState] = useState<'idle' | 'validating' | 'signing'>('idle');
  
  // Centralized abort mechanism for cancelling in-flight operations
  const abortCurrentAuthOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
    setAuthLoadingState('idle');
  }, []);

  useEffect(() => {
    if (address) {
      setFetchingProfile(true);
      commonApiFetch<ApiIdentity>({
        endpoint: `identities/${address}`,
      })
        .then((profile) => {
          setConnectedProfile(profile);
        })
        .finally(() => {
          setFetchingProfile(false);
        });
    } else {
      setConnectedProfile(undefined);
    }
  }, [address]);

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

  useEffect(() => {
    const role = getRole({ jwt: getAuthJwt() });

    if (role) {
      const activeProxy = receivedProfileProxies?.find(
        (proxy) => proxy.created_by.id === role
      );

      setActiveProfileProxy(activeProxy ?? null);
    }
  }, [receivedProfileProxies]);

  const reset = useCallback(() => {
    invalidateAll();
    setActiveProfileProxy(null);
    seizeDisconnectAndLogout();
  }, [invalidateAll, seizeDisconnectAndLogout]);

  // Helper function for JWT validation
  const doJWTValidation = ({
    jwt,
    wallet,
    role,
  }: {
    jwt: string | null;
    wallet: string;
    role: string | null;
  }): boolean => {
    if (!jwt) return false;
    const decodedJwt = jwtDecode<{
      id: string;
      sub: string;
      iat: number;
      exp: number;
      role: string;
    }>(jwt);
    if (role && decodedJwt.role !== role) return false;
    return (
      decodedJwt.sub.toLowerCase() === wallet.toLowerCase() &&
      decodedJwt.exp > Date.now() / 1000
    );
  };

  // Helper function for redeeming refresh token with retries
  async function redeemRefreshTokenWithRetries(
    walletAddress: string,
    refreshToken: string,
    role: string | null,
    retryCount = 3,
    abortSignal?: AbortSignal
  ): Promise<ApiRedeemRefreshTokenResponse | null> {
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < retryCount && !abortSignal?.aborted) {
      attempt++;
      try {
        const redeemResponse = await commonApiPost<
          ApiRedeemRefreshTokenRequest,
          ApiRedeemRefreshTokenResponse
        >({
          endpoint: "auth/redeem-refresh-token",
          body: {
            address: walletAddress,
            token: refreshToken,
            role: role ?? undefined,
          },
          // TODO: Pass abortSignal when API layer supports it
          // abortSignal
        });
        return redeemResponse;
      } catch (err: any) {
        if (err.name === 'AbortError' || abortSignal?.aborted) {
          return null; // Request was cancelled
        }
        lastError = err;
      }
    }

    // Refresh token failed after retries
    return null;
  }

  // Main JWT validation function with cancellation support
  const validateJwt = useCallback(async ({
    jwt,
    wallet,
    role,
    operationId,
    abortSignal,
  }: {
    jwt: string | null;
    wallet: string;
    role: string | null;
    operationId: string;
    abortSignal: AbortSignal;
  }): Promise<{ isValid: boolean; wasCancelled: boolean }> => {
    // Check if already aborted
    if (abortSignal.aborted) {
      return { isValid: false, wasCancelled: true };
    }

    const isValid = doJWTValidation({ jwt, wallet, role });

    if (!isValid) {
      const refreshToken = getRefreshToken();
      const walletAddress = getWalletAddress();
      
      // Check for cancellation before proceeding
      if (!refreshToken || !walletAddress || abortSignal.aborted) {
        return { isValid: false, wasCancelled: abortSignal.aborted };
      }
      
      try {
        const redeemResponse = await redeemRefreshTokenWithRetries(
          walletAddress,
          refreshToken,
          role,
          3,
          abortSignal
        );
        
        // Check if operation was cancelled before processing response
        if (abortSignal.aborted) {
          return { isValid: false, wasCancelled: true };
        }
        
        // Operation ID check removed - rely on AbortSignal for cancellation
        
        if (redeemResponse && areEqualAddresses(redeemResponse.address, wallet)) {
          const walletRole = getWalletRole();
          const tokenRole = getRole({ jwt });
          if (
            (walletRole && tokenRole && tokenRole === walletRole) ||
            (!walletRole && !tokenRole)
          ) {
            setAuthJwt(
              redeemResponse.address,
              redeemResponse.token,
              refreshToken,
              walletRole ?? undefined
            );
            return { isValid: true, wasCancelled: false };
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return { isValid: false, wasCancelled: true };
        }
        // Re-throw other errors
        throw error;
      }
    }

    return { isValid, wasCancelled: false };
  }, []);

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

  // Debounced authentication effect with cancellation support
  useEffect(() => {
    // Clear previous operations when dependencies change
    abortCurrentAuthOperation();
    
    // Don't start validation during transitional states
    if (connectionState === 'connecting') {
      return;
    }
    
    if (!address || connectionState !== 'connected') {
      setShowSignModal(false);
      return;
    }
    
    // Generate unique operation ID for this validation attempt
    const operationId = `auth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Debounce validation to prevent race conditions (500ms delay)
    authTimeoutRef.current = setTimeout(async () => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setAuthLoadingState('validating');
      
      try {
        const { isValid, wasCancelled } = await validateJwt({
          jwt: getAuthJwt(),
          wallet: address,
          role: activeProfileProxy?.created_by.id ?? null,
          operationId,
          abortSignal: abortController.signal
        });
        
        // Only process result if operation wasn't cancelled
        if (!wasCancelled) {
          if (!isValid) {
            if (!isConnected) {
              reset();
            } else {
              removeAuthJwt();
              invalidateAll();
              setShowSignModal(true);
            }
          }
        }
      } catch (error) {
        // Handle validation errors only if not cancelled
        if (!abortController.signal.aborted) {
          logErrorSecurely('validateJwt', error);
          // Show sign modal on error if still connected
          if (isConnected) {
            setShowSignModal(true);
          }
        }
      } finally {
        // Clean up
        if (!abortController.signal.aborted) {
          abortControllerRef.current = null;
          setAuthLoadingState('idle');
        }
      }
    }, 500); // 500ms debounce to handle rapid address changes
    
    // Cleanup function for this effect
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, [address, activeProfileProxy, connectionState, isConnected, validateJwt, abortCurrentAuthOperation, invalidateAll, reset]);

  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<ApiNonceResponse> => {
    // Input validation - fail fast on invalid input
    if (!signerAddress || typeof signerAddress !== 'string') {
      throw new InvalidSignerAddressError(signerAddress);
    }
    
    // Validate address format (basic Ethereum address check)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(signerAddress)) {
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
        throw new NonceResponseValidationError('Nonce API returned null or undefined response');
      }

      if (!response.nonce || typeof response.nonce !== 'string' || response.nonce.trim().length === 0) {
        throw new NonceResponseValidationError('Invalid nonce in API response', response);
      }

      if (!response.server_signature || typeof response.server_signature !== 'string' || response.server_signature.trim().length === 0) {
        throw new NonceResponseValidationError('Invalid server_signature in API response', response);
      }

      // Return valid response - FAIL-FAST: Only returns valid data or throws
      return response;
    } catch (error) {
      // Re-throw our custom errors without modification
      if (error instanceof NonceResponseValidationError || error instanceof InvalidSignerAddressError) {
        throw error;
      }
      
      // Wrap API/network errors in our custom error type
      throw new AuthenticationNonceError(
        'Failed to obtain authentication nonce from server',
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
            message: "Wallet address mismatch. Please disconnect and reconnect your wallet.",
            type: "error",
          });
        } else if (result.error instanceof SigningProviderError) {
          setToast({
            message: "Wallet provider error. Please reconnect your wallet and try again.",
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
      logErrorSecurely('getSignature', error);
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
          role: role ?? undefined,
          is_safe_wallet: isSafeWallet,
          client_address: signerAddress,
        },
      });
      setAuthJwt(
        signerAddress,
        tokenResponse.token,
        tokenResponse.refresh_token,
        role ?? undefined
      );
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
        logErrorSecurely('requestSignIn', error);
        setToast({
          message: sanitizeErrorForUser(error),
          type: "error",
        });
      }
      return { success: false };
    }
  };

  const getRole = ({ jwt }: { jwt: string | null }): string | null => {
    if (!jwt) return null;
    const decodedJwt = jwtDecode<{
      id: string;
      sub: string;
      iat: number;
      exp: number;
      role: string;
    }>(jwt);

    return decodedJwt.role;
  };

  // These functions have been moved above to fix initialization order

  const requestAuth = async (): Promise<{ success: boolean }> => {
    if (!address) {
      setToast({
        message: "Please connect your wallet",
        type: "error",
      });
      invalidateAll();
      return { success: false };
    }
    
    // Set loading state for signing
    setAuthLoadingState('signing');
    
    try {
      // Create a new abort controller for this auth request
      const abortController = new AbortController();
      const operationId = `manual-auth-${Date.now()}`;
      
      const { isValid } = await validateJwt({
        jwt: getAuthJwt(),
        wallet: address,
        role: activeProfileProxy?.created_by.id ?? null,
        operationId,
        abortSignal: abortController.signal
      });
      
      if (!isValid) {
        removeAuthJwt();
        await requestSignIn({
          signerAddress: address,
          role: activeProfileProxy?.created_by.id ?? null,
        });
        invalidateAll();
      }
      
      const isSuccess = !!getAuthJwt();
      if (isSuccess) {
        setShowSignModal(false);
      }
      return { success: isSuccess };
    } finally {
      setAuthLoadingState('idle');
    }
  };

  const onActiveProfileProxy = async (
    profileProxy: ApiProfileProxy | null
  ): Promise<void> => {
    removeAuthJwt();
    if (!address) {
      setActiveProfileProxy(null);
      return;
    }

    const { success } = await requestSignIn({
      signerAddress: address,
      role: profileProxy?.created_by.id ?? null,
    });
    if (success) {
      setActiveProfileProxy(profileProxy);
    }
  };

  const getShowWaves = (): boolean => {
    if (!connectedProfile?.handle) {
      return false;
    }

    if (activeProfileProxy) {
      return false;
    }

    if (!address) {
      return false;
    }
    return true;
  };

  const [showWaves, setShowWaves] = useState(getShowWaves());

  useEffect(() => {
    setShowWaves(getShowWaves());
  }, [connectedProfile, activeProfileProxy, address]);
  
  // Computed modal visibility to prevent flickering during rapid state changes
  const shouldShowSignModal = useMemo(() => {
    return showSignModal && 
           authLoadingState !== 'validating' && 
           connectionState === 'connected';
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
      <Modal
        show={shouldShowSignModal}
        onHide={() => {
          // Only allow modal dismissal when not actively validating
          if (authLoadingState !== 'validating') {
            setShowSignModal(false);
          }
        }}
        backdrop="static"
        keyboard={false}
        centered
      >
        <div className={styles.signModalHeader}>
          <Modal.Title>Sign Authentication Request</Modal.Title>
        </div>
        <Modal.Body className={styles.signModalContent}>
          <p className="mt-2 mb-2">
            To connect your wallet, you will need to sign a message to confirm
            your identity.
          </p>
          
          {mobileInfo.isMobile && (
            <div className="mb-3 p-2 bg-info text-dark rounded">
              <small>
                <strong>Mobile Instructions:</strong><br />
                {getMobileInstructions()}
                {mobileInfo.isInAppBrowser && (
                  <><br /><em>Note: You're using an in-app browser. For best results, open this page in your device's default browser.</em></>
                )}
              </small>
            </div>
          )}
          
          <ul className="font-lighter">
            <li className="mt-1 mb-1">
              This signature will be used to generate a secure token (JWT) to
              authenticate your session.
            </li>
            <li className="mt-1 mb-1">
              Your signature will not cost any gas and is purely for
              authentication purposes.
            </li>
            {mobileInfo.isMobile && (
              <li className="mt-1 mb-1">
                <em>The signing request will open in your wallet app. Please approve it and return to this page.</em>
              </li>
            )}
          </ul>
        </Modal.Body>
        <Modal.Footer className={styles.signModalContent}>
          <Button
            variant="danger"
            onClick={() => {
              setShowSignModal(false);
              seizeDisconnectAndLogout();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => requestAuth()}
            disabled={isSigningPending}
          >
            {isSigningPending ? (
              <>
                {mobileInfo.isMobile ? "Check your wallet app" : "Confirm in your wallet"} <DotLoader />
              </>
            ) : (
              mobileInfo.isMobile ? "Sign in Wallet App" : "Sign"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AuthContext.Provider>
  );
}
