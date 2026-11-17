import type { SignedFeedSnapshot } from "@/lib/validator-page/feedResponse";
import { isFeedSignatureValid } from "@/lib/validator-page/feedSignature";
import {
  parseReleaseFeed,
  type ValidatorRelease,
} from "@/lib/validator-page/releaseFeed";

import { getDesktopReleaseListSnapshot } from "./releaseList";
import {
  DESKTOP_RELEASE_LIST_DOMAIN,
  DESKTOP_RELEASE_LIST_KEYS,
} from "./signingKeys";

/**
 * A 6529 Desktop release, as its list gives it. The list has the
 * validator's format (6529 Desktop's docs/updates.md, section 1), so the
 * validator's parser reads it.
 */
export type DesktopRelease = ValidatorRelease;

export type DesktopReleases = {
  /**
   * `missing` while no list is published (or no bucket is set). `error`
   * when the list can't be read, or its signature does not verify with a
   * key in `signingKeys.ts`: then the pages offer nothing.
   */
  readonly state: "ok" | "missing" | "error";
  /** Highest version first. Entries the site cannot use are left out. */
  readonly releases: readonly DesktopRelease[];
};

const MISSING: DesktopReleases = { state: "missing", releases: [] };
const ERROR: DesktopReleases = { state: "error", releases: [] };
// The list format the app reads; any other is refused, as the app refuses it.
const LIST_FORMAT = 1;

// Each pair is checked once: the snapshot object stays the same while the
// list does.
const checked = new WeakMap<SignedFeedSnapshot, DesktopReleases>();

function refused(reason: string): DesktopReleases {
  console.warn("[desktop-releases] the pages offer no release:", reason);
  return ERROR;
}

function readVerified(
  list: Uint8Array,
  signature: Uint8Array
): DesktopReleases {
  // Nothing in the list is read before its signature checks out: the
  // signature is what vouches for the SHA-256 values the pages show.
  if (
    !isFeedSignatureValid(
      list,
      signature,
      DESKTOP_RELEASE_LIST_KEYS,
      DESKTOP_RELEASE_LIST_DOMAIN
    )
  ) {
    return refused("the list's signature does not verify");
  }
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(list));
  } catch {
    return refused("the list is not JSON");
  }
  if (
    typeof json !== "object" ||
    json === null ||
    (json as Record<string, unknown>)["format"] !== LIST_FORMAT
  ) {
    return refused("the list's format is not 1");
  }
  return { state: "ok", releases: parseReleaseFeed(json) };
}

/**
 * The releases in 6529 Desktop's signed list, once this server has checked
 * the list's signature. The list is the one `/desktop/releases.json` serves.
 */
export async function getDesktopReleases(): Promise<DesktopReleases> {
  const snapshot = await getDesktopReleaseListSnapshot();
  if (snapshot.state === "error") {
    return ERROR;
  }
  if (!snapshot.feed || !snapshot.signature) {
    return MISSING;
  }
  const known = checked.get(snapshot);
  if (known) {
    return known;
  }
  const releases = readVerified(snapshot.feed.body, snapshot.signature.body);
  checked.set(snapshot, releases);
  return releases;
}

/** The release the pages offer: the highest version in the list. */
export function getNewestDesktopRelease(
  releases: readonly DesktopRelease[]
): DesktopRelease | undefined {
  return releases[0];
}
