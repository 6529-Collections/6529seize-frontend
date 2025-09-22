import { type AnchorHTMLAttributes } from "react";
import { ExtraProps } from "react-markdown";

import { ApiDrop } from "../../../../../generated/models/ApiDrop";

export type LinkDisplay = "block" | "inline";

export interface LinkRenderContext {
  readonly href: string;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly parsedUrl: URL | null;
  readonly renderOpenGraph: () => React.ReactElement;
}

export interface LinkHandler<TPayload = unknown> {
  readonly match: (href: string) => TPayload | null;
  readonly render: (
    payload: TPayload,
    context: LinkRenderContext,
    anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps
  ) => React.ReactElement;
  readonly display: LinkDisplay;
}
