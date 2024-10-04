import React, { useEffect } from "react";

import WaveDetailedDropQuote from "./WaveDetailedDropQuote";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { WaveDropsSearchStrategy } from "../../../../hooks/useWaveDrops";
import { WaveDropsFeed } from "../../../../generated/models/WaveDropsFeed";

interface WaveDetailedDropQuoteWithSerialNoProps {
  readonly serialNo: number;
  readonly waveId: string;
}

const WaveDetailedDropQuoteWithSerialNo: React.FC<
  WaveDetailedDropQuoteWithSerialNoProps
> = ({ serialNo, waveId }) => {
  const { data } = useQuery<WaveDropsFeed>({
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

      const results = await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${waveId}/drops`,
        params,
      });

      return results;
    },
  });
  console.log(serialNo);
  useEffect(() => console.log(data), [data]);
  return <WaveDetailedDropQuote drop={null} partId={0} />;
};

export default WaveDetailedDropQuoteWithSerialNo;
