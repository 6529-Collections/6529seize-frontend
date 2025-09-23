import ArtBlocksTokenCard from "@/src/components/waves/ArtBlocksTokenCard";
import {
  parseArtBlocksLink,
  type ArtBlocksTokenIdentifier,
} from "@/src/services/artblocks/url";
import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";

import type { LinkHandler } from "../linkTypes";

const ArtBlocksPreview = ({
  href,
  tokenId,
}: {
  readonly href: string;
  readonly tokenId: ArtBlocksTokenIdentifier;
}) => (
  <LinkHandlerFrame href={href}>
    <ArtBlocksTokenCard href={href} id={tokenId} />
  </LinkHandlerFrame>
);

export const createArtBlocksHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseArtBlocksLink(href)),
  render: (href) => {
    const tokenId = parseArtBlocksLink(href);
    if (!tokenId) {
      throw new Error("Invalid Art Blocks link");
    }

    return <ArtBlocksPreview href={href} tokenId={tokenId} />;
  },
  display: "block",
});
