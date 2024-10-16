import { ApiWave } from "../../../generated/models/ApiWave";
import { useState, useEffect } from "react";
import WaveDetailedDesktop from "./WaveDetailedDesktop";
import { createBreakpoint } from "react-use";
import WaveDetailedMobile from "./WaveDetailedMobile";

export enum WaveDetailedView {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

interface WaveDetailedProps {
  readonly wave: ApiWave;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function WaveDetailed({ wave }: WaveDetailedProps) {
  const [activeView, setActiveView] = useState<WaveDetailedView>(
    WaveDetailedView.CONTENT
  );

  const [activeWave, setActiveWave] = useState(wave);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setActiveWave(wave);
  }, [wave]);

  const handleWaveChange = (newWave: ApiWave) => {
    setIsLoading(true);
    setActiveWave(newWave);
    setActiveView(WaveDetailedView.CONTENT);
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
      onWaveChange={handleWaveChange}
      setIsLoading={setIsLoading}
    />
  ) : (
    <WaveDetailedDesktop
      wave={activeWave}
      view={activeView}
      setView={setActiveView}
      onWaveChange={handleWaveChange}
      setIsLoading={setIsLoading}
    />
  );
}
