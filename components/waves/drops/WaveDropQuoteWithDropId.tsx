"use client";

import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
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
  onQuoteClick,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  onLinkCardActionsActiveChange,
}) => {
  const normalizedDropId = dropId.trim();

  const { data: drop, error } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(normalizedDropId),
    queryFn: () => fetchDropByIdBatched(normalizedDropId),
    placeholderData: keepPreviousData,
    enabled: normalizedDropId.length > 0,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
    ...(maybeDrop === null
      ? {}
      : { initialData: maybeDrop, initialDataUpdatedAt: 0 }),
  });

  const resolvedDrop = isDropNotFoundError(error, normalizedDropId)
    ? null
    : (drop ?? null);

  return (
    <WaveDropQuote
      drop={resolvedDrop}
      partId={partId}
      onQuoteClick={onQuoteClick}
      embedPath={embedPath}
      quotePath={quotePath}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
      onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
    />
  );
};

export default WaveDropQuoteWithDropId;
