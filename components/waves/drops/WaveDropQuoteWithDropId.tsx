"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";
import WaveDropQuote from "./WaveDropQuote";

type MyStreamContext = ReturnType<typeof useMyStreamOptional>;

const useOptionalWaveMessages = (
  myStream: MyStreamContext,
  waveId: string | null
) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!myStream || !waveId) {
        return () => undefined;
      }

      const listener = () => onStoreChange();
      myStream.waveMessagesStore.subscribe(waveId, listener);
      return () => myStream.waveMessagesStore.unsubscribe(waveId, listener);
    },
    [myStream, waveId]
  );
  const getSnapshot = useCallback(
    () =>
      myStream && waveId
        ? myStream.waveMessagesStore.getData(waveId)
        : undefined,
    [myStream, waveId]
  );

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
  const queryClient = useQueryClient();
  const myStream = useMyStreamOptional();
  const targetWaveId = waveId ?? myStream?.activeWave.id ?? null;
  const waveMessages = useOptionalWaveMessages(myStream, targetWaveId);
  const cachedDrop = queryClient.getQueryData<ApiDrop>(
    getDropQueryKey(normalizedDropId)
  );
  const waveMessagesDrop =
    (targetWaveId
      ? waveMessages?.drops.find(
          (drop): drop is ExtendedDrop =>
            drop.type === DropSize.FULL && drop.id === normalizedDropId
        )
      : null) ?? null;
  const isActiveWaveHydrating =
    targetWaveId !== null &&
    targetWaveId === myStream?.activeWave.id &&
    (waveMessages === undefined || waveMessages.isLoading);
  const currentPresentationDrop = maybeDrop ?? waveMessagesDrop ?? null;
  let authoritativeModeratedDrop: ApiDrop | null = null;
  if (isModeratedPresentation(maybeDrop)) {
    authoritativeModeratedDrop = maybeDrop;
  } else if (isModeratedPresentation(waveMessagesDrop)) {
    authoritativeModeratedDrop = waveMessagesDrop;
  }

  let initialDrop = currentPresentationDrop;
  if (initialDrop === null && !isActiveWaveHydrating) {
    initialDrop = cachedDrop ?? null;
  }

  const { data: drop, error } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(normalizedDropId),
    queryFn: () => fetchDropByIdBatched(normalizedDropId),
    placeholderData: keepPreviousData,
    enabled: normalizedDropId.length > 0 && initialDrop === null,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
    ...(initialDrop === null ? {} : { initialData: initialDrop }),
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
