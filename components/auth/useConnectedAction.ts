import { useCallback, useEffect, useRef } from "react";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

export type RunConnectedAction = (action: () => void) => void;

const CONNECTED_ACTION_CLOSE_GRACE_MS = 1000;

interface UseConnectedActionOptions {
  readonly contextFingerprint?: string | undefined;
  readonly onContextChanged?: (() => void) | undefined;
}

function normalizeFingerprintValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return { $bigint: value.toString() };
  }
  if (Array.isArray(value)) {
    return value.map(normalizeFingerprintValue);
  }
  if (value !== null && typeof value === "object") {
    const normalizedValue: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      normalizedValue[key] = normalizeFingerprintValue(nestedValue);
    }
    return normalizedValue;
  }
  return value;
}

export function getConnectedActionFingerprint(value: unknown): string {
  const serializedValue = JSON.stringify(normalizeFingerprintValue(value));
  return typeof serializedValue === "string" ? serializedValue : "";
}

export function useConnectedAction(
  options: Readonly<UseConnectedActionOptions> = {}
): RunConnectedAction {
  const { canSignActiveWallet, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const latestOptionsRef = useRef(options);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const connectRequestedRef = useRef(false);
  const connectModalOpenedRef = useRef(false);
  const cancelPendingActionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    latestOptionsRef.current = options;
  }, [options]);

  const clearPendingAction = useCallback(() => {
    if (cancelPendingActionTimeoutRef.current) {
      clearTimeout(cancelPendingActionTimeoutRef.current);
      cancelPendingActionTimeoutRef.current = null;
    }
    pendingActionRef.current = null;
    connectRequestedRef.current = false;
    connectModalOpenedRef.current = false;
  }, []);

  const runConnectedAction = useCallback<RunConnectedAction>(
    (action) => {
      const intendedContextFingerprint =
        latestOptionsRef.current.contextFingerprint;
      const guardedAction = () => {
        const latestOptions = latestOptionsRef.current;
        if (
          intendedContextFingerprint !== undefined &&
          latestOptions.contextFingerprint !== intendedContextFingerprint
        ) {
          latestOptions.onContextChanged?.();
          return;
        }
        action();
      };

      if (canSignActiveWallet) {
        guardedAction();
        return;
      }

      if (pendingActionRef.current) {
        return;
      }

      pendingActionRef.current = guardedAction;
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
      if (cancelPendingActionTimeoutRef.current) {
        clearTimeout(cancelPendingActionTimeoutRef.current);
        cancelPendingActionTimeoutRef.current = null;
      }
    }

    if (canSignActiveWallet) {
      const pendingAction = connectModalOpenedRef.current
        ? pendingActionRef.current
        : null;
      clearPendingAction();
      pendingAction?.();
      return;
    }

    if (
      connectModalOpenedRef.current &&
      !seizeConnectOpen &&
      !cancelPendingActionTimeoutRef.current
    ) {
      cancelPendingActionTimeoutRef.current = setTimeout(
        clearPendingAction,
        CONNECTED_ACTION_CLOSE_GRACE_MS
      );
    }
  }, [canSignActiveWallet, clearPendingAction, seizeConnectOpen]);

  useEffect(() => clearPendingAction, [clearPendingAction]);

  return runConnectedAction;
}
