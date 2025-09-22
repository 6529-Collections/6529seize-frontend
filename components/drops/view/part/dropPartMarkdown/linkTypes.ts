import { ApiDrop } from "../../../../../generated/models/ApiDrop";

export type LinkDisplay = "block" | "inline";

export interface LinkRenderContext {
  readonly href: string;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly parsedUrl: URL | null;
  readonly renderOpenGraph: () => React.ReactElement;
  readonly renderDefault: () => React.ReactElement;
}

export interface LinkHandler<TPayload = unknown> {
  readonly match: (href: string) => TPayload | null;
  readonly render: (payload: TPayload, context: LinkRenderContext) => React.ReactElement;
  readonly display: LinkDisplay;
}
