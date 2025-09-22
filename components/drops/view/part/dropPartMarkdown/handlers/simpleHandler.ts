import type { ReactElement } from "react";

import type { LinkDisplay, LinkHandler } from "../linkTypes";

interface CreateSimpleHandlerConfig {
  readonly match: (href: string) => boolean;
  readonly render: (href: string) => ReactElement;
  readonly display?: LinkDisplay;
}

export const createSimpleHandler = ({
  match,
  render,
  display = "block",
}: CreateSimpleHandlerConfig): LinkHandler<string> => ({
  match: (href) => (match(href) ? href : null),
  render: (_payload, context) => render(context.href),
  display,
});
