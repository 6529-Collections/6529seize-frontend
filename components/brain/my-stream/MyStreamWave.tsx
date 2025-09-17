"use client";

import React, { type JSX, useMemo } from "react";
import { useSetWaveData } from "../../../contexts/TitleContext";
import { useContentTab } from "../ContentTabContext";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import { useWaveData } from "../../../hooks/useWaveData";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { createBreakpoint } from "react-use";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { WaveWinners } from "../../waves/winners/WaveWinners";
import { MyStreamWaveTab } from "../../../types/waves.types";
import { MyStreamWaveTabs } from "./tabs/MyStreamWaveTabs";
import MyStreamWaveMyVotes from "./votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "./MyStreamWaveFAQ";
import { useMyStream } from "../../../contexts/wave/MyStreamContext";

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { waves, directMessages } = useMyStream();
  const { data: wave } = useWaveData({
    waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('wave');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '/my-stream');
      router.push(newUrl, { scroll: false });
    },
  });

  // Get new drops count from the waves list
  const newDropsCount = useMemo(() => {
    // Check both regular waves and direct messages
    const waveFromList =
      waves.list.find((w) => w.id === waveId) ??
      directMessages.list.find((w) => w.id === waveId);
    return waveFromList?.newDropsCount.count ?? 0;
  }, [waves.list, directMessages.list, waveId]);

  // Update wave data in title context
  useSetWaveData(
    wave ? { name: wave.name, newItemsCount: newDropsCount } : null
  );

  // Create a stable key for proper remounting
  const stableWaveKey = `wave-${waveId}`;

  // Get the active tab and utilities from global context
  const { activeContentTab } = useContentTab();

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
    [MyStreamWaveTab.CHAT]: <MyStreamWaveChat wave={wave} />,
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
      className="tailwind-scope tw-relative tw-flex tw-flex-col tw-h-full"
      key={stableWaveKey}>
      {/* Don't render tab container for simple waves */}
      {breakpoint !== "S" && <MyStreamWaveTabs wave={wave} />}

      <div
        className="tw-flex-grow tw-overflow-hidden"
        role="tabpanel"
        id={getContentTabPanelId(activeContentTab)}
      >
        {components[activeContentTab]}
      </div>
    </div>
  );
};

export default React.memo(MyStreamWave);
