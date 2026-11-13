import { useLayoutEffect, useRef } from "react";
import { useConnectedAction } from "@/components/auth/useConnectedAction";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

/** Lives in the persistent modal host, so closing the view cannot abandon connection. */
export function useConnectionShareUpgrade(
  request: (() => Promise<unknown>) | undefined
): () => void {
  const { address } = useSeizeConnectContext();
  const latest = useRef(request);
  useLayoutEffect(() => {
    latest.current = request;
  }, [request]);
  const connected = useConnectedAction({
    contextFingerprint: address?.toLowerCase() ?? "",
  });
  return () =>
    connected(() => {
      void latest.current?.().catch(() => undefined);
    });
}
