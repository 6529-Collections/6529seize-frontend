import { Wave } from "../../../generated/models/Wave";
import { useState } from "react";
import WaveDetailedDesktop from "./WaveDetailedDesktop";
import { createBreakpoint } from "react-use";
import WaveDetailedMobile from "./WaveDetailedMobile";

export enum WaveDetailedView {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

interface WaveDetailedProps {
  readonly wave: Wave;
  readonly isFetching: boolean;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function WaveDetailed({ wave, isFetching }: WaveDetailedProps) {
  const [activeView, setActiveView] = useState<WaveDetailedView>(
    WaveDetailedView.CONTENT
  );

  const breakpoint = useBreakpoint();

  return breakpoint !== "LG" ? (
    <WaveDetailedMobile wave={wave} view={activeView} setView={setActiveView} />
  ) : (
    <WaveDetailedDesktop
      wave={wave}
      isFetching={isFetching}
      view={activeView}
      setView={setActiveView}
    />
  );
}
