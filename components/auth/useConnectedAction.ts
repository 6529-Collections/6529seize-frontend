import { useCallback, useEffect, useRef } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

export type RunConnectedAction = (action: () => void) => void;

export function useConnectedAction(): RunConnectedAction {
  const { canSignActiveWallet, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const pendingActionRef = useRef<(() => void) | null>(null);

  const runConnectedAction = useCallback<RunConnectedAction>(
    (action) => {
      if (canSignActiveWallet) {
        action();
        return;
      }

      pendingActionRef.current = action;
      seizeConnect();
    },
    [canSignActiveWallet, seizeConnect]
  );

  useEffect(() => {
    if (canSignActiveWallet) {
      const pendingAction = pendingActionRef.current;
      pendingActionRef.current = null;
      pendingAction?.();
      return;
    }

    if (!seizeConnectOpen) {
      pendingActionRef.current = null;
    }
  }, [canSignActiveWallet, seizeConnectOpen]);

  return runConnectedAction;
}
