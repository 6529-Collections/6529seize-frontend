import { serveSignedFeedObject } from "@/lib/validator-page/feedResponse";

import { getAiReleaseFeedSnapshot } from "./releaseFeed";
import { AI_RELEASE_LIST_TEXT } from "./releaseList";

/**
 * Serves 6529 AI's signed release list or its signature byte for byte, as
 * stored, so the signature verifies against what anyone downloads: the
 * bundle's two parts, both named by `X-Release-List-Pair`, or else the
 * Ed25519 feed and its signature. Only a list whose signature this server
 * has checked is served.
 */
export async function serveAiFeedObject(
  request: Request,
  which: "feed" | "signature"
): Promise<Response> {
  return serveSignedFeedObject(
    request,
    await getAiReleaseFeedSnapshot(),
    which,
    AI_RELEASE_LIST_TEXT
  );
}
