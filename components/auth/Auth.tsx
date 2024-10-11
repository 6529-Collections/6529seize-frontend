import styles from "./Auth.module.scss";
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
import { Modal, Button } from "react-bootstrap";
import DotLoader from "../dotLoader/DotLoader";
import { useSeizeConnect } from "../../hooks/useSeizeConnect";

export enum TitleType {
  PAGE = "PAGE",
  WAVE = "WAVE",
  MY_STREAM = "MY_STREAM",
  NOTIFICATION = "NOTIFICATION",
}

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
  readonly setTitle: (param: {
    title: string | null;
    type?: TitleType;
  }) => void;
  readonly title: string;
};
// change back to 10
export const WAVES_MIN_ACCESS_LEVEL = 0;
const DEFAULT_TITLE = "6529 SEIZE";

export const AuthContext = createContext<AuthContextType>({
  connectedProfile: null,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  showWaves: false,
  requestAuth: async () => ({ success: false }),
  setToast: () => {},
  setActiveProfileProxy: async () => {},
  setTitle: () => {},
  title: DEFAULT_TITLE,
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
  const { address } = useAccount();

  const { seizeDisconnect } = useSeizeConnect();

  const signMessage = useSignMessage();
  const [showSignModal, setShowSignModal] = useState(false);

  const [connectedProfile, setConnectedProfile] =
    useState<IProfileAndConsolidations>();

  useEffect(() => {
    if (address && getAuthJwt()) {
      commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      }).then((profile) => {
        setConnectedProfile(profile);
      });
    } else {
      setConnectedProfile(undefined);
    }
  }, [address, getAuthJwt()]);

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

  function reset() {
    removeAuthJwt();
    invalidateAll();
    setActiveProfileProxy(null);
  }

  useEffect(() => {
    if (!address) {
      reset();
      return;
    } else {
      const isAuth = validateJwt({
        jwt: getAuthJwt(),
        wallet: address,
        role: activeProfileProxy?.created_by.id ?? null,
      });
      if (!isAuth) {
        reset();
        setShowSignModal(true);
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
      invalidateAll();
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
      invalidateAll();
    }
    const isSuccess = !!getAuthJwt();
    if (isSuccess) {
      setShowSignModal(false);
    }
    return { success: isSuccess };
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

  const [pageTitle, setPageTitle] = useState<string>(DEFAULT_TITLE);
  const [titles, setTitles] = useState<Record<TitleType, string | null>>({
    [TitleType.PAGE]: DEFAULT_TITLE,
    [TitleType.WAVE]: null,
    [TitleType.MY_STREAM]: null,
    [TitleType.NOTIFICATION]: null,
  });

  const setTitle = ({
    title,
    type,
  }: {
    title: string | null;
    type?: TitleType;
  }) => {
    setTitles((prev) => ({ ...prev, [type ?? TitleType.PAGE]: title }));
  };

  useEffect(() => {
    if (titles[TitleType.WAVE]) {
      setPageTitle(titles[TitleType.WAVE]);
      return;
    }
    if (titles[TitleType.MY_STREAM]) {
      setPageTitle(titles[TitleType.MY_STREAM]);
      return;
    }
    if (titles[TitleType.NOTIFICATION]) {
      setPageTitle(titles[TitleType.NOTIFICATION]);
      return;
    }
    if (titles[TitleType.PAGE]) {
      setPageTitle(titles[TitleType.PAGE]);
      return;
    }
    setPageTitle(DEFAULT_TITLE);
  }, [titles]);

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
        setTitle,
        title: pageTitle,
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
        <Modal.Header className={styles.signModalHeader}>
          <Modal.Title>Sign Authentication Request</Modal.Title>
        </Modal.Header>
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
              seizeDisconnect();
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
