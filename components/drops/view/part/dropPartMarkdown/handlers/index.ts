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

export const createLinkHandlers = (): LinkHandler[] => [
  createYoutubeHandler(),
  createTikTokHandler(),
  createGoogleWorkspaceHandler(),
  createEnsHandler(),
  createCompoundHandler(),
  createTwitterHandler(),
  createWikimediaHandler(),
  createGifHandler(),
  createArtBlocksHandler(),
  createPepeHandler(),
  createFarcasterHandler(),
];

export { createSeizeHandlers } from "./seize";
