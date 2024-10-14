import React, { useEffect, useState } from "react";

import WaveDetailedDropQuote from "./WaveDetailedDropQuote";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { WaveDropsSearchStrategy } from "../../../../hooks/useWaveDrops";
import { ApiWaveDropsFeed } from "../../../../generated/models/ApiWaveDropsFeed";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

interface WaveDetailedDropQuoteWithSerialNoProps {
  readonly serialNo: number;
  readonly waveId: string;
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDetailedDropQuoteWithSerialNo: React.FC<
  WaveDetailedDropQuoteWithSerialNoProps
> = ({ serialNo, waveId, onQuoteClick }) => {
  const { data } = useQuery<ApiWaveDropsFeed>({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: waveId,
        limit: 1,
        dropId: null,
        serialNo,
        strategy: WaveDropsSearchStrategy.FIND_BOTH,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
        serial_no_limit: `${serialNo}`,
        search_strategy: WaveDropsSearchStrategy.FIND_BOTH,
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
    <WaveDetailedDropQuote drop={drop} partId={1} onQuoteClick={onQuoteClick} />
  );
};

export default WaveDetailedDropQuoteWithSerialNo;
