"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { t } from "@/i18n/messages";
import {
  CurationOrderChangedError,
  moveCurationDrop,
  type CurationDropMove,
} from "@/services/api/curation-drop-order-api";
import { useBrowserLocale } from "./useBrowserLocale";
import { useWaveCurationDrops } from "./useWaveCurationDrops";

const PAGE_SIZE = 20;
type UndoMove = { dropId: string; move: CurationDropMove; page: number };
type OrderSnapshot = readonly ExtendedDrop[] | null;
type RevealRequest = { id: string } | null;

function reordered(
  drops: readonly ExtendedDrop[],
  dropId: string,
  move: CurationDropMove
) {
  const source = drops.find((drop) => drop.id === dropId);
  if (!source) return drops;
  const next = drops.filter((drop) => drop.id !== dropId);
  let index = move.placement === "first" ? 0 : next.length;
  if ("anchorDropId" in move) {
    const anchor = next.findIndex((drop) => drop.id === move.anchorDropId);
    if (anchor < 0) return drops;
    index = anchor + (move.placement === "after" ? 1 : 0);
  }
  next.splice(index, 0, source);
  return next;
}

function prepareMove(
  drops: readonly ExtendedDrop[],
  dropId: string,
  destination: CurationDropMove,
  startIndex: number,
  undoing: boolean
) {
  const sourceIndex = drops.findIndex((drop) => drop.id === dropId);
  if (
    sourceIndex < 0 ||
    ("anchorDropId" in destination && destination.anchorDropId === dropId)
  )
    return null;
  const anchor = drops[sourceIndex + 1] ?? drops[sourceIndex - 1];
  const previous: UndoMove | null = anchor
    ? {
        dropId,
        move: {
          anchorDropId: anchor.id,
          placement: sourceIndex + 1 < drops.length ? "before" : "after",
        },
        page: Math.floor((startIndex + sourceIndex) / PAGE_SIZE) + 1,
      }
    : null;
  const next = reordered(drops, dropId, destination);
  if (
    !undoing &&
    next.every((drop, index) => drops[index]?.id === drop.id) &&
    "anchorDropId" in destination
  )
    return null;
  return { previous, next };
}

function getDestinationPage(
  position: number | undefined,
  page: number,
  undo: UndoMove | null
) {
  if (undo) return undo.page;
  return position === undefined ? page : Math.ceil(position / PAGE_SIZE);
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
  locale: string
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
  const [windowPage, setWindowPage] = useState({ curationId, page: 1 });
  const page = windowPage.curationId === curationId ? windowPage.page : 1;
  const query = useWaveCurationDrops({
    wave,
    curationId,
    enabled,
    initialPage: page,
    pageSize: PAGE_SIZE,
  });
  const [optimistic, setOptimistic] = useState<OrderSnapshot>(null);
  const [held, setHeld] = useState<OrderSnapshot>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const generation = useRef(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [undo, setUndo] = useState<UndoMove | null>(null);
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
    setUndo(null);
    setError("");
    setSaved(false);
    setRevealRequest(null);
  }
  useEffect(() => {
    generation.current += 1;
    saving.current = false;
    return () => {
      generation.current += 1;
    };
  }, [identity]);

  const move = async (
    dropId: string,
    destination: CurationDropMove,
    undoing = false
  ) => {
    if (saving.current || busy || !canAuthenticate) return;
    const startIndex = query.startIndex;
    const plan = prepareMove(drops, dropId, destination, startIndex, undoing);
    if (!plan) return;
    const { previous, next } = plan;
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
      const authError = t(locale, "profileCuration.order.authCancelled");
      if (!auth.success) throw new Error(authError);
      const result = await moveCurationDrop({
        dropId,
        curationId,
        ...destination,
      });
      const nextPage = getDestinationPage(
        result?.position,
        page,
        undoing ? undo : null
      );
      await invalidateCurationDrops(queryClient, curationId);
      ensureCurrent();
      if (nextPage !== page) setWindowPage({ curationId, page: nextPage });
      const refreshError =
        nextPage === page ? await refreshOrder(query.refetch, locale) : "";
      ensureCurrent();
      setError(refreshError);
      setUndo(undoing ? null : previous);
      setSaved(true);
      setRevealRequest({ id: dropId });
    } catch (cause) {
      if (!isCurrent()) return;
      setError(
        cause instanceof CurationOrderChangedError
          ? t(locale, "profileCuration.order.changed")
          : t(locale, "profileCuration.order.saveFailed")
      );
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
    undo: undo ? () => move(undo.dropId, undo.move, true) : null,
    registerReveal,
    revealDrop,
    revealRequest,
  };
}

export type CurationOrder = ReturnType<typeof useCurationOrder>;
