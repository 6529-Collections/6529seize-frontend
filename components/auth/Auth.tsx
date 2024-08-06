import { createContext, useContext, useEffect, useState } from "react";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAccount, useSignMessage } from "wagmi";
import {
  getAuthJwt,
  removeAuthJwt,
  setAuthJwt,
} from "../../services/auth/auth.utils";
import { commonApiFetch, commonApiPost } from "../../services/api/common-api";
import { jwtDecode } from "jwt-decode";
import { UserRejectedRequestError } from "viem";
import {
  IProfileAndConsolidations,
  ProfileConnectedStatus,
} from "../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../react-query-wrapper/ReactQueryWrapper";
import { getProfileConnectedStatus } from "../../helpers/ProfileHelpers";
import { NonceResponse } from "../../generated/models/NonceResponse";
import { LoginRequest } from "../../generated/models/LoginRequest";
import { LoginResponse } from "../../generated/models/LoginResponse";
import { ProfileProxy } from "../../generated/models/ProfileProxy";
import { groupProfileProxies } from "../../helpers/profile-proxy.helpers";

type AuthContextType = {
  readonly connectedProfile: IProfileAndConsolidations | null;
  readonly connectionStatus: ProfileConnectedStatus;
  readonly receivedProfileProxies: ProfileProxy[];
  readonly activeProfileProxy: ProfileProxy | null;
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
    profileProxy: ProfileProxy | null
  ) => Promise<void>;
};

export const WAVES_MIN_ACCESS_LEVEL = 20;

export const AuthContext = createContext<AuthContextType>({
  connectedProfile: null,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  showWaves: false,
  requestAuth: async () => ({ success: false }),
  setToast: () => {},
  setActiveProfileProxy: async () => {},
});

export default function Auth({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { invalidateAll } = useContext(ReactQueryWrapperContext);
  const { address } = useAccount();

  const signMessage = useSignMessage();

  const { data: connectedProfile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, address?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      }),
    enabled: !!address,
  });

  const { data: profileProxies } = useQuery<ProfileProxy[]>({
    queryKey: [
      QueryKey.PROFILE_PROFILE_PROXIES,
      { handleOrWallet: connectedProfile?.input_identity },
    ],
    queryFn: async () =>
      await commonApiFetch<ProfileProxy[]>({
        endpoint: `profiles/${connectedProfile?.input_identity}/proxies/`,
      }),
    enabled: !!connectedProfile?.input_identity,
  });

  const [receivedProfileProxies, setReceivedProfileProxies] = useState<
    ProfileProxy[]
  >(
    groupProfileProxies({
      profileProxies: profileProxies ?? [],
      onlyActive: true,
      profileId: connectedProfile?.profile?.external_id ?? null,
    }).received
  );

  const [activeProfileProxy, setActiveProfileProxy] =
    useState<ProfileProxy | null>(null);

  useEffect(() => {
    const receivedProxies = groupProfileProxies({
      profileProxies: profileProxies ?? [],
      onlyActive: true,
      profileId: connectedProfile?.profile?.external_id ?? null,
    }).received;
    setReceivedProfileProxies(receivedProxies);
    const role = getRole({ jwt: getAuthJwt() });
    if (role) {
      const activeProxy = receivedProxies?.find(
        (proxy) => proxy.created_by.id === role
      );

      setActiveProfileProxy(activeProxy ?? null);
    }
  }, [profileProxies, connectedProfile]);

  useEffect(() => {
    if (!address) {
      removeAuthJwt();
      invalidateAll();
      setActiveProfileProxy(null);

      return;
    } else {
      const isAuth = validateJwt({
        jwt: getAuthJwt(),
        wallet: address,
        role: activeProfileProxy?.created_by.id ?? null,
      });
      if (!isAuth) {
        removeAuthJwt();
        setActiveProfileProxy(null);
        requestAuth();
        invalidateAll();
      }
    }
  }, [address, activeProfileProxy]);

  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<NonceResponse | null> => {
    try {
      return await commonApiFetch<NonceResponse>({
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

  const getSignatureWithRetry = async ({
    message,
  }: {
    message: string;
  }): Promise<{
    signature: string | null;
    userRejected: boolean;
  }> => {
    const maxRetries = 3;
    let retryCount = 0;
    const delayMS = 1000;

    while (retryCount < maxRetries) {
      const signature = await getSignature({ message });
      if (signature.signature || signature.userRejected) return signature;
      retryCount++;
      await new Promise((r) => setTimeout(r, delayMS));
    }
    return {
      signature: null,
      userRejected: false,
    };
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
    const clientSignature = await getSignatureWithRetry({ message: nonce });
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
      const tokenResponse = await commonApiPost<LoginRequest, LoginResponse>({
        endpoint: "auth/login",
        body: {
          server_signature,
          client_signature: clientSignature.signature,
          role: role ?? undefined,
        },
      });
      setAuthJwt(tokenResponse.token);
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

  const validateJwt = ({
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

  const requestAuth = async (): Promise<{ success: boolean }> => {
    if (!address) {
      setToast({
        message: "Please connect your wallet",
        type: "error",
      });
      return { success: false };
    }
    const isAuth = validateJwt({
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
    }
    return { success: !!getAuthJwt() };
  };

  const onActiveProfileProxy = async (
    profileProxy: ProfileProxy | null
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
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (connectedProfile.level < WAVES_MIN_ACCESS_LEVEL) {
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
    </AuthContext.Provider>
  );
}
