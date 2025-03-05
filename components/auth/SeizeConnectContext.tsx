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
  removeAuthJwt,
} from "../../services/auth/auth.utils";

interface SeizeConnectContextType {
  address: string | undefined;
  seizeConnect: () => void;
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

  const account = useAccount();
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(
    account.address ?? getWalletAddress() ?? undefined
  );

  useEffect(() => {
    if (account.address && account.isConnected) {
      setConnectedAddress(account.address);
    } else {
      setConnectedAddress(getWalletAddress() ?? undefined);
    }
  }, [account.address, account.isConnected]);

  const seizeConnect = useCallback(() => {
    onConnect({ view: "Connect" });
  }, [onConnect]);

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
      setConnectedAddress(undefined);

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
      seizeConnect,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeAcceptConnection,
      seizeConnectOpen: open,
      isConnected: account.isConnected,
      isAuthenticated: !!connectedAddress,
    };
  }, [
    connectedAddress,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    open,
    account.isConnected,
  ]);

  return (
    <SeizeConnectContext.Provider value={contextValue}>
      {children}
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
