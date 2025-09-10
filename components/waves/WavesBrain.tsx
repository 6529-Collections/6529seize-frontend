import { ReactNode } from "react";
import WavesMobile from "./WavesMobile";
import WavesDesktop from "./WavesDesktop";
import useDeviceInfo from "../../hooks/useDeviceInfo";

export default function WavesBrain({ children }: { readonly children: ReactNode }) {
  const { isApp } = useDeviceInfo();

  return isApp ? (
    <WavesMobile>{children}</WavesMobile>
  ) : (
    <WavesDesktop>{children}</WavesDesktop>
  );
}