"use client";

import React from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";
import WaveDropQuote from "./WaveDropQuote";

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
  const cachedDrop = queryClient.getQueryData<ApiDrop>(
    getDropQueryKey(normalizedDropId)
  );
  const targetWaveId = waveId ?? myStream?.activeWave.id ?? null;
  const waveMessagesDrop = targetWaveId
    ? myStream?.waveMessagesStore
        .getData(targetWaveId)
        ?.drops.find(
          (drop): drop is ExtendedDrop =>
            drop.type === DropSize.FULL && drop.id === normalizedDropId
        )
    : null;
  const initialDrop = maybeDrop ?? cachedDrop ?? waveMessagesDrop ?? null;

  const { data: drop, error } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(normalizedDropId),
    queryFn: () => fetchDropByIdBatched(normalizedDropId),
    placeholderData: keepPreviousData,
    enabled: normalizedDropId.length > 0 && initialDrop === null,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
    ...(initialDrop === null ? {} : { initialData: initialDrop }),
  });

  const isNotFound = isDropNotFoundError(error, normalizedDropId);
  const resolvedDrop = isNotFound ? null : (drop ?? null);

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
