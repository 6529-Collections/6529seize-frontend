"use client";

import React from "react";

import WaveDropQuote from "./WaveDropQuote";
import { useQuery } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchQuorumParticipationDropPreviewBySerialNoV2 } from "@/services/api/quorum-participation-drop-preview-v2-api";

interface WaveDropQuoteWithSerialNoProps {
  readonly serialNo: number;
  readonly waveId: string;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
}

const WaveDropQuoteWithSerialNo: React.FC<WaveDropQuoteWithSerialNoProps> = ({
  serialNo,
  waveId,
  onQuoteClick,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  onLinkCardActionsActiveChange,
}) => {
  const { data: drop = null } = useQuery<ApiDrop | null>({
    queryKey: [
      QueryKey.DROP,
      "wave-drop-quote-serial",
      {
        waveId,
        serialNo,
      },
    ],
    queryFn: async () =>
      fetchQuorumParticipationDropPreviewBySerialNoV2({
        waveId,
        serialNo,
      }),
  });

  return (
    <WaveDropQuote
      drop={drop}
      partId={1}
      onQuoteClick={onQuoteClick}
      embedPath={embedPath}
      quotePath={quotePath}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
      hideLinkPreviews={drop?.hide_link_preview === true}
      onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
    />
  );
};

export default WaveDropQuoteWithSerialNo;
