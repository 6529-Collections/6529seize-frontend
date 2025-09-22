import { useMemo } from "react";

import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";
import ArtBlocksTokenCard from "@/src/components/waves/ArtBlocksTokenCard";
import { parseArtBlocksLink } from "@/src/services/artblocks/url";

import type { LinkHandler } from "../linkTypes";

const ArtBlocksPreview = ({ href }: { href: string }) => {
  const tokenId = useMemo(() => {
    const parsed = parseArtBlocksLink(href);
    if (!parsed) {
      throw new Error("Invalid Art Blocks link");
    }

    return parsed;
  }, [href]);

  return (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <ArtBlocksTokenCard href={href} id={tokenId} />
      </div>
      <ChatItemHrefButtons href={href} />
    </div>
  );
};

export const createArtBlocksHandler = (): LinkHandler => ({
  match: (href) => Boolean(parseArtBlocksLink(href)),
  render: (href) => <ArtBlocksPreview href={href} />,
  display: "block",
});
