import type { LinkHandler } from "../linkTypes";
import { createArtBlocksHandler } from "./artBlocks";
import { createCompoundHandler } from "./compound";
import { createEnsHandler } from "./ens";
import { createFarcasterHandler } from "./farcaster";
import { createGifHandler } from "./gif";
import { createGoogleWorkspaceHandler } from "./googleWorkspace";
import { createPepeHandler } from "./pepe";
import { createTikTokHandler } from "./tiktok";
import { createTwitterHandler } from "./twitter";
import { createWikimediaHandler } from "./wikimedia";
import { createYoutubeHandler } from "./youtube";
import type { TweetPreviewMode } from "@/components/tweets/TweetPreviewModeContext";
import type { LinkPreviewVariant } from "@/components/waves/LinkPreviewContext";

export const createLinkHandlers = (options?: {
  readonly tweetPreviewMode?: TweetPreviewMode;
  readonly linkPreviewVariant?: LinkPreviewVariant;
}): LinkHandler[] => [
  createYoutubeHandler(),
  createTikTokHandler(),
  createGoogleWorkspaceHandler(),
  createEnsHandler(),
  createCompoundHandler(),
  createTwitterHandler(options),
  createWikimediaHandler(),
  createGifHandler(options),
  createArtBlocksHandler(),
  createPepeHandler(),
  createFarcasterHandler(),
];

export { createSeizeHandlers } from "./seize";
