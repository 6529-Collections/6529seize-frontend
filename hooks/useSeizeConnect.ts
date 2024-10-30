import { useAccount, useConnections, useDisconnect } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import { getWalletAddress, removeAuthJwt } from "../services/auth/auth.utils";

export const useSeizeConnect = () => {
  const connections = useConnections();
  const { disconnect } = useDisconnect();
  const { open: onConnect } = useWeb3Modal();
  const { open } = useWeb3ModalState();

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
  }, [connections, disconnect]);

  const seizeDisconnectAndLogout = useCallback(
    (reconnect?: boolean) => {
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
    [connections, disconnect]
  );

  return {
    address: connectedAddress,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeConnectOpen: open,
    isConnected: account.isConnected,
    isAuthenticated: !!connectedAddress,
  };
};
