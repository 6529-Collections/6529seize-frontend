import React from "react";
import WaveSingleDrop from "./WaveSingleDrop";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useQuery } from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import { commonApiFetch } from "../../../../services/api/common-api";
import { WaveDropsFeed } from "../../../../generated/models/WaveDropsFeed";

interface WaveDropThreadTraceProps {
  readonly rootDropId: string;
  readonly wave: Wave;
}

const WaveDropThreadTrace: React.FC<WaveDropThreadTraceProps> = ({
  rootDropId,
  wave,
}) => {
  const { data } = useQuery({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: wave.id,
        limit: 1,
        dropId: rootDropId,
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: "1",
        drop_id: rootDropId,
      };
      if (rootDropId) {
        params.drop_id = rootDropId;
      }
      return await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${wave.id}/drops`,
        params,
      });
    },
  });

  if (!data?.trace) {
    return null;
  }

  return (
    <>
      {data.trace?.map((drop, index) => (
        <div
          className="tw-relative"
          key={`wave-drop-thread-trace-${drop.drop_id}`}
        >
          {index !== (data.trace?.length ?? 0) - 1 && (
            <div className="tw-absolute tw-left-9 tw-top-2 tw-bottom-0 tw-w-[1px] tw-bg-iron-700"></div>
          )}
          <WaveSingleDrop dropId={drop.drop_id} />
        </div>
      )) ?? null}
    </>
  );
};

export default WaveDropThreadTrace;
