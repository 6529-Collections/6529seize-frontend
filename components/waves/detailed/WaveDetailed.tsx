import { ApiWave } from "../../../generated/models/ApiWave";
import { useState, useEffect } from "react";
import WaveDetailedDesktop from "./WaveDetailedDesktop";
import { createBreakpoint } from "react-use";
import WaveDetailedMobile from "./WaveDetailedMobile";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

export enum WaveDetailedView {
  CHAT = "CHAT",
  LEADERBOARD = "LEADERBOARD",
  FOLLOWERS = "FOLLOWERS",
  OUTCOME = "OUTCOME",
}

interface WaveDetailedProps {
  readonly wave: ApiWave;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function WaveDetailed({ wave }: WaveDetailedProps) {
  const [activeView, setActiveView] = useState<WaveDetailedView>(
    WaveDetailedView.CHAT
  );

  const [activeWave, setActiveWave] = useState<ApiWave>(wave);
  const [activeDrop, setActiveDrop] = useState<ExtendedDrop | null>(null);

  useEffect(() => {
    setActiveWave(wave);
  }, [wave]);

  const handleWaveChange = (newWave: ApiWave) => {
    setActiveWave(newWave);
    setActiveView(WaveDetailedView.CHAT);
  };

  const breakpoint = useBreakpoint();

  return breakpoint !== "LG" ? (
    <WaveDetailedMobile
      wave={activeWave}
      setView={setActiveView}
      activeDrop={activeDrop}
      setActiveDrop={setActiveDrop}
      onWaveChange={handleWaveChange}
      setIsLoading={() => {}}
    />
  ) : (
    <WaveDetailedDesktop
      wave={activeWave}
      view={activeView}
      setView={setActiveView}
      activeDrop={activeDrop}
      setActiveDrop={setActiveDrop}
      onWaveChange={handleWaveChange}
      setIsLoading={() => {}}
    />
  );
}
