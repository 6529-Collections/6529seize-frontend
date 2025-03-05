import React, { useEffect, useState } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import MyStreamWaveChat from "./MyStreamWaveChat";
import MyStreamWaveDesktopTabs from "./MyStreamWaveDesktopTabs";
import { useWaveData } from "../../../hooks/useWaveData";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import MyStreamWaveLeaderboard from "./MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./MyStreamWaveOutcome";
import { createBreakpoint } from "react-use";
import { useRouter } from "next/router";

export enum MyStreamWaveTab {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  OUTCOME = "OUTCOME",
}

interface MyStreamWaveProps {
  readonly waveId: string;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const MyStreamWave: React.FC<MyStreamWaveProps> = ({ waveId }) => {
  const breakpoint = useBreakpoint();
  const router = useRouter();
  const { data: wave } = useWaveData(waveId);

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const [activeTab, setActiveTab] = useState<MyStreamWaveTab>(
    MyStreamWaveTab.CHAT
  );

  useEffect(() => {
    if (wave?.wave.type === ApiWaveType.Chat) {
      setActiveTab(MyStreamWaveTab.CHAT);
    }
  }, [breakpoint, wave?.wave.type]);

  if (!wave) {
    return null;
  }

  const components: Record<MyStreamWaveTab, JSX.Element> = {
    [MyStreamWaveTab.CHAT]: <MyStreamWaveChat wave={wave} />,
    [MyStreamWaveTab.LEADERBOARD]: (
      <MyStreamWaveLeaderboard wave={wave} onDropClick={onDropClick} />
    ),
    [MyStreamWaveTab.OUTCOME]: <MyStreamWaveOutcome wave={wave} />,
  };

  return (
    <div className="tw-relative">
      {breakpoint !== "S" && wave.wave.type !== ApiWaveType.Chat && (
        <div
          className={
            activeTab === MyStreamWaveTab.CHAT
              ? "tw-absolute tw-top-0 tw-left-0 tw-z-50"
              : ""
          }
        >
          <MyStreamWaveDesktopTabs
            activeTab={activeTab}
            wave={wave}
            setActiveTab={setActiveTab}
          />
        </div>
      )}
      {components[activeTab]}
    </div>
  );
};

export default MyStreamWave;
