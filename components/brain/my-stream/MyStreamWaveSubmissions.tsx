"use client";

import React, { useCallback } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useLayout } from "./layout/LayoutContext";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveCurationGroupSelection } from "@/hooks/waves/useWaveCurationGroupSelection";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ParticipationDrop from "@/components/waves/drops/participation/ParticipationDrop";
import { DropLocation } from "@/components/waves/drops/drop.types";
import { WaveLeaderboardLoading } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoading";
import { WaveLeaderboardLoadingBar } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar";

interface MyStreamWaveSubmissionsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveSubmissions: React.FC<MyStreamWaveSubmissionsProps> = ({
  wave,
  onDropClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { leaderboardViewStyle } = useLayout();
  const { curatedByGroupId } = useWaveCurationGroupSelection({ wave });
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      sort: WaveDropsLeaderboardSort.RANK,
      curatedByGroupId,
    });
  const handleReply = useCallback(() => undefined, []);

  const openDropById = useCallback(
    (dropId: string) => {
      const params = new URLSearchParams(searchParams.toString() || "");
      params.set("drop", dropId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleQuoteClick = useCallback(
    (drop: ApiDrop) => {
      openDropById(drop.id);
    },
    [openDropById]
  );

  const handleIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetching || isFetchingNextPage) {
        return;
      }

      void fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]
  );
  const intersectionElementRef = useIntersectionObserver(handleIntersection);

  let content: React.ReactNode;
  if (isFetching && drops.length === 0) {
    content = <WaveLeaderboardLoading />;
  } else if (drops.length === 0) {
    content = (
      <div className="tw-mt-10">
        <p className="tw-text-center tw-text-sm tw-text-iron-500">
          No submissions to show.
        </p>
      </div>
    );
  } else {
    content = (
      <div className="tw-mt-4 tw-space-y-2">
        {drops.map((drop) => (
          <ParticipationDrop
            key={drop.id}
            drop={drop}
            showWaveInfo={false}
            activeDrop={null}
            showReplyAndQuote={false}
            location={DropLocation.WAVE}
            onReply={handleReply}
            onQuoteClick={handleQuoteClick}
            onDropContentClick={onDropClick}
          />
        ))}
        {isFetchingNextPage && <WaveLeaderboardLoadingBar />}
        <div ref={intersectionElementRef}></div>
      </div>
    );
  }

  return (
    <div
      className="tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4 lg:tw-space-y-6"
      style={leaderboardViewStyle}
    >
      {content}
    </div>
  );
};

export default MyStreamWaveSubmissions;
