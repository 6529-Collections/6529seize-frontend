"use client";

import React, { useEffect, useState } from "react";

import WaveDropQuote from "./WaveDropQuote";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { WaveDropsSearchStrategy } from "@/contexts/wave/hooks/types";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
interface WaveDropQuoteWithSerialNoProps {
  readonly serialNo: number;
  readonly waveId: string;
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDropQuoteWithSerialNo: React.FC<WaveDropQuoteWithSerialNoProps> = ({
  serialNo,
  waveId,
  onQuoteClick,
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
  return <WaveDropQuote drop={drop} partId={1} onQuoteClick={onQuoteClick} />;
};

export default WaveDropQuoteWithSerialNo;
