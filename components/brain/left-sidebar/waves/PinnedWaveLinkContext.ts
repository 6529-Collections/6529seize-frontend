import { createContext, type ComponentPropsWithRef } from "react";

export const PinnedWaveLinkContext = createContext<
  | Pick<
      ComponentPropsWithRef<"a">,
      "ref" | "onKeyDown" | "aria-describedby" | "aria-keyshortcuts"
    >
  | undefined
>(undefined);
