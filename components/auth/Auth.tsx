"use client";

import styles from "./Auth.module.scss";
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSecureSign, MobileSigningError, ConnectionMismatchError, SigningProviderError } from "../../hooks/useSecureSign";
import { useMobileWalletConnection } from "../../hooks/useMobileWalletConnection";
import {
  getAuthJwt,
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  removeAuthJwt,
  setAuthJwt,
  syncWalletRoleWithServer,
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
import { validateRoleForAuthentication } from "../../utils/role-validation";
import {
  TokenRefreshError,
  TokenRefreshCancelledError,
  TokenRefreshNetworkError,
  TokenRefreshServerError,
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError
} from "../../errors/authentication";

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
  setToast: () => { },
  setActiveProfileProxy: async () => { },
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

  const { signMessage, isSigningPending, reset: resetSigning } = useSecureSign();
  const { mobileInfo, getMobileInstructions } = useMobileWalletConnection();
  const [showSignModal, setShowSignModal] = useState(false);

  const [connectedProfile, setConnectedProfile] = useState<ApiIdentity>();
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Race condition prevention: AbortController and operation tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const [authLoadingState, setAuthLoadingState] = useState<'idle' | 'validating' | 'signing'>('idle');

  // Centralized abort mechanism for cancelling in-flight operations
  const abortCurrentAuthOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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

  // Helper function for redeeming refresh token with retries - FAIL-FAST VERSION
  async function redeemRefreshTokenWithRetries(
    walletAddress: string,
    refreshToken: string,
    role: string | null,
    retryCount = 3,
    abortSignal?: AbortSignal
  ): Promise<ApiRedeemRefreshTokenResponse> {
    // Input validation - fail fast on invalid parameters
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new TokenRefreshError('Invalid walletAddress: must be non-empty string');
    }
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new TokenRefreshError('Invalid refreshToken: must be non-empty string');
    }
    if (retryCount < 1 || retryCount > 10) {
      throw new TokenRefreshError('Invalid retryCount: must be between 1 and 10');
    }

    // Check for cancellation upfront
    if (abortSignal?.aborted) {
      throw new TokenRefreshCancelledError('Operation cancelled before starting');
    }

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < retryCount) {
      attempt++;

      // Check for cancellation before each attempt
      if (abortSignal?.aborted) {
        throw new TokenRefreshCancelledError(`Operation cancelled on attempt ${attempt}`);
      }

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

        // Response validation - fail fast on invalid response
        if (!redeemResponse) {
          throw new TokenRefreshServerError(
            'Server returned null/undefined response',
            undefined,
            redeemResponse
          );
        }

        if (!redeemResponse.token || typeof redeemResponse.token !== 'string') {
          throw new TokenRefreshServerError(
            'Server returned invalid token',
            undefined,
            redeemResponse
          );
        }

        if (!redeemResponse.address || typeof redeemResponse.address !== 'string') {
          throw new TokenRefreshServerError(
            'Server returned invalid address',
            undefined,
            redeemResponse
          );
        }

        // Success - return valid response
        return redeemResponse;
      } catch (err: any) {
        // Handle cancellation errors immediately
        if (err.name === 'AbortError' || abortSignal?.aborted) {
          throw new TokenRefreshCancelledError(
            `Operation cancelled during attempt ${attempt}`
          );
        }

        // If this is already one of our error types, just track it
        if (err instanceof TokenRefreshError) {
          lastError = err;
        } else {
          // Classify the error based on its characteristics
          if (err?.code === 'NETWORK_ERROR' ||
            err?.code === 'ENOTFOUND' ||
            err?.code === 'ECONNREFUSED' ||
            err?.code === 'ETIMEDOUT') {
            lastError = new TokenRefreshNetworkError(
              `Network error on attempt ${attempt}: ${err.message}`,
              err
            );
          } else if (err?.status >= 400 && err?.status < 600) {
            lastError = new TokenRefreshServerError(
              `Server error ${err.status} on attempt ${attempt}: ${err.message}`,
              err.status,
              err.response,
              err
            );
          } else {
            lastError = new TokenRefreshError(
              `Unknown error on attempt ${attempt}: ${err.message}`,
              err
            );
          }
        }

        // If this was the last attempt, throw the error
        if (attempt >= retryCount) {
          throw lastError;
        }

        // Otherwise continue to next attempt
      }
    }

    // This should never be reached due to the throw in the catch block,
    // but TypeScript requires it for exhaustiveness
    throw lastError || new TokenRefreshError('All retry attempts failed');
  }

  // Main JWT validation function with cancellation support - FAIL-FAST VERSION
  const validateJwt = async ({
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
    // Input validation - fail fast on invalid parameters
    if (!wallet || typeof wallet !== 'string') {
      throw new Error('Invalid wallet address: must be non-empty string');
    }
    if (!operationId || typeof operationId !== 'string') {
      throw new Error('Invalid operationId: must be non-empty string');
    }

    // Check if already aborted
    if (abortSignal.aborted) {
      return { isValid: false, wasCancelled: true };
    }

    const isValid = doJWTValidation({ jwt, wallet, role });

    if (!isValid) {
      const refreshToken = getRefreshToken();
      const walletAddress = getWalletAddress();

      // If there's no refresh token, this is a first-time sign-in scenario
      // Return false to trigger the sign modal, don't throw an error
      if (!refreshToken) {
        return { isValid: false, wasCancelled: false };
      }

      // If we have a refresh token but no wallet address, that's an error
      if (!walletAddress) {
        throw new Error('No wallet address available for JWT renewal');
      }

      // Check for cancellation before proceeding
      if (abortSignal.aborted) {
        return { isValid: false, wasCancelled: true };
      }

      try {
        const redeemResponse = await redeemRefreshTokenWithRetries(
          walletAddress,
          refreshToken,
          role,
          3,
          abortSignal
        );

        // Check if operation was cancelled during token refresh
        if (abortSignal.aborted) {
          return { isValid: false, wasCancelled: true };
        }

        // Validate response data - fail fast on invalid response
        if (!areEqualAddresses(redeemResponse.address, wallet)) {
          throw new Error(
            `Address mismatch in token response: expected ${wallet}, got ${redeemResponse.address}`
          );
        }

        const walletRole = getWalletRole();
        // CRITICAL FIX: Get role from the NEW token, not the old one  
        const freshTokenRole = getRole({ jwt: redeemResponse.token });

        // CRITICAL FIX: FAIL-FAST validation with NO optional chaining
        // The server is the source of truth for roles, not local storage
        if (role && freshTokenRole !== role) {
          // If we specifically requested a role, ensure server provided it
          throw new RoleValidationError(role, freshTokenRole);
        }

        // ADDITIONAL VALIDATION: Ensure role consistency with what was requested
        // FAIL-FAST: NO optional chaining - if activeProfileProxy is null, this MUST fail
        if (activeProfileProxy === null || activeProfileProxy === undefined) {
          // If we're doing role-based authentication but have no active profile proxy,
          // this is a critical state inconsistency that must fail immediately
          throw new MissingActiveProfileError();
        }

        // FAIL-FAST: Direct property access - will throw if structure is invalid
        const requestedRole = activeProfileProxy.created_by.id;

        // Validate that requestedRole is not null/undefined/empty
        if (!requestedRole || typeof requestedRole !== 'string' || requestedRole.trim().length === 0) {
          throw new AuthenticationRoleError(
            'Active profile proxy has invalid created_by.id - role validation cannot proceed'
          );
        }

        // Now perform the role comparison with guaranteed non-null values
        if (freshTokenRole !== requestedRole) {
          throw new RoleValidationError(requestedRole, freshTokenRole);
        }

        // UPDATE LOCAL STORAGE: Sync local wallet role with server response
        // The server response is authoritative - update local storage to match
        if (walletRole !== freshTokenRole) {
          // Log the role change for security monitoring
          logErrorSecurely('JWT_ROLE_UPDATE', {
            message: `Updating local wallet role from ${walletRole} to ${freshTokenRole}`,
            oldRole: walletRole,
            newRole: freshTokenRole,
            address: redeemResponse.address
          });
        }

        // Success - store the new JWT with the SERVER-PROVIDED role (not local role)
        setAuthJwt(
          redeemResponse.address,
          redeemResponse.token,
          refreshToken,
          freshTokenRole ?? undefined  // ✅ USE SERVER ROLE, NOT LOCAL ROLE
        );

        // Sync local wallet role with server role
        syncWalletRoleWithServer(freshTokenRole, redeemResponse.address);
        return { isValid: true, wasCancelled: false };
      } catch (error: any) {
        // Handle cancellation errors
        if (error instanceof TokenRefreshCancelledError || error.name === 'AbortError') {
          return { isValid: false, wasCancelled: true };
        }
        // Re-throw all other errors (including TokenRefreshError subclasses)
        throw error;
      }
    }

    return { isValid, wasCancelled: false };
  };

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

  // Immediate authentication effect with race condition prevention
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

    // Capture current address at validation time to prevent race conditions
    const currentAddress = address;

    // Generate unique operation ID for this validation attempt
    const operationId = `auth-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // IMMEDIATE validation - no setTimeout to prevent timing window vulnerability
    const validateImmediately = async () => {
      // Address consistency check - ensure address hasn't changed since effect start
      if (currentAddress !== address) {
        // Address changed during setup - abort this operation
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setAuthLoadingState('validating');

      try {
        // Pre-validation address check - fail fast if address changed
        if (abortController.signal.aborted || currentAddress !== address) {
          return;
        }

        const { isValid, wasCancelled } = await validateJwt({
          jwt: getAuthJwt(),
          wallet: currentAddress, // Use captured address, not current state
          role: activeProfileProxy ? validateRoleForAuthentication(activeProfileProxy) : null,
          operationId,
          abortSignal: abortController.signal
        });

        // Post-validation address check - ensure address is still consistent
        if (abortController.signal.aborted || currentAddress !== address) {
          return;
        }

        // Only process result if operation wasn't cancelled and address is still valid
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
        // Handle validation errors only if not cancelled and address hasn't changed
        if (!abortController.signal.aborted && currentAddress === address) {
          // Handle specific authentication role errors
          if (error instanceof MissingActiveProfileError ||
            error instanceof RoleValidationError ||
            error instanceof AuthenticationRoleError ||
            error instanceof InvalidRoleStateError) {
            // These are critical authentication failures - log and force re-authentication
            logErrorSecurely('validateJwt_role_error', error);
            // Force user to re-authenticate with proper role
            removeAuthJwt();
            invalidateAll();
            setShowSignModal(true);
          } else {
            // Handle other validation errors
            logErrorSecurely('validateJwt_general_error', error);
          }

          // Show sign modal on error if still connected
          if (isConnected) {
            setShowSignModal(true);
          }
        }
      } finally {
        // Clean up only if this is still the current operation
        if (!abortController.signal.aborted && currentAddress === address) {
          abortControllerRef.current = null;
          setAuthLoadingState('idle');
        }
      }
    };

    validateImmediately();

    // No cleanup needed - immediate execution prevents stale timeouts
  }, [address, activeProfileProxy, connectionState, isConnected, abortCurrentAuthOperation, invalidateAll, reset]);

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
        role: activeProfileProxy ? validateRoleForAuthentication(activeProfileProxy) : null,
        operationId,
        abortSignal: abortController.signal
      });

      if (!isValid) {
        removeAuthJwt();
        await requestSignIn({
          signerAddress: address,
          role: activeProfileProxy ? validateRoleForAuthentication(activeProfileProxy) : null,
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

    try {
      const { success } = await requestSignIn({
        signerAddress: address,
        role: profileProxy ? validateRoleForAuthentication(profileProxy) : null,
      });
      if (success) {
        setActiveProfileProxy(profileProxy);
      }
    } catch (error) {
      // Handle InvalidRoleStateError specifically
      if (error instanceof InvalidRoleStateError) {
        logErrorSecurely('onActiveProfileProxy_invalid_role_state', error);
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
        logErrorSecurely('onActiveProfileProxy_missing_profile', error);
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


          <ul className="font-lighter">
            <li className="mt-1 mb-1">
              This signature will be used to generate a secure token (JWT) to
              authenticate your session.
            </li>
            <li className="mt-1 mb-1">
              Your signature will not cost any gas and is purely for
              authentication purposes.
            </li>
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
                Confirm in your wallet <DotLoader />
              </>
            ) : (
              "Sign"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AuthContext.Provider>
  );
}
