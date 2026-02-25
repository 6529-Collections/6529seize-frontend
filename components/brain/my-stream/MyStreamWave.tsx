"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { type JSX, useMemo } from "react";
import { createBreakpoint } from "react-use";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import { useSetWaveData } from "@/contexts/TitleContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getHomeRoute, getWaveHomeRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { useWaveViewMode } from "@/hooks/useWaveViewMode";
import { MyStreamWaveTab } from "@/types/waves.types";

import { useContentTab } from "../ContentTabContext";

import MyStreamWaveChat from "./MyStreamWaveChat";
import MyStreamWaveFAQ from "./MyStreamWaveFAQ";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { MyStreamWaveTabs } from "./tabs/MyStreamWaveTabs";
import MyStreamWaveMyVotes from "./votes/MyStreamWaveMyVotes";


interface MyStreamWaveProps {
  readonly waveId: string;
}

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const queryClient = useQueryClient();
  const { waves, directMessages } = useMyStream();
  const { data: wave } = useWaveData({
    waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams.toString() || "");
      params.delete("wave");
      const basePath = getWaveHomeRoute({
        isDirectMessage: pathname.startsWith("/messages"),
        isApp,
      });
      const newUrl = params.toString()
        ? `${basePath}?${params.toString()}`
        : basePath || getHomeRoute();
      router.push(newUrl, { scroll: false });
    },
  });

  // Get enhanced data from the waves list (has correct WS-updated values)
  const enhancedData = useMemo(() => {
    const waveFromList =
      waves.list.find((w) => w.id === waveId) ??
      directMessages.list.find((w) => w.id === waveId);
    return {
      newDropsCount: waveFromList?.newDropsCount.count ?? 0,
      firstUnreadSerialNo: waveFromList?.firstUnreadDropSerialNo ?? null,
    };
  }, [waves.list, directMessages.list, waveId]);

  const newDropsCount = enhancedData.newDropsCount;

  // Update wave data in title context
  useSetWaveData(
    wave ? { name: wave.name, newItemsCount: newDropsCount } : null
  );

  // Create a stable key for proper remounting
  const stableWaveKey = `wave-${waveId}`;

  // Get the active tab and utilities from global context
  const { activeContentTab } = useContentTab();

  // View mode for chat/gallery toggle
  const { viewMode, toggleViewMode } = useWaveViewMode(waveId);

  // Get wave type info to determine if gallery toggle should be shown
  // Show for CHAT type waves (normal waves), hide for RANK, MEMES, and DMs
  const { isRankWave, isMemesWave, isDm } = useWave(wave);
  const showGalleryToggle = !isRankWave && !isMemesWave && !isDm;

  useBreakpoint();

  // For handling clicks on drops
  const onDropClick = (drop: ExtendedDrop) => {
    queryClient.setQueryData<ApiDrop>(
      [QueryKey.DROP, { drop_id: drop.id }],
      drop as ApiDrop
    );
    const params = new URLSearchParams(searchParams.toString() || "");
    params.set("drop", drop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Early return if no wave data - all hooks must be called before this
  if (!wave) {
    return null;
  }

  // Create component instances with wave-specific props and stable measurements
  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: (
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={enhancedData.firstUnreadSerialNo}
        viewMode={showGalleryToggle ? viewMode : "chat"}
        onDropClick={onDropClick}
      />
    ),
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.WINNERS]: (
      <WaveWinners wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.OUTCOME]: <MyStreamWaveOutcome wave={wave} />,
    [MyStreamWaveTab.MY_VOTES]: (
      <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.FAQ]: <MyStreamWaveFAQ wave={wave} />,
  };

  return (
    <div
      className="tailwind-scope tw-relative tw-flex tw-h-full tw-flex-col"
      key={stableWaveKey}
    >
      {/* Always render tab container (hidden on app inside MyStreamWaveTabs) */}
      <MyStreamWaveTabs
        wave={wave}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        showGalleryToggle={showGalleryToggle}
      />

      <div
        className="tw-relative tw-flex-grow tw-overflow-hidden"
        role="tabpanel"
        id={getContentTabPanelId(activeContentTab)}
      >
        {components[activeContentTab]}
      </div>
    </div>
  );
};

export default React.memo(MyStreamWave);
