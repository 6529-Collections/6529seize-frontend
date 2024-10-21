import { ReactNode } from "react";

import { createBreakpoint } from "react-use";
import BrainMobile from "./BrainMobile";
import BrainDesktop from "./BrainDesktop";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function Brain({ children }: { readonly children: ReactNode }) {
  const breakpoint = useBreakpoint();

  return breakpoint === "S" ? (
    <BrainMobile>{children}</BrainMobile>
  ) : (
    <BrainDesktop>{children}</BrainDesktop>
  );
}
