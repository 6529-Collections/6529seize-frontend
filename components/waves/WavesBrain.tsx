import { ReactNode } from "react";
import { createBreakpoint } from "react-use";
import WavesMobile from "./WavesMobile";
import WavesDesktop from "./WavesDesktop";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function WavesBrain({ children }: { readonly children: ReactNode }) {
  const breakpoint = useBreakpoint();

  return breakpoint === "S" ? (
    <WavesMobile>{children}</WavesMobile>
  ) : (
    <WavesDesktop>{children}</WavesDesktop>
  );
}