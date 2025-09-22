import type { LinkHandler } from "../linkTypes";
import { createArtBlocksHandler } from "./artBlocks";
import { createCompoundHandler } from "./compound";
import { createFarcasterHandler } from "./farcaster";
import { createGifHandler } from "./gif";
import { createGoogleWorkspaceHandler } from "./googleWorkspace";
import { createPepeHandler } from "./pepe";
import { createTikTokHandler } from "./tiktok";
import { createTwitterHandler } from "./twitter";
import { createWikimediaHandler } from "./wikimedia";
import { createYoutubeHandler } from "./youtube";

export const createLinkHandlers = (): LinkHandler[] => [
  createYoutubeHandler(),
  createTikTokHandler(),
  createGoogleWorkspaceHandler(),
  createCompoundHandler(),
  createTwitterHandler(),
  createWikimediaHandler(),
  createGifHandler(),
  createArtBlocksHandler(),
  createPepeHandler(),
  createFarcasterHandler(),
];

export type LinkHandlers = ReturnType<typeof createLinkHandlers>;

export { createSeizeHandlers } from "./seize";
