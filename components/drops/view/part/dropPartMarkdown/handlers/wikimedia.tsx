import WikimediaCard from "@/components/waves/WikimediaCard";
import { parseWikimediaLink } from "@/src/services/wikimedia/url";

import type { LinkHandler } from "../linkTypes";

export const createWikimediaHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseWikimediaLink(href)),
  render: (href) => <WikimediaCard href={href} />,
  display: "block",
});
