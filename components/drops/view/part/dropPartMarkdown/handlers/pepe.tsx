import { parsePepeLink, renderPepeLink, type PepeLinkResult } from "../pepe";
import type { LinkHandler } from "../linkTypes";

export const createPepeHandler = (): LinkHandler<PepeLinkResult> => ({
  match: parsePepeLink,
  render: (payload) => renderPepeLink(payload),
  display: "block",
  blockOpenGraphFallback: true,
});

export type PepeHandler = ReturnType<typeof createPepeHandler>;
