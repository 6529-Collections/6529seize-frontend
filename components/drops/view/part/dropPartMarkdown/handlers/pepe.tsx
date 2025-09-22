import { parsePepeLink, renderPepeLink } from "../pepe";
import { createSimpleHandler } from "./simpleHandler";

export const createPepeHandler = () =>
  createSimpleHandler({
    match: (href) => Boolean(parsePepeLink(href)),
    render: (href) => renderPepeLink(href),
  });
