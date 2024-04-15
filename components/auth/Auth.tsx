import { createContext, useEffect, useState } from "react";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAccount, useSignMessage } from "wagmi";
import {
  getAuthJwt,
  removeAuthJwt,
  setAuthJwt,
} from "../../services/auth/auth.utils";
import { commonApiFetch, commonApiPost } from "../../services/api/common-api";
import jwtDecode from "jwt-decode";
import { UserRejectedRequestError } from "viem";
import {
  IProfileAndConsolidations,
  ProfileConnectedStatus,
} from "../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { getProfileConnectedStatus } from "../../helpers/ProfileHelpers";

type AuthContextType = {
  readonly connectedProfile: IProfileAndConsolidations | null;
  readonly connectionStatus: ProfileConnectedStatus;
  readonly canSeeDrops: boolean;
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly setToast: ({
    message,
    type,
  }: {
    message: string | React.ReactNode;
    type: TypeOptions;
  }) => void;
};

interface NonceResponse {
  readonly nonce: string;
  readonly serverSignature: string;
}

export const AuthContext = createContext<AuthContextType>({
  connectedProfile: null,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  canSeeDrops: false,
  requestAuth: async () => ({ success: false }),
  setToast: () => {},
});

export default function Auth({
  children,
}: {
  readonly children: React.ReactNode;
}) {
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

  useEffect(() => {
    if (!address) {
      return;
    } else {
      const isAuth = validateJwt({ jwt: getAuthJwt(), wallet: address });
      if (!isAuth) removeAuthJwt();
    }
  }, [address]);

  const [canSeeDrops, setCanSeeDrops] = useState<boolean>(false);

  useEffect(() => {
    if (!connectedProfile) {
      setCanSeeDrops(false);
      return;
    }
    setCanSeeDrops(
      (connectedProfile.level >= 16 &&
        connectedProfile.consolidation.tdh >= 30000) ||
        (!!connectedProfile.profile?.handle &&
          ["simo"].includes(connectedProfile.profile.handle.toLowerCase()))
    );
  }, [connectedProfile]);

  const getNonce = async ({
    signerAddress,
  }: {
    signerAddress: string;
  }): Promise<NonceResponse | null> => {
    try {
      return await commonApiFetch<NonceResponse>({
        endpoint: "auth/nonce",
        params: {
          signerAddress,
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
      position: toast.POSITION.TOP_RIGHT,
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
  }: {
    signerAddress: string;
  }) => {
    const nonceResponse = await getNonce({ signerAddress });
    if (!nonceResponse) {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
      return;
    }
    const { nonce, serverSignature } = nonceResponse;
    if (!nonce || !serverSignature) {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
      return;
    }
    const clientSignature = await getSignatureWithRetry({ message: nonce });
    if (clientSignature.userRejected) {
      setToast({
        message: "Authentication rejected",
        type: "error",
      });
      return;
    }

    if (!clientSignature.signature) {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
      return;
    }
    try {
      const tokenResponse = await commonApiPost<
        {
          serverSignature: string;
          clientSignature: string;
        },
        { token: string }
      >({
        endpoint: "auth/login",
        body: {
          serverSignature,
          clientSignature: clientSignature.signature,
        },
      });
      setAuthJwt(tokenResponse.token);
    } catch {
      setToast({
        message: "Error requesting authentication, please try again",
        type: "error",
      });
      return;
    }
  };

  const validateJwt = ({
    jwt,
    wallet,
  }: {
    jwt: string | null;
    wallet: string;
  }): boolean => {
    if (!jwt) return false;
    const decodedJwt = jwtDecode<{
      id: string;
      sub: string;
      iat: number;
      exp: number;
    }>(jwt);
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
    const isAuth = validateJwt({ jwt: getAuthJwt(), wallet: address });
    if (!isAuth) {
      removeAuthJwt();
      await requestSignIn({ signerAddress: address });
    }
    return { success: !!getAuthJwt() };
  };

  return (
    <AuthContext.Provider
      value={{
        requestAuth,
        setToast,
        connectedProfile: connectedProfile ?? null,
        connectionStatus: getProfileConnectedStatus(connectedProfile ?? null),
        canSeeDrops,
      }}
    >
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
}
