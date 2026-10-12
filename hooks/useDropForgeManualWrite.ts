"use client";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  type RefObject,
} from "react";
import { useAuth } from "@/components/auth/Auth";
import {
  beginForgeManual,
  finishForgeManual,
} from "@/services/api/drop-forge-api";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useQueryClient } from "@tanstack/react-query";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
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
type VolatileProof = {
  key: string;
  pending: PendingManual & { hash: string };
  notified: boolean;
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
  const locale = useBrowserLocale();
  const attempt = useRef<ManualAttempt | null>(null);
  const volatileProof = useRef<VolatileProof | null>(null);
  const context = useRef({ fingerprint, hash });
  useEffect(() => {
    context.current = { fingerprint, hash };
  }, [fingerprint, hash]);
  const key = `drop-forge-manual:${contract.toLowerCase()}:${claim}`;
  const cancel = useCallback(
    async (current: ManualAttempt) => {
      await finishForgeManual(contract, claim, current.lease);
      if (attempt.current?.id === current.id) attempt.current = null;
      try {
        if (pendingManual(current.key)?.attempt_id === current.id)
          localStorage.removeItem(current.key);
      } catch {
        // Backend cancellation is acknowledged; stale local data cannot revive
        // this attempt and must not turn cancellation into another submission.
      }
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
      let saved: PendingManual | null;
      try {
        saved = pendingManual(key);
      } catch {
        throw new Error(t(locale, "dropForge.storageError"));
      }
      if (saved?.hash || volatileProof.current)
        throw new Error(t(locale, "dropForge.previousManualError"));
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
    [requestAuth, contract, claim, key, cancel, locale]
  );
  useEffect(() => {
    const current = attempt.current;
    if (!hash || current?.key !== key || hash === current.baselineHash) return;
    const submitted: PendingManual & { hash: string } = {
      attempt_id: current.id,
      lease: current.lease,
      ...(current.action !== undefined ? { action: current.action } : {}),
      hash,
    };
    try {
      const saved = pendingManual(key);
      if (saved?.attempt_id !== current.id || saved.lease !== current.lease)
        return;
      localStorage.setItem(key, JSON.stringify(submitted));
    } catch {
      volatileProof.current = { key, pending: submitted, notified: false };
    }
    attempt.current = null;
  }, [hash, key]);
  useManualProofRecovery(contract, claim, key, hash, volatileProof);
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
          getToastErrorDetails(error_) ??
          t(locale, "dropForge.manualRecoveryError"),
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

function useManualProofRecovery(
  contract: string,
  claim: number,
  key: string,
  hash: string | undefined,
  volatileProof: RefObject<VolatileProof | null>
) {
  const { setToast } = useAuth();
  const locale = useBrowserLocale();
  const client = useQueryClient();
  useEffect(() => {
    let stopped = false;
    let recovering = false;
    function acknowledge(raw: string | null, held: VolatileProof | null) {
      if (stopped) return;
      if (held && volatileProof.current === held) volatileProof.current = null;
      try {
        const ownsStored = held
          ? pendingManual(key)?.attempt_id === held.pending.attempt_id
          : raw !== null && localStorage.getItem(key) === raw;
        if (ownsStored) localStorage.removeItem(key);
      } catch {
        // Proof is already durable in the backend. Local cleanup is best effort.
      }
    }
    function reportStorageFailure(held: VolatileProof | null) {
      if (!held || held.notified || stopped) return;
      held.notified = true;
      setToast({
        type: "error",
        message: t(locale, "dropForge.hashStorageError", {
          hash: held.pending.hash,
        }),
      });
    }
    async function recover() {
      if (stopped || recovering) return;
      recovering = true;
      const held =
        volatileProof.current?.key === key ? volatileProof.current : null;
      try {
        const raw = held ? null : localStorage.getItem(key);
        const saved = held?.pending ?? pendingManual(key);
        if (!saved?.hash) return;
        await finishForgeManual(
          contract,
          claim,
          saved.lease ?? null,
          saved.hash,
          saved.action
        );
        acknowledge(raw, held);
        await client.invalidateQueries({
          queryKey: forgeLaunchKey(contract, claim),
        });
      } catch {
        /* Retain the exact proof for retry; never acquire a new lease. */
        reportStorageFailure(held);
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
  }, [contract, claim, key, hash, client, locale, setToast, volatileProof]);
}
