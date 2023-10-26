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
import { IProfile, IProfileAndConsolidations } from "../../entities/IProfile";

export interface IProfileMetaWallet {
  readonly wallet: {
    readonly address: string;
    readonly ens: string | null;
  };
  readonly displayName: string;
  readonly tdh: number;
}

export interface IProfileWithMeta {
  readonly profile: IProfile | null;
  readonly consolidation: {
    readonly wallets: IProfileMetaWallet[];
    readonly tdh: number;
  };
}

type AuthContextType = {
  profile: IProfileWithMeta | null;
  loadingProfile: boolean;
  updateProfile: () => Promise<void>;
  requestAuth: () => Promise<{ success: boolean }>;
  setToast: ({ message, type }: { message: string; type: TypeOptions }) => void;
};

interface NonceResponse {
  readonly nonce: string;
  readonly serverSignature: string;
}

export const AuthContext = createContext<AuthContextType>({
  profile: null,
  loadingProfile: false,
  updateProfile: async () => {},
  requestAuth: async () => ({ success: false }),
  setToast: () => {},
});

export default function Auth({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const signMessage = useSignMessage();

  const [profile, setProfile] = useState<IProfileWithMeta | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!address) removeAuthJwt();
    else {
      const isAuth = validateJwt({ jwt: getAuthJwt(), wallet: address });
      if (!isAuth) removeAuthJwt();
    }
  }, [address]);

  const mapApiResponseToUser = (
    response: IProfileAndConsolidations
  ): IProfileWithMeta => {
    return {
      ...response,
      consolidation: {
        ...response.consolidation,
        wallets: response.consolidation.wallets.map((w) => ({
          ...w,
          wallet: {
            ...w.wallet,
            address: w.wallet.address.toLowerCase(),
            ens: w.wallet.ens ?? null,
          },
          displayName: w.wallet.ens ?? w.wallet.address.toLowerCase(),
        })),
      },
    };
  };

  const getProfile = async () => {
    if (!address) {
      setProfile(null);
      return;
    }
    setLoadingProfile(true);
    try {
      const response = await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      });
      setProfile(mapApiResponseToUser(response));
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, [address]);

  const updateProfile = async () => await getProfile();

  const getNonce = async (): Promise<NonceResponse | null> => {
    try {
      return await commonApiFetch<NonceResponse>({
        endpoint: "auth/nonce",
      });
    } catch {
      return null;
    }
  };

  const setToast = ({
    message,
    type,
  }: {
    message: string;
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

  const requestSignIn = async () => {
    const nonceResponse = await getNonce();
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
    // TODO: check if token is expired and is signed by the server
    return decodedJwt.sub.toLowerCase() === wallet.toLowerCase();
  };

  const requestAuth = async (): Promise<{ success: boolean }> => {
    if (!address) {
      removeAuthJwt();
      setToast({
        message: "Please connect your wallet",
        type: "error",
      });
      return { success: false };
    }
    const isAuth = validateJwt({ jwt: getAuthJwt(), wallet: address });
    if (!isAuth) {
      removeAuthJwt();
      await requestSignIn();
    }
    return { success: !!getAuthJwt() };
  };
  return (
    <>
      <AuthContext.Provider
        value={{ requestAuth, setToast, profile, loadingProfile, updateProfile }}
      >
        {children}
        <ToastContainer />
      </AuthContext.Provider>
    </>
  );
}
