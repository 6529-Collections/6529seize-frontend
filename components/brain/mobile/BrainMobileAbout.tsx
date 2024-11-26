import React, { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { WaveHeaderPinnedSide } from "../../waves/detailed/header/WaveHeader";
import { ApiWave } from "../../../generated/models/ApiWave";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import WaveHeader from "../../waves/detailed/header/WaveHeader";
import BrainRightSidebarContent from "../right-sidebar/BrainRightSidebarContent";
import BrainRightSidebarFollowers from "../right-sidebar/BrainRightSidebarFollowers";
import useCapacitor from "../../../hooks/useCapacitor";

interface BrainMobileAboutProps {
  readonly activeWaveId: string | null;
}

enum Mode {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

const BrainMobileAbout: React.FC<BrainMobileAboutProps> = ({
  activeWaveId,
}) => {
  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: activeWaveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${activeWaveId}`,
      }),
    enabled: !!activeWaveId,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const [mode, setMode] = useState<Mode>(Mode.CONTENT);
  const capacitor = useCapacitor();

  const containerClassName = `tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-divide-y tw-divide-solid tw-divide-iron-800 tw-divide-x-0${
    capacitor.isCapacitor ? " tw-pb-[calc(4rem+80px)]" : ""
  }`;

  const onFollowersClick = () => {
    if (mode === Mode.FOLLOWERS) {
      setMode(Mode.CONTENT);
    } else {
      setMode(Mode.FOLLOWERS);
    }
  };

  return (
    <div className={containerClassName}>
      {wave && (
        <>
          <WaveHeader
            wave={wave}
            onFollowersClick={onFollowersClick}
            useRing={false}
            useRounded={false}
            pinnedSide={WaveHeaderPinnedSide.LEFT}
          />
          {mode === Mode.CONTENT && <BrainRightSidebarContent wave={wave} />}
          {mode === Mode.FOLLOWERS && (
            <BrainRightSidebarFollowers
              wave={wave}
              closeFollowers={() => setMode(Mode.CONTENT)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default BrainMobileAbout;
