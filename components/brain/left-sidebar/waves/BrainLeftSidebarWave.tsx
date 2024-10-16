import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeAgoShort } from "../../../../helpers/Helpers";

interface BrainLeftSidebarWaveProps {
  readonly wave: ApiWave;
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWave: React.FC<BrainLeftSidebarWaveProps> = ({
  wave,
  activeWaveId,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const getHref = (waveId: string) => {
    const currentWaveId = router.query.wave as string | undefined;
    if (currentWaveId === waveId) {
      return "/my-stream";
    }
    return `/my-stream?wave=${waveId}`;
  };

  const onHover = (waveId: string) => {
    if (waveId === activeWaveId) return;

    // queryClient.prefetchQuery({
    //   queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    //   queryFn: async () =>
    //     await commonApiFetch<ApiWave>({
    //       endpoint: `waves/${waveId}`,
    //     }),
    //   staleTime: 60000,
    // });
    // queryClient.prefetchInfiniteQuery({
    //   queryKey: [
    //     QueryKey.DROPS,
    //     {
    //       waveId: waveId,
    //       limit: WAVE_DROPS_PARAMS.limit,
    //       dropId: null,
    //     },
    //   ],
    //   queryFn: async ({ pageParam }: { pageParam: number | null }) => {
    //     const params: Record<string, string> = {
    //       limit: WAVE_DROPS_PARAMS.limit.toString(),
    //     };

    //     if (pageParam) {
    //       params.serial_no_less_than = `${pageParam}`;
    //     }
    //     return await commonApiFetch<ApiWaveDropsFeed>({
    //       endpoint: `waves/${waveId}/drops`,
    //       params,
    //     });
    //   },
    //   initialPageParam: null,
    //   getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
    //   pages: 1,
    //   staleTime: 60000,
    // });
  };

  const isActive = wave.id === activeWaveId;

  return (
    <div
      key={wave.id}
      className={`tw-py-2 tw-px-5 ${
        isActive ? "tw-bg-primary-300/5 tw-text-iron-50" : ""
      } `}
    >
      <Link
        href={getHref(wave.id)}
        onMouseEnter={() => onHover(wave.id)}
        className="tw-ml-1 tw-no-underline tw-flex tw-items-center tw-text-iron-200 tw-font-medium tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out group"
      >
        <div
          className={`tw-mr-3 tw-flex-shrink-0 tw-size-8 tw-rounded-full tw-relative ${
            isActive
              ? "tw-ring-1 tw-ring-primary-400"
              : "tw-ring-1 tw-ring-white/10"
          }`}
        >
          {wave.picture && (
            <img
              src={wave.picture}
              alt={wave.name}
              className="tw-w-full tw-h-full tw-rounded-full tw-object-contain"
            />
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

export default BrainLeftSidebarWave;
