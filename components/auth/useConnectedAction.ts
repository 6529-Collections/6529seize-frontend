import { useCallback, useEffect, useRef } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

export type RunConnectedAction = (action: () => void) => void;

export function useConnectedAction(): RunConnectedAction {
  const { canSignActiveWallet, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const pendingActionRef = useRef<(() => void) | null>(null);
  const connectRequestedRef = useRef(false);
  const connectModalOpenedRef = useRef(false);

  const runConnectedAction = useCallback<RunConnectedAction>(
    (action) => {
      if (canSignActiveWallet) {
        action();
        return;
      }

      if (pendingActionRef.current) {
        return;
      }

      pendingActionRef.current = action;
      connectRequestedRef.current = true;
      connectModalOpenedRef.current = false;
      seizeConnect();
    },
    [canSignActiveWallet, seizeConnect]
  );

  useEffect(() => {
    if (
      connectRequestedRef.current &&
      pendingActionRef.current &&
      seizeConnectOpen
    ) {
      connectModalOpenedRef.current = true;
    }

    if (canSignActiveWallet) {
      const pendingAction = connectModalOpenedRef.current
        ? pendingActionRef.current
        : null;
      pendingActionRef.current = null;
      connectRequestedRef.current = false;
      connectModalOpenedRef.current = false;
      pendingAction?.();
      return;
    }

    if (connectModalOpenedRef.current && !seizeConnectOpen) {
      pendingActionRef.current = null;
      connectRequestedRef.current = false;
      connectModalOpenedRef.current = false;
    }
  }, [canSignActiveWallet, seizeConnectOpen]);

  return runConnectedAction;
}
