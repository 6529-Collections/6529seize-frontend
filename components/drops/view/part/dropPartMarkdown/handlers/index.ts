import type { LinkHandler } from "../linkTypes";
import { createArtBlocksHandler } from "./artBlocks";
import { createCompoundHandler } from "./compound";
import { createEnsHandler } from "./ens";
import { createFarcasterHandler } from "./farcaster";
import { createGifHandler } from "./gif";
import { createGithubHandler } from "./github";
import { createGoogleWorkspaceHandler } from "./googleWorkspace";
import { createNftMarketplacesHandler } from "./nftMarketplaces";
import { createPepeHandler } from "./pepe";
import { createTikTokHandler } from "./tiktok";
import { createTwitterHandler } from "./twitter";
import { createWikimediaHandler } from "./wikimedia";
import type { LinkPreviewVariant } from "@/components/waves/LinkPreviewContext";

export const createLinkHandlers = (options?: {
  readonly linkPreviewVariant?: LinkPreviewVariant;
  readonly fullWidthLinkPreviews?: boolean | undefined;
}): LinkHandler[] => [
  createGithubHandler(),
  createTikTokHandler(),
  createGoogleWorkspaceHandler(),
  createNftMarketplacesHandler(),
  createEnsHandler(),
  createCompoundHandler(),
  createTwitterHandler({
    fullWidth: options?.fullWidthLinkPreviews === true,
  }),
  createWikimediaHandler(),
  createGifHandler(options),
  createArtBlocksHandler(),
  createPepeHandler(),
  createFarcasterHandler(),
];

export { createSeizeHandlers } from "./seize";
