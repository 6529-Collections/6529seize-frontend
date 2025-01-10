import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount, useConnections, useDisconnect } from "wagmi";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import {
  getWalletAddress,
  getWalletType,
  removeAuthJwt,
} from "../../services/auth/auth.utils";
import HeaderUserConnectAppWalletModal from "../header/user/app-wallets/HeaderUserConnectAppWalletModal";

interface SeizeConnectContextType {
  address: string | null;
  walletType: string | null;
  seizeConnect: () => void;
  seizeConnectAppWallet: () => void;
  seizeDisconnect: () => void;
  seizeDisconnectAndLogout: (reconnect?: boolean) => void;
  seizeAcceptConnection: (address: string) => void;
  seizeConnectOpen: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
}

const SeizeConnectContext = createContext<SeizeConnectContextType | undefined>(
  undefined
);

export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const connections = useConnections().flat();
  const { disconnect } = useDisconnect();
  const { open: onConnect } = useWeb3Modal();
  const { open } = useWeb3ModalState();

  const [showAppWalletModal, setShowAppWalletModal] = useState(false);

  const account = useAccount();
  const [connectedAddress, setConnectedAddress] = useState<string | null>(
    account.address ?? getWalletAddress()
  );
  const [walletType, setWalletType] = useState<string | null>(
    account.connector?.type ?? getWalletType()
  );

  useEffect(() => {
    setConnectedAddress(account.address ?? getWalletAddress());
  }, [account.address]);

  useEffect(() => {
    setWalletType(account.connector?.type ?? getWalletType());
  }, [account.connector]);

  const seizeConnect = useCallback(() => {
    onConnect({ view: "Connect" });
  }, [onConnect]);

  const seizeConnectAppWallet = useCallback(() => {
    setShowAppWalletModal(true);
  }, [setShowAppWalletModal]);

  const seizeDisconnect = useCallback(() => {
    for (const connection of connections) {
      disconnect({
        connector: connection.connector,
      });
    }
  }, [connections, disconnect]);

  const seizeDisconnectAndLogout = useCallback(
    async (reconnect?: boolean) => {
      for (const connection of connections) {
        disconnect({
          connector: connection.connector,
        });
      }
      removeAuthJwt();
      setConnectedAddress(null);

      if (reconnect) {
        seizeConnect();
      }
    },
    [connections, disconnect, seizeConnect]
  );

  const seizeAcceptConnection = (address: string) => {
    setConnectedAddress(address);
  };

  const contextValue = useMemo(() => {
    return {
      address: connectedAddress,
      walletType,
      seizeConnect,
      seizeConnectAppWallet,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeAcceptConnection,
      seizeConnectOpen: open,
      isConnected: account.isConnected,
      isAuthenticated: !!connectedAddress,
    };
  }, [
    connectedAddress,
    walletType,
    seizeConnect,
    seizeConnectAppWallet,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    open,
    account.isConnected,
  ]);

  return (
    <SeizeConnectContext.Provider value={contextValue}>
      {children}
      <HeaderUserConnectAppWalletModal
        open={showAppWalletModal}
        onClose={() => setShowAppWalletModal(false)}
      />
    </SeizeConnectContext.Provider>
  );
};

export const useSeizeConnectContext = (): SeizeConnectContextType => {
  const context = useContext(SeizeConnectContext);
  if (!context) {
    throw new Error(
      "useSeizeConnectContext must be used within a SeizeConnectProvider"
    );
  }
  return context;
};
