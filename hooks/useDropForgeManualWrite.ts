"use client";
import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import { useAuth } from "@/components/auth/Auth";
import {
  beginForgeManual,
  finishForgeManual,
} from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useQueryClient } from "@tanstack/react-query";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
type PendingManual = {
  attempt_id?: string;
  lease?: string | null;
  hash?: string;
  action?: string;
};
type ManualAttempt = {
  id: string;
  key: string;
  lease: string | null;
  action: string | undefined;
  baselineHash: string | undefined;
};
function pendingManual(key: string): PendingManual | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingManual;
  } catch {
    return null;
  }
}
export function useDropForgeManualWrite(
  contract: string,
  claim: number,
  hash: string | undefined,
  error: unknown,
  fingerprint: string = ""
) {
  const { requestAuth, setToast } = useAuth();
  const client = useQueryClient();
  const attempt = useRef<ManualAttempt | null>(null);
  const context = useRef({ fingerprint, hash });
  useEffect(() => {
    context.current = { fingerprint, hash };
  }, [fingerprint, hash]);
  const key = `drop-forge-manual:${contract.toLowerCase()}:${claim}`;
  const cancel = useCallback(
    async (current: ManualAttempt) => {
      await finishForgeManual(contract, claim, current.lease);
      if (attempt.current?.id === current.id) attempt.current = null;
      if (pendingManual(current.key)?.attempt_id === current.id)
        localStorage.removeItem(current.key);
    },
    [contract, claim]
  );
  const execute = useCallback(
    async (write: () => void, label?: string) => {
      const captured = context.current.fingerprint;
      if (
        !(await requestAuth()).success ||
        context.current.fingerprint !== captured
      )
        return;
      if (pendingManual(key)?.hash)
        throw new Error(
          "Reconcile the previous manual transaction before starting another"
        );
      const granted = await beginForgeManual(contract, claim, label);
      // A null lease explicitly permits the legacy/unmanaged flow. Conflicts on
      // managed launches reject BEGIN rather than returning null.
      const current: ManualAttempt = {
        id: crypto.randomUUID(),
        key,
        lease: granted.lease_id,
        action: label,
        baselineHash: context.current.hash,
      };
      attempt.current = current;
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            attempt_id: current.id,
            lease: current.lease,
            action: label,
          })
        );
        if (context.current.fingerprint !== captured) {
          await cancel(current);
          return;
        }
        write();
      } catch (error_) {
        await cancel(current).catch(() => undefined);
        throw error_;
      }
    },
    [requestAuth, contract, claim, key, cancel]
  );
  useEffect(() => {
    const current = attempt.current;
    if (!hash || current?.key !== key || hash === current.baselineHash) return;
    const saved = pendingManual(key);
    if (saved?.attempt_id !== current.id || saved.lease !== current.lease)
      return;
    localStorage.setItem(key, JSON.stringify({ ...saved, hash }));
    attempt.current = null;
  }, [hash, key]);
  useEffect(() => {
    let stopped = false;
    let recovering = false;
    function acknowledge(raw: string) {
      if (!stopped && localStorage.getItem(key) === raw)
        localStorage.removeItem(key);
    }
    async function recover() {
      if (stopped || recovering) return;
      const raw = localStorage.getItem(key);
      const saved = pendingManual(key);
      if (!raw || !saved?.hash) return;
      recovering = true;
      try {
        await finishForgeManual(
          contract,
          claim,
          saved.lease ?? null,
          saved.hash,
          saved.action
        );
        acknowledge(raw);
        await client.invalidateQueries({
          queryKey: forgeLaunchKey(contract, claim),
        });
      } catch {
        /* Retain the exact proof for retry; never acquire a new lease. */
      } finally {
        recovering = false;
      }
    }
    void recover();
    const timer = setInterval(() => {
      void recover();
    }, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [contract, claim, key, hash, client]);
  const rejectWallet = useEffectEvent((isActive: () => boolean) => {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    const current = attempt.current;
    if (!current || (code !== 4001 && code !== "ACTION_REJECTED")) return;
    void cancel(current).catch((error_: unknown) => {
      if (!isActive()) return;
      setToast({
        type: "error",
        message:
          getToastErrorDetails(error_) ?? "Manual operation requires recovery",
      });
    });
  });
  useEffect(() => {
    let active = true;
    rejectWallet(() => active);
    return () => {
      active = false;
    };
  }, [error]);
  return execute;
}
