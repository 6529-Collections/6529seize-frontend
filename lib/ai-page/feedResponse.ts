import { serveSignedFeedObject } from "@/lib/validator-page/feedResponse";

import { getAiReleaseFeedSnapshot } from "./releaseFeed";

const AI_FEED_TEXT = {
  unavailable: "The release list is unavailable.\n",
  missing: "No release yet.\n",
  signatureContentType: "application/json; charset=utf-8",
};

/**
 * Serves 6529 AI's signed feed or its signature byte for byte, as stored,
 * so the signature verifies against what anyone downloads. Only a feed
 * whose signature this server has checked is served.
 */
export async function serveAiFeedObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  return serveSignedFeedObject(
    request,
    await getAiReleaseFeedSnapshot(),
    which,
    AI_FEED_TEXT
  );
}
