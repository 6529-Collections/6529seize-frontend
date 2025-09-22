import type { ApiDrop } from "@/generated/models/ApiDrop";

import type { LinkHandler } from "../linkTypes";
import { createArtBlocksHandler } from "./artBlocks";
import { createFarcasterHandler } from "./farcaster";
import { createGifHandler } from "./gif";
import { createOpenGraphHandler } from "./openGraph";
import { createPepeHandler } from "./pepe";
import { createSeizeHandlers } from "./seize";
import { createTikTokHandler } from "./tiktok";
import { createTwitterHandler } from "./twitter";
import { createWikimediaHandler } from "./wikimedia";
import { createYoutubeHandler } from "./youtube";

interface CreateHandlersConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

export const createLinkHandlers = ({
  onQuoteClick,
}: CreateHandlersConfig): LinkHandler<any>[] => [
  createYoutubeHandler(),
  createTikTokHandler(),
  ...createSeizeHandlers({ onQuoteClick }),
  createTwitterHandler(),
  createWikimediaHandler(),
  createGifHandler(),
  createArtBlocksHandler(),
  createPepeHandler(),
  createFarcasterHandler(),
  createOpenGraphHandler(),
];

export type LinkHandlers = ReturnType<typeof createLinkHandlers>;
