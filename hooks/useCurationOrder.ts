"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import {
  CurationOrderChangedError,
  moveCurationDrop,
  type CurationDropMove,
} from "@/services/api/curation-drop-order-api";
import { useBrowserLocale } from "./useBrowserLocale";
import { useWaveCurationDrops } from "./useWaveCurationDrops";

const PAGE_SIZE = 20;
type OrderSnapshot = readonly ExtendedDrop[] | null;
type RevealRequest = { id: string } | null;

class CurationAuthCancelledError extends Error {}

function reordered(
  drops: readonly ExtendedDrop[],
  dropId: string,
  move: CurationDropMove
) {
  const source = drops.find((drop) => drop.id === dropId);
  if (!source) return drops;
  const next = drops.filter((drop) => drop.id !== dropId);
  const anchor = next.findIndex((drop) => drop.id === move.anchorDropId);
  if (anchor < 0) return drops;
  const index = anchor + (move.placement === "after" ? 1 : 0);
  next.splice(index, 0, source);
  return next;
}

function prepareMove(
  drops: readonly ExtendedDrop[],
  dropId: string,
  destination: CurationDropMove
) {
  const sourceIndex = drops.findIndex((drop) => drop.id === dropId);
  if (sourceIndex < 0 || destination.anchorDropId === dropId) return null;
  const next = reordered(drops, dropId, destination);
  if (next.every((drop, index) => drops[index]?.id === drop.id)) return null;
  return next;
}

async function invalidateCurationDrops(
  queryClient: QueryClient,
  curationId: string
) {
  await queryClient.invalidateQueries({
    queryKey: [QueryKey.DROPS],
    refetchType: "none",
    predicate: ({ queryKey }) => {
      const params = queryKey[1];
      return (
        typeof params === "object" &&
        params !== null &&
        "curationId" in params &&
        params.curationId === curationId
      );
    },
  });
}

async function refreshOrder(
  refetch: ReturnType<typeof useWaveCurationDrops>["refetch"],
  locale: SupportedLocale
) {
  const result = await refetch();
  return result.isError ? t(locale, "profileCuration.order.refreshFailed") : "";
}

export function useCurationOrder({
  wave,
  curationId,
  enabled = true,
}: {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly enabled?: boolean;
}) {
  const locale = useBrowserLocale();
  const { requestAuth, connectedProfile, activeProfileProxy } = useAuth();
  const queryClient = useQueryClient();
  const query = useWaveCurationDrops({
    wave,
    curationId,
    enabled,
    pageSize: PAGE_SIZE,
  });
  const [optimistic, setOptimistic] = useState<OrderSnapshot>(null);
  const [held, setHeld] = useState<OrderSnapshot>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const generation = useRef(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [revealRequest, setRevealRequest] = useState<RevealRequest>(null);
  const reveal = useRef<((id: string) => void) | null>(null);
  const canAuthenticate = !!connectedProfile && !activeProfileProxy;
  // Realtime changes wait for the gesture to finish. Append-only pagination can
  // still extend the targets without moving any card beneath the pointer.
  const isAppend = held?.every(
    (drop, index) => query.drops[index]?.id === drop.id
  );
  const stableDrops = held && !isAppend ? held : query.drops;
  const drops = optimistic ?? stableDrops;
  const busy = isSaving || query.isPlaceholderData;

  const identity = `${curationId}:${connectedProfile?.id ?? ""}:${activeProfileProxy?.id ?? ""}`;
  const [previousIdentity, setPreviousIdentity] = useState(identity);
  if (identity !== previousIdentity) {
    setPreviousIdentity(identity);
    setIsSaving(false);
    setOptimistic(null);
    setHeld(null);
    setError("");
    setSaved(false);
    setRevealRequest(null);
  }
  useLayoutEffect(() => {
    generation.current += 1;
    saving.current = false;
    return () => {
      generation.current += 1;
    };
  }, [identity]);

  const move = async (dropId: string, destination: CurationDropMove) => {
    if (saving.current || busy || !canAuthenticate) return;
    const next = prepareMove(drops, dropId, destination);
    if (!next) return;
    saving.current = true;
    const startedIn = generation.current;
    const isCurrent = () => generation.current === startedIn;
    const ensureCurrent = () => {
      if (!isCurrent()) throw new CurationOrderChangedError();
    };
    setIsSaving(true);
    setOptimistic(next);
    setHeld(null);
    setError("");
    setSaved(false);
    try {
      const auth = await requestAuth();
      ensureCurrent();
      if (!auth.success) throw new CurationAuthCancelledError();
      await moveCurationDrop({
        dropId,
        curationId,
        ...destination,
      });
      await invalidateCurationDrops(queryClient, curationId);
      ensureCurrent();
      const refreshError = await refreshOrder(query.refetch, locale);
      ensureCurrent();
      setError(refreshError);
      setSaved(true);
      setRevealRequest({ id: dropId });
    } catch (cause) {
      if (!isCurrent()) return;
      let message = t(locale, "profileCuration.order.saveFailed");
      if (cause instanceof CurationAuthCancelledError) {
        message = t(locale, "profileCuration.order.authCancelled");
      } else if (cause instanceof CurationOrderChangedError) {
        message = t(locale, "profileCuration.order.changed");
      }
      setError(message);
      await query.refetch();
      if (isCurrent()) setRevealRequest({ id: dropId });
    } finally {
      if (isCurrent()) {
        setOptimistic(null);
        saving.current = false;
        setIsSaving(false);
      }
    }
  };

  const registerReveal = useCallback(
    (handler: ((id: string) => void) | null) => {
      reveal.current = handler;
    },
    []
  );
  const revealDrop = useCallback((id: string) => {
    reveal.current?.(id);
  }, []);
  const hold = useCallback(() => setHeld(drops), [drops]);
  const release = useCallback(() => setHeld(null), []);
  return {
    ...query,
    drops,
    busy,
    isSaving,
    error,
    saved,
    canAuthenticate,
    move,
    hold,
    release,
    registerReveal,
    revealDrop,
    revealRequest,
  };
}

export type CurationOrder = ReturnType<typeof useCurationOrder>;
