"use client";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/Auth";
import {
  beginForgeManual,
  finishForgeManual,
} from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useQueryClient } from "@tanstack/react-query";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
export function useDropForgeManualWrite(
  contract: string,
  claim: number,
  hash: string | undefined,
  error: unknown,
  fingerprint: string = ""
) {
  const { requestAuth, setToast } = useAuth();
  const client = useQueryClient();
  const lease = useRef<string | null>(null);
  const action = useRef<string | undefined>(undefined);
  const fingerprintRef = useRef(fingerprint);
  useEffect(() => {
    fingerprintRef.current = fingerprint;
  }, [fingerprint]);
  const key = `drop-forge-manual:${contract.toLowerCase()}:${claim}`;
  const execute = useCallback(
    async (write: () => void, label?: string) => {
      const captured = fingerprintRef.current;
      if (!(await requestAuth()).success || fingerprintRef.current !== captured)
        return;
      const granted = await beginForgeManual(contract, claim, label);
      lease.current = granted.lease_id;
      action.current = label;
      if (granted.lease_id)
        localStorage.setItem(
          key,
          JSON.stringify({ lease: granted.lease_id, action: label })
        );
      try {
        if (fingerprintRef.current !== captured) {
          await finishForgeManual(contract, claim, lease.current);
          return;
        }
        write();
      } catch (e) {
        await finishForgeManual(contract, claim, lease.current).catch(
          () => undefined
        );
        throw e;
      }
    },
    [requestAuth, contract, claim, key]
  );
  useEffect(() => {
    if (!hash) return;
    localStorage.setItem(
      key,
      JSON.stringify({ lease: lease.current, hash, action: action.current })
    );
  }, [hash, key]);
  useEffect(() => {
    let stopped = false;
    async function recover() {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const pending = JSON.parse(raw) as {
          lease?: string | null;
          hash?: string;
          action?: string;
        };
        if (!pending.hash) return;
        await finishForgeManual(
          contract,
          claim,
          pending.lease ?? null,
          pending.hash,
          pending.action
        );
        if (!stopped && localStorage.getItem(key) === raw)
          localStorage.removeItem(key);
        await client.invalidateQueries({
          queryKey: forgeLaunchKey(contract, claim),
        });
      } catch {
        /* Persisted hash retries until its chain evidence is available. */
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
  useEffect(() => {
    if (error === null || error === undefined) return;
    const code =
      typeof error === "object" && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (code !== 4001 && code !== "ACTION_REJECTED") return;
    void finishForgeManual(contract, claim, lease.current)
      .then(() => {
        localStorage.removeItem(key);
        lease.current = null;
      })
      .catch((e: unknown) => {
        setToast({
          type: "error",
          message:
            getToastErrorDetails(e) ?? "Manual operation requires recovery",
        });
      });
  }, [error, contract, claim, key, setToast]);
  return execute;
}
