"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { useActiveWaveOptional } from "@/contexts/wave/ActiveWaveContext";
import { useMyStreamActionsOptional } from "@/contexts/wave/MyStreamContext";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";
import WaveDropQuote from "./WaveDropQuote";

type WaveMessagesStore = NonNullable<
  ReturnType<typeof useMyStreamActionsOptional>
>["waveMessagesStore"];

type QuotedDropSnapshot = {
  readonly drop: ExtendedDrop | null;
  readonly isLoading: boolean;
};

const NO_QUOTED_DROP: QuotedDropSnapshot = { drop: null, isLoading: false };
const LOADING_QUOTED_DROP: QuotedDropSnapshot = {
  drop: null,
  isLoading: true,
};

// Re-renders only when the quoted drop or the wave's loading state changes,
// not on every message in the wave.
const useQuotedWaveMessagesDrop = (
  store: WaveMessagesStore | undefined,
  waveId: string | null,
  dropId: string
): QuotedDropSnapshot => {
  const snapshotRef = React.useRef<QuotedDropSnapshot>(NO_QUOTED_DROP);
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!store || !waveId) {
        return () => undefined;
      }

      const listener = () => onStoreChange();
      store.subscribe(waveId, listener);
      return () => store.unsubscribe(waveId, listener);
    },
    [store, waveId]
  );
  const getSnapshot = useCallback((): QuotedDropSnapshot => {
    if (!store || !waveId) return NO_QUOTED_DROP;
    const data = store.getData(waveId);
    if (data === undefined) return LOADING_QUOTED_DROP;
    const drop =
      data.drops.find(
        (candidate): candidate is ExtendedDrop =>
          candidate.type === DropSize.FULL && candidate.id === dropId
      ) ?? null;
    const previous = snapshotRef.current;
    if (previous.drop === drop && previous.isLoading === data.isLoading) {
      return previous;
    }
    const next = { drop, isLoading: data.isLoading };
    snapshotRef.current = next;
    return next;
  }, [dropId, store, waveId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

interface WaveDropQuoteWithDropIdProps {
  readonly dropId: string;
  readonly partId: number;
  readonly maybeDrop: ApiDrop | null;
  readonly waveId?: string | undefined;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (error === null || error === undefined || typeof error !== "object") {
    return undefined;
  }

  const maybeError = error as {
    readonly status?: unknown;
    readonly response?: { readonly status?: unknown };
  };
  const status = maybeError.response?.status ?? maybeError.status;

  return typeof status === "number" ? status : undefined;
};

const isDropNotFoundError = (
  error: unknown,
  normalizedDropId: string
): boolean => {
  if (error === null || error === undefined) {
    return false;
  }

  if (getErrorStatus(error) === 404) {
    return true;
  }

  const expectedMessage = `Drop ${normalizedDropId} not found`;

  if (error instanceof Error) {
    return error.message === expectedMessage;
  }

  return error === expectedMessage;
};

const isModeratedPresentation = (drop: ApiDrop | null): boolean =>
  drop?.moderation?.status !== undefined &&
  drop.moderation.status !== ApiDropModerationStatus.Visible;

const WaveDropQuoteWithDropId: React.FC<WaveDropQuoteWithDropIdProps> = ({
  dropId,
  partId,
  maybeDrop,
  waveId,
  onQuoteClick,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  onLinkCardActionsActiveChange,
}) => {
  const normalizedDropId = dropId.trim();
  const activeWaveId = useActiveWaveOptional()?.id ?? null;
  const waveMessagesStore = useMyStreamActionsOptional()?.waveMessagesStore;
  const targetWaveId = waveId ?? activeWaveId;
  const quotedDrop = useQuotedWaveMessagesDrop(
    waveMessagesStore,
    targetWaveId,
    normalizedDropId
  );
  const waveMessagesDrop = targetWaveId ? quotedDrop.drop : null;
  const isActiveWaveHydrating =
    targetWaveId !== null &&
    targetWaveId === activeWaveId &&
    quotedDrop.isLoading;
  const currentPresentationDrop = maybeDrop ?? waveMessagesDrop ?? null;
  let authoritativeModeratedDrop: ApiDrop | null = null;
  if (isModeratedPresentation(maybeDrop)) {
    authoritativeModeratedDrop = maybeDrop;
  } else if (isModeratedPresentation(waveMessagesDrop)) {
    authoritativeModeratedDrop = waveMessagesDrop;
  }

  const { data: drop, error } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(normalizedDropId),
    queryFn: () => fetchDropByIdBatched(normalizedDropId),
    placeholderData: keepPreviousData,
    enabled:
      normalizedDropId.length > 0 &&
      currentPresentationDrop === null &&
      !isActiveWaveHydrating,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  const isNotFound =
    authoritativeModeratedDrop === null &&
    waveMessagesDrop === null &&
    !isActiveWaveHydrating &&
    isDropNotFoundError(error, normalizedDropId);
  let resolvedDrop = authoritativeModeratedDrop;
  if (resolvedDrop === null && !isNotFound) {
    resolvedDrop = currentPresentationDrop;
  }
  if (resolvedDrop === null && !isNotFound && !isActiveWaveHydrating) {
    resolvedDrop = drop ?? null;
  }

  return (
    <WaveDropQuote
      drop={resolvedDrop}
      partId={partId}
      onQuoteClick={onQuoteClick}
      isNotFound={isNotFound}
      embedPath={embedPath}
      quotePath={quotePath}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
      hideLinkPreviews={resolvedDrop?.hide_link_preview === true}
      onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
    />
  );
};

export default WaveDropQuoteWithDropId;
