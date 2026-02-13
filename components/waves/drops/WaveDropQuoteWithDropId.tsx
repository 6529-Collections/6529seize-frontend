"use client";

import React, { useContext } from "react";
import { commonApiFetch } from "@/services/api/common-api";
import { AuthContext } from "@/components/auth/Auth";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import WaveDropQuote from "./WaveDropQuote";

interface WaveDropQuoteWithDropIdProps {
  readonly dropId: string;
  readonly partId: number;
  readonly maybeDrop: ApiDrop | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly marketplaceImageOnly?: boolean | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WaveDropQuoteWithDropId: React.FC<WaveDropQuoteWithDropIdProps> = ({
  dropId,
  partId,
  maybeDrop,
  onQuoteClick,
  embedPath,
  quotePath,
  marketplaceImageOnly,
  embedDepth,
  maxEmbedDepth,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { data: drop } = useQuery<ApiDrop | undefined>({
    queryKey: [
      QueryKey.DROP,
      {
        drop_id: dropId,
        context_profile: connectedProfile?.handle,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
        params: connectedProfile?.handle
          ? { context_profile: connectedProfile.handle }
          : {},
      }),
    placeholderData: keepPreviousData,
    initialData: maybeDrop ?? undefined,
  });

  return (
    <WaveDropQuote
      drop={drop ?? null}
      partId={partId}
      onQuoteClick={onQuoteClick}
      embedPath={embedPath}
      quotePath={quotePath}
      marketplaceImageOnly={marketplaceImageOnly}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
    />
  );
};

export default WaveDropQuoteWithDropId;
