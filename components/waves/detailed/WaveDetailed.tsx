import { Wave } from "../../../generated/models/Wave";
import { useEffect, useState } from "react";
import WaveDetailedDesktop from "./WaveDetailedDesktop";
import { createBreakpoint } from "react-use";
import WaveDetailedMobile from "./WaveDetailedMobile";

export enum WaveDetailedView {
  CONTENT = "CONTENT",
  FOLLOWERS = "FOLLOWERS",
}

interface WaveDetailedProps {
  readonly wave: Wave;
}

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

export default function WaveDetailed({ wave }: WaveDetailedProps) {
  const [activeView, setActiveView] = useState<WaveDetailedView>(
    WaveDetailedView.CONTENT
  );

  const breakpoint = useBreakpoint();

  return breakpoint !== "MD" ? (
    <WaveDetailedMobile wave={wave} view={activeView} setView={setActiveView} />
  ) : (
    <WaveDetailedDesktop
      wave={wave}
      view={activeView}
      setView={setActiveView}
    />
  );
}
