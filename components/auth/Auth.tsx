"use client";

import styles from "./Auth.module.scss";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSignMessage } from "wagmi";
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
import { UserRejectedRequestError } from "viem";
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

  const { address, isConnected, seizeDisconnectAndLogout, walletName } =
    useSeizeConnectContext();

  useEffect(() => console.log("walletName", walletName), [walletName]);

  const signMessage = useSignMessage();
  const [showSignModal, setShowSignModal] = useState(false);

  const [connectedProfile, setConnectedProfile] = useState<ApiIdentity>();
  const [fetchingProfile, setFetchingProfile] = useState(false);

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

  function reset() {
    invalidateAll();
    setActiveProfileProxy(null);
    seizeDisconnectAndLogout();
  }

  useEffect(() => {
    if (address) {
      validateJwt({
        jwt: getAuthJwt(),
        wallet: address,
        role: activeProfileProxy?.created_by.id ?? null,
      }).then((isAuth) => {
        if (!isAuth) {
          if (!isConnected) {
            reset();
          } else {
            removeAuthJwt();
            invalidateAll();
            setShowSignModal(true);
          }
        }
      });
    }
  }, [address, activeProfileProxy]);

  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<ApiNonceResponse | null> => {
    try {
      return await commonApiFetch<ApiNonceResponse>({
        endpoint: "auth/nonce",
        params: {
          signer_address: signerAddress,
        },
      });
    } catch {
      return null;
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
      const signedMessage = await signMessage.signMessageAsync({
        message,
      });
      return {
        signature: signedMessage,
        userRejected: false,
      };
    } catch (e) {
      return {
        signature: null,
        userRejected: e instanceof UserRejectedRequestError,
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
    const nonceResponse = await getNonce({ signerAddress });
    if (!nonceResponse) {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
      return { success: false };
    }
    const { nonce, server_signature } = nonceResponse;
    if (!nonce || !server_signature) {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
      return { success: false };
    }
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
    try {
      const tokenResponse = await commonApiPost<
        ApiLoginRequest,
        ApiLoginResponse
      >({
        endpoint: "auth/login",
        body: {
          server_signature,
          client_signature: clientSignature.signature,
          role: role ?? undefined,
          is_safe_wallet: walletName === "Safe{Wallet}",
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
    } catch {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
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

  const validateJwt = async ({
    jwt,
    wallet,
    role,
  }: {
    jwt: string | null;
    wallet: string;
    role: string | null;
  }): Promise<boolean> => {
    const isValid = doJWTValidation({ jwt, wallet, role });

    if (!isValid) {
      const refreshToken = getRefreshToken();
      const walletAddress = getWalletAddress();
      if (!refreshToken || !walletAddress) {
        return false;
      }
      const redeemResponse = await redeemRefreshTokenWithRetries(
        walletAddress,
        refreshToken,
        role
      );
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
          return true;
        }
      }
    }

    return isValid;
  };

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

  async function redeemRefreshTokenWithRetries(
    walletAddress: string,
    refreshToken: string,
    role: string | null,
    retryCount = 3
  ): Promise<ApiRedeemRefreshTokenResponse | null> {
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < retryCount) {
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
        });
        return redeemResponse;
      } catch (err) {
        lastError = err;
      }
    }

    console.error(
      `Refresh token failed after ${retryCount} attempts`,
      lastError
    );
    return null;
  }

  const requestAuth = async (): Promise<{ success: boolean }> => {
    if (!address) {
      setToast({
        message: "Please connect your wallet",
        type: "error",
      });
      invalidateAll();
      return { success: false };
    }
    const isAuth = await validateJwt({
      jwt: getAuthJwt(),
      wallet: address,
      role: activeProfileProxy?.created_by.id ?? null,
    });
    if (!isAuth) {
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
        show={showSignModal}
        onHide={() => setShowSignModal(false)}
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
            disabled={signMessage.isPending}
          >
            {signMessage.isPending ? (
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
