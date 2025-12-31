"use client";

import React, { type JSX, useMemo } from "react";
import { useSetWaveData } from "@/contexts/TitleContext";
import { useContentTab } from "../ContentTabContext";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import { useWaveData } from "@/hooks/useWaveData";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { WaveWinners } from "@/components/waves/winners/WaveWinners";
import { MyStreamWaveTab } from "@/types/waves.types";
import { MyStreamWaveTabs } from "./tabs/MyStreamWaveTabs";
import MyStreamWaveMyVotes from "./votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "./MyStreamWaveFAQ";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { createBreakpoint } from "react-use";
import { getHomeFeedRoute } from "@/helpers/navigation.helpers";
import { WaveChatScrollProvider } from "@/contexts/wave/WaveChatScrollContext";

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
  const { waves, directMessages } = useMyStream();
  const { data: wave } = useWaveData({
    waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('wave');
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : (pathname || getHomeFeedRoute());
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

  useBreakpoint();

  // For handling clicks on drops
  const onDropClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('drop', drop.id);
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
    <WaveChatScrollProvider>
      <div
        className="tailwind-scope tw-relative tw-flex tw-flex-col tw-h-full"
        key={stableWaveKey}>
        {/* Always render tab container (hidden on app inside MyStreamWaveTabs) */}
        <MyStreamWaveTabs wave={wave} />

        <div
          className="tw-flex-grow tw-overflow-hidden tw-relative"
          role="tabpanel"
          id={getContentTabPanelId(activeContentTab)}
        >
          {components[activeContentTab]}
        </div>
      </div>
    </WaveChatScrollProvider>
  );
};

export default React.memo(MyStreamWave);
