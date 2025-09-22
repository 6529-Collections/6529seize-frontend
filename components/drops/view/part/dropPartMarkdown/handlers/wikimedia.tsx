import WikimediaCard from "@/components/waves/WikimediaCard";
import { parseWikimediaLink } from "@/src/services/wikimedia/url";
import type { LinkHandler } from "../linkTypes";

export const createWikimediaHandler = (): LinkHandler<string> => ({
  match: (href) => (parseWikimediaLink(href) ? href : null),
  render: (_payload, context) => <WikimediaCard href={context.href} />,
  display: "block",
});

export type WikimediaHandler = ReturnType<typeof createWikimediaHandler>;
