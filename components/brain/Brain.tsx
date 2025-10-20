import { ReactNode } from "react";
import BrainMobile from "./BrainMobile";
import BrainDesktop from "./BrainDesktop";
import useDeviceInfo from "../../hooks/useDeviceInfo";

export default function Brain({ children }: { readonly children: ReactNode }) {
  const { isApp } = useDeviceInfo();

  return isApp ? (
    <BrainMobile>{children}</BrainMobile>
  ) : (
    <BrainDesktop>{children}</BrainDesktop>
  );
}
