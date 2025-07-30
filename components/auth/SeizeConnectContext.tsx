"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  migrateCookiesToLocalStorage,
  getWalletAddress,
  removeAuthJwt,
} from "../../services/auth/auth.utils";
import { useAppKit, useAppKitAccount, useAppKitState, useDisconnect } from "@reown/appkit/react";

interface SeizeConnectContextType {
  address: string | undefined;
  seizeConnect: () => void;
  seizeDisconnect: () => Promise<void>;
  seizeDisconnectAndLogout: (reconnect?: boolean) => Promise<void>;
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
  const account = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const state = useAppKitState();



  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(
    getWalletAddress() ?? undefined
  );

  useEffect(() => {
    migrateCookiesToLocalStorage();
  }, []);

  useEffect(() => {
    if (account.address && account.isConnected) {
      setConnectedAddress(account.address);
    } else {
      setConnectedAddress(getWalletAddress() ?? undefined);
    }
  }, [account.address, account.isConnected]);

  const seizeConnect = useCallback((): void => {
    open({ view: "Connect" });
  }, [open]);

  const seizeDisconnect = useCallback(async (): Promise<void> => {
    try {
      await disconnect();
    } catch (error: unknown) {
      console.error('Failed to disconnect:', error instanceof Error ? error.message : error);
    }
  }, [disconnect]);

  const seizeDisconnectAndLogout = useCallback(
    async (reconnect?: boolean): Promise<void> => {
      try {
        await disconnect();
        removeAuthJwt();
        setConnectedAddress(undefined);

        if (reconnect) {
          seizeConnect();
        }
      } catch (error: unknown) {
        console.error('Failed to disconnect and logout:', error instanceof Error ? error.message : error);
        // Still clean up auth state even if disconnect fails
        removeAuthJwt();
        setConnectedAddress(undefined);
      }
    },
    [disconnect, seizeConnect]
  );

  const seizeAcceptConnection = useCallback((address: string): void => {
    setConnectedAddress(address);
  }, []);

  const contextValue = useMemo(() => {
    return {
      address: connectedAddress,
      seizeConnect,
      seizeDisconnect,
      seizeDisconnectAndLogout,
      seizeAcceptConnection,
      seizeConnectOpen: state.open,
      isConnected: account.isConnected,
      isAuthenticated: !!connectedAddress,
    };
  }, [
    connectedAddress,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeAcceptConnection,
    state.open,
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
