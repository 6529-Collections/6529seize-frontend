import type { SignedFeedText } from "@/lib/validator-page/feedResponse";
import { createReleaseListReader } from "@/lib/release-section/releaseList";

import { AI_RELEASE_LIST_KEYS } from "./releaseListKeys";
import { readAiReleaseObject } from "./releasesBucket";
import { AI_RELEASES_LOCATION } from "./releasesLocation";

/** The domain 6529 AI's list in the validator's format 1 is signed under. */
const AI_RELEASE_LIST_DOMAIN = "6529 AI releases v1";

/** What /ai/releases.json and .sig answer when there is no list to serve. */
export const AI_RELEASE_LIST_TEXT: SignedFeedText = {
  unavailable: "The release list is unavailable.\n",
  missing: "No release yet.\n",
  signatureContentType: "application/json; charset=utf-8",
};

/**
 * 6529 AI's release list in the validator's format 1, from 0.1.0-rc.3 on:
 * the bundle `feed/releases.bundle.json`, checked with the keys in
 * `releaseListKeys.ts`. `releaseFeed.ts` prefers it to the Ed25519 list
 * whenever it verifies.
 */
export const aiReleaseList = createReleaseListReader({
  logName: "ai-page",
  domain: AI_RELEASE_LIST_DOMAIN,
  signers: AI_RELEASE_LIST_KEYS,
  bundleKey: "feed/releases.bundle.json",
  routes: {
    list: "/ai/releases.json",
    signature: "/ai/releases.json.sig",
    releases: "/ai/releases",
  },
  location: () => AI_RELEASES_LOCATION,
  // The role may not list the bucket; readAiReleaseObject reads S3's
  // AccessDenied for a key that isn't there as missing.
  read: (_location, key) => readAiReleaseObject(key),
  text: AI_RELEASE_LIST_TEXT,
  missingAfterServed: "failed",
});
