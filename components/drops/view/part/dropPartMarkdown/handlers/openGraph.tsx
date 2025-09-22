import { shouldUseOpenGraphPreview } from "../linkUtils";
import type { LinkHandler } from "../linkTypes";

export const createOpenGraphHandler = (): LinkHandler<string> => ({
  match: (href) => (shouldUseOpenGraphPreview(href) ? href : null),
  render: (_payload, context) => context.renderOpenGraph() ?? context.renderFallbackAnchor(),
  display: "block",
});

export type OpenGraphHandler = ReturnType<typeof createOpenGraphHandler>;
