import ArtBlocksTokenCard from "@/src/components/waves/ArtBlocksTokenCard";
import { parseArtBlocksLink, type ArtBlocksTokenId } from "@/src/services/artblocks/url";

import ChatItemHrefButtons from "@/components/waves/ChatItemHrefButtons";
import type { LinkHandler } from "../linkTypes";

export const createArtBlocksHandler = (): LinkHandler<ArtBlocksTokenId> => ({
  match: parseArtBlocksLink,
  render: (payload, context) => (
    <div className="tw-flex tw-items-stretch tw-w-full tw-gap-x-1">
      <div className="tw-flex-1 tw-min-w-0">
        <ArtBlocksTokenCard href={context.href} id={payload} />
      </div>
      <ChatItemHrefButtons href={context.href} />
    </div>
  ),
  display: "block",
  blockOpenGraphFallback: true,
});

export type ArtBlocksHandler = ReturnType<typeof createArtBlocksHandler>;
