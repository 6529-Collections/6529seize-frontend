import { useConnections, useDisconnect } from "wagmi";
import { useCallback } from "react";

export const useSeizeDisconnect = () => {
  const connections = useConnections();
  const { disconnect } = useDisconnect();

  const seizeDisconnect = useCallback(() => {
    for (const connection of connections) {
      disconnect({
        connector: connection.connector,
      });
    }
  }, [connections, disconnect]);

  return { seizeDisconnect };
};
