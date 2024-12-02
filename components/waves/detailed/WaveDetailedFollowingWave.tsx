import React from "react";
import Link from "next/link";
import { ApiWave } from "../../../generated/models/ApiWave";
import { getTimeAgoShort } from "../../../helpers/Helpers";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { ApiWaveDropsFeed } from "../../../generated/models/ApiWaveDropsFeed";
import router from "next/router";
import { WAVE_DROPS_PARAMS } from "../../react-query-wrapper/utils/query-utils";
import { ApiWaveType } from "../../../generated/models/ObjectSerializer";

interface WaveDetailedFollowingWaveProps {
  readonly wave: ApiWave;
  readonly activeWaveId: string;
  readonly newDropsCounts: Record<string, number>;
  readonly resetWaveCount: (waveId: string) => void;
  readonly onWaveChange: () => void;
}

const WaveDetailedFollowingWave: React.FC<WaveDetailedFollowingWaveProps> = ({
  wave,
  activeWaveId,
  newDropsCounts,
  resetWaveCount,
  onWaveChange,
}) => {
  const queryClient = useQueryClient();
  const isDropWave = wave.wave.type !== ApiWaveType.Chat;
  const isActive = wave.id === activeWaveId;

  const getRingStyles = () => {
    if (isActive) return "tw-ring-2 tw-ring-primary-400";
    if (isDropWave) return "tw-ring-2 tw-ring-blue-400/40";
    return "tw-ring-1 tw-ring-inset tw-ring-white/10";
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    waveId: string
  ) => {
    e.preventDefault();
    resetWaveCount(waveId);
    onWaveChange();
    router.push(`/waves/${waveId}`, undefined, { shallow: true });
  };

  const onHover = (waveId: string) => {
    if (waveId === activeWaveId) return;

    queryClient.prefetchQuery({
      queryKey: [QueryKey.WAVE, { wave_id: waveId }],
      queryFn: async () =>
        await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
        }),
      staleTime: 60000,
    });
    queryClient.prefetchInfiniteQuery({
      queryKey: [
        QueryKey.DROPS,
        {
          waveId: waveId,
          limit: WAVE_DROPS_PARAMS.limit,
          dropId: null,
        },
      ],
      queryFn: async ({ pageParam }: { pageParam: number | null }) => {
        const params: Record<string, string> = {
          limit: WAVE_DROPS_PARAMS.limit.toString(),
        };

        if (pageParam) {
          params.serial_no_less_than = `${pageParam}`;
        }
        return await commonApiFetch<ApiWaveDropsFeed>({
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
    <div
      key={wave.id}
      className={`tw-py-2 tw-px-5 ${
        isActive ? "tw-bg-primary-300/5 tw-text-iron-50" : ""
      } `}
    >
      <Link
        href={`/waves/${wave.id}`}
        onClick={(e) => handleClick(e, wave.id)}
        onMouseEnter={() => onHover(wave.id)}
        className="tw-ml-1 tw-no-underline tw-flex tw-items-center tw-text-iron-200 tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group"
      >
        <div className="tw-relative tw-mr-3">
          <div
            className={`tw-flex-shrink-0 tw-size-8 tw-rounded-full tw-relative ${getRingStyles()}`}
          >
            {wave.picture && (
              <img
                src={wave.picture}
                alt={wave.name}
                className="tw-w-full tw-h-full tw-rounded-full tw-object-contain"
              />
            )}
            {isDropWave && (
              <div className="tw-absolute tw-inset-0 tw-border-2 tw-border-blue-400/40 tw-rounded-full" />
            )}
          </div>
          {isDropWave && (
            <div className="tw-absolute tw-bottom-[-2px] tw-right-[-2px] tw-size-3.5 tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-rounded-full tw-shadow-lg">
              <svg
                className="tw-size-2.5 tw-flex-shrink-0 tw-text-[#E8D48A]"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
              >
                <path
                  fill="currentColor"
                  d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                />
              </svg>
            </div>
          )}
          {wave.id !== activeWaveId && newDropsCounts[wave.id] > 0 && (
            <div className="tw-absolute -tw-top-1 -tw-right-1 tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-xs tw-animate-pulse group-hover:tw-animate-bounce">
              {newDropsCounts[wave.id]}
            </div>
          )}
        </div>
        <div className="tw-flex tw-justify-between tw-gap-x-2 tw-w-full">
          <span>{wave.name}</span>
          <div className="tw-mt-0.5 tw-text-right tw-whitespace-nowrap tw-text-xs tw-text-iron-400">
            <span>{getTimeAgoShort(wave.metrics.latest_drop_timestamp)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default WaveDetailedFollowingWave;
