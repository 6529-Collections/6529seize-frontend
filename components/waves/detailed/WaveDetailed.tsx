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

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setActiveWave(wave);
  }, [wave]);

  const handleWaveChange = (newWave: ApiWave) => {
    setIsLoading(true);
    setActiveWave(newWave);
    setActiveView(WaveDetailedView.CHAT);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const breakpoint = useBreakpoint();

  return breakpoint !== "LG" ? (
    <WaveDetailedMobile
      wave={activeWave}
      view={activeView}
      setView={setActiveView}
      isLoading={isLoading}
      activeDrop={activeDrop}
      setActiveDrop={setActiveDrop}
      onWaveChange={handleWaveChange}
      setIsLoading={setIsLoading}
    />
  ) : (
    <WaveDetailedDesktop
      wave={activeWave}
      view={activeView}
      setView={setActiveView}
      activeDrop={activeDrop}
      setActiveDrop={setActiveDrop}
      onWaveChange={handleWaveChange}
      setIsLoading={setIsLoading}
    />
  );
}
