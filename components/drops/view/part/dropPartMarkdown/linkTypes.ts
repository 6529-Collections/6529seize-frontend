import type { ReactElement } from "react";

type LinkDisplay = "block" | "inline";

export interface LinkHandler {
  readonly match: (href: string) => boolean;
  readonly render: (href: string) => ReactElement;
  readonly display: LinkDisplay;
}
