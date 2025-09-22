import WikimediaCard from "@/components/waves/WikimediaCard";
import { parseWikimediaLink } from "@/src/services/wikimedia/url";

import { createSimpleHandler } from "./simpleHandler";

export const createWikimediaHandler = () =>
  createSimpleHandler({
    match: (href) => Boolean(parseWikimediaLink(href)),
    render: (href) => <WikimediaCard href={href} />,
  });
