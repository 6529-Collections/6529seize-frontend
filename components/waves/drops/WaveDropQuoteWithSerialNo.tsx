"use client";

import React, { useEffect, useState } from "react";

import WaveDropQuote from "./WaveDropQuote";
import { useQuery } from "@tanstack/react-query";
import { WaveDropsSearchStrategy } from "@/contexts/wave/hooks/types";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
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
  const { data } = useQuery<ApiWaveDropsFeed>({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: waveId,
        limit: 1,
        dropId: null,
        serialNo,
        strategy: WaveDropsSearchStrategy.Both,
      },
    ],
    queryFn: async () =>
      fetchWaveDropsFeedV2({
        waveId,
        limit: 1,
        serialNoLimit: serialNo,
        searchStrategy: WaveDropsSearchStrategy.Both,
      }),
  });
  const [drop, setDrop] = useState<ApiDrop | null>(null);
  useEffect(() => {
    const targetDrop = data?.drops.find((drop) => drop.serial_no === serialNo);
    if (targetDrop && data?.wave) {
      setDrop({ ...targetDrop, wave: data.wave });
    }
  }, [data]);
  return (
    <WaveDropQuote
      drop={drop}
      partId={1}
      onQuoteClick={onQuoteClick}
      embedPath={embedPath}
      quotePath={quotePath}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
      onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
    />
  );
};

export default WaveDropQuoteWithSerialNo;
