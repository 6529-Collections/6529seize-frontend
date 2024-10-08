import React from "react";
import Link from "next/link";
import { Wave } from "../../../generated/models/Wave";
import { getTimeAgoShort } from "../../../helpers/Helpers";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { WaveDropsFeed } from "../../../generated/models/WaveDropsFeed";
import router from "next/router";

interface WaveDetailedFollowingWaveProps {
  readonly wave: Wave;
  readonly activeWaveId: string;
  readonly newDropsCounts: Record<string, number>;
  readonly resetWaveCount: (waveId: string) => void;
}

const WaveDetailedFollowingWave: React.FC<WaveDetailedFollowingWaveProps> = ({
  wave,
  activeWaveId,
  newDropsCounts,
  resetWaveCount,
}) => {
  const queryClient = useQueryClient();

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    waveId: string
  ) => {
    e.preventDefault();
    resetWaveCount(waveId);
    router.push(`/waves/${waveId}`, undefined, { shallow: true });
  };

  const onHover = (waveId: string) => {
    queryClient.prefetchQuery({
      queryKey: [QueryKey.WAVE, { wave_id: waveId }],
      queryFn: async () =>
        await commonApiFetch<Wave>({
          endpoint: `waves/${waveId}`,
        }),
      staleTime: 60000,
    });
    queryClient.prefetchInfiniteQuery({
      queryKey: [
        QueryKey.DROPS,
        {
          waveId: waveId,
          limit: 50,
          dropId: null,
        },
      ],
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: "50",
        };

        if (pageParam) {
          params.serial_no_less_than = `${pageParam}`;
        }
        return await commonApiFetch<WaveDropsFeed>({
          endpoint: `waves/${waveId}/drops`,
          params,
        });
      },
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
      pages: 1,
      staleTime: 60000,
    });
  };
  return (
    <div key={wave.id} className="tw-my-2">
      <Link
        href={`/waves/${wave.id}`}
        onClick={(e) => handleClick(e, wave.id)}
        onMouseEnter={() => onHover(wave.id)}
        className="tw-no-underline tw-flex tw-items-center tw-text-iron-200 tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group"
      >
        <div className="tw-mr-3 tw-flex-shrink-0 tw-size-8 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-900 tw-relative">
          {wave.picture && (
            <img
              src={wave.picture}
              alt={wave.name}
              className="tw-w-full tw-h-full tw-rounded-full tw-object-contain"
            />
          )}
          {wave.id !== activeWaveId && newDropsCounts[wave.id] > 0 && (
            <div className="tw-absolute -tw-top-1 -tw-right-1 tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-xs tw-animate-pulse group-hover:tw-animate-bounce">
              {newDropsCounts[wave.id]}
            </div>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-w-full">
          <span>{wave.name}</span>
          <div className="tw-flex tw-items-center tw-text-right tw-whitespace-nowrap tw-pr-4 tw-text-xs tw-text-iron-400">
            <span>{getTimeAgoShort(wave.metrics.latest_drop_timestamp)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default WaveDetailedFollowingWave;
