import { parsePepeLink, renderPepeLink } from "../pepe";
import type { LinkHandler } from "../linkTypes";

export const createPepeHandler = (): LinkHandler => ({
  match: (href) => Boolean(parsePepeLink(href)),
  render: (href) => {
    const parsed = parsePepeLink(href);
    if (!parsed) {
      throw new Error("Invalid Pepe link");
    }

    return renderPepeLink(parsed);
  },
  display: "block",
});
