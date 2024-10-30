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
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import {
  getWalletAddress,
  removeAuthJwt,
} from "../../services/auth/auth.utils";

interface SeizeConnectContextType {
  address: string | null;
  seizeConnect: () => void;
  seizeDisconnect: () => void;
  seizeDisconnectAndLogout: (reconnect?: boolean) => void;
  seizeAcceptConnection: (address: string) => void;
  seizeConnectOpen: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
}

// Create the context
const SeizeConnectContext = createContext<SeizeConnectContextType | undefined>(
  undefined
);

// Provider component
export const SeizeConnectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const connections = useConnections();
  const { disconnect } = useDisconnect();
  const { open: onConnect } = useWeb3Modal();
  const { open } = useWeb3ModalState();
  const { invalidateAll } = useContext(ReactQueryWrapperContext);

  const account = useAccount();
  const [connectedAddress, setConnectedAddress] = useState<string | null>(
    account.address ?? getWalletAddress()
  );

  useEffect(() => {
    setConnectedAddress(account.address ?? getWalletAddress());
  }, [account.address]);

  const seizeConnect = useCallback(() => {
    onConnect({ view: "Connect" });
  }, [onConnect]);

  const seizeDisconnect = useCallback(() => {
    for (const connection of connections) {
      disconnect({
        connector: connection.connector,
      });
    }
    setConnectedAddress(null);
    invalidateAll();
  }, [connections, disconnect, invalidateAll]);

  const seizeDisconnectAndLogout = useCallback(
    async (reconnect?: boolean) => {
      for (const connection of connections) {
        await disconnect({
          connector: connection.connector,
        });
      }
      removeAuthJwt();
      setConnectedAddress(null);
      invalidateAll();

      if (reconnect) {
        seizeConnect();
      }
    },
    [connections, disconnect, seizeConnect, invalidateAll]
  );

  const seizeAcceptConnection = useCallback(
    (address: string) => {
      setConnectedAddress(address);
      invalidateAll();
    },
    [invalidateAll]
  );

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

// Hook to access the SeizeConnect context
export const useSeizeConnectContext = (): SeizeConnectContextType => {
  const context = useContext(SeizeConnectContext);
  if (!context) {
    throw new Error(
      "useSeizeConnectContext must be used within a SeizeConnectProvider"
    );
  }
  return context;
};
