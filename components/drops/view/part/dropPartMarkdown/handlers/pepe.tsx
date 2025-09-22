import { parsePepeLink, renderPepeLink } from "../pepe";
import type { LinkHandler } from "../linkTypes";

export const createPepeHandler = (): LinkHandler => ({
  match: (href) => Boolean(parsePepeLink(href)),
  render: (href) => renderPepeLink(href),
  display: "block",
});
