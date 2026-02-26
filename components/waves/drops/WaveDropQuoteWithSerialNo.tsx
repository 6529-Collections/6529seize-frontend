"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WaveDropsSearchStrategy } from "@/contexts/wave/hooks/types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import { commonApiFetch } from "@/services/api/common-api";

import WaveDropQuote from "./WaveDropQuote";
interface WaveDropQuoteWithSerialNoProps {
  readonly serialNo: number;
  readonly waveId: string;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

const WaveDropQuoteWithSerialNo: React.FC<WaveDropQuoteWithSerialNoProps> = ({
  serialNo,
  waveId,
  onQuoteClick,
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
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
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
        serial_no_limit: `${serialNo}`,
        search_strategy: WaveDropsSearchStrategy.Both,
      };

      const results = await commonApiFetch<ApiWaveDropsFeed>({
        endpoint: `waves/${waveId}/drops`,
        params,
      });

      return results;
    },
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
    />
  );
};

export default WaveDropQuoteWithSerialNo;
