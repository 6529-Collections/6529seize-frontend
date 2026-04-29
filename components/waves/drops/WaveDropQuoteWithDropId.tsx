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
  const { data: drop } = useQuery<ApiDrop | undefined>({
    queryKey: getDropQueryKey(dropId),
    queryFn: () => fetchDropByIdBatched(dropId),
    placeholderData: keepPreviousData,
    initialData: maybeDrop ?? undefined,
    enabled: !maybeDrop,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  return (
    <WaveDropQuote
      drop={drop ?? null}
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
