import { useConnections, useDisconnect } from "wagmi";
import { useCallback } from "react";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";

export const useSeizeConnect = () => {
  const connections = useConnections();
  const { disconnect } = useDisconnect();
  const { open: onConnect } = useWeb3Modal();
  const { open } = useWeb3ModalState();

  const seizeConnect = useCallback(() => {
    onConnect({ view: "Connect" });
  }, [onConnect]);

  const seizeDisconnect = useCallback(
    (reconnect?: boolean) => {
      for (const connection of connections) {
        disconnect({
          connector: connection.connector,
        });
      }
      if (reconnect) {
        seizeConnect();
      }
    },
    [connections, disconnect]
  );

  return { seizeConnect, seizeDisconnect, seizeConnectOpen: open };
};
