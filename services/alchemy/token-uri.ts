import pLimit from "p-limit";
import { publicEnv } from "@/config/env";
import {
  createFetchDeadline,
  discardResponse,
} from "@/lib/fetch/fetchDeadline";
import { readLimitedJson } from "@/lib/fetch/limitedBody";
import {
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";
import { processTokenUriMetadata } from "./utils";

const limitMetadataRequests = pLimit(4);
const MAX_METADATA_BYTES = 256 * 1024;

export function getTokenUriMetadataUrl(
  tokenUri: string | null | undefined
): string | null {
  const ref = parseDecentralizedMediaRef(tokenUri);
  return ref ? to6529ResolverUrl(ref, publicEnv.MEDIA_RESOLVER_ENDPOINT) : null;
}

export function fetchTokenUriMetadata(tokenUri: string, signal: AbortSignal) {
  // Only known decentralized references go through the existing media resolver.
  const url = getTokenUriMetadataUrl(tokenUri);
  if (!url) {
    return Promise.resolve(null);
  }
  return limitMetadataRequests(async () => {
    const deadline = createFetchDeadline(
      signal,
      4000,
      () => new Error("Token metadata timed out")
    );
    try {
      return await deadline.run(async () => {
        const response = await fetch(url, {
          signal: deadline.signal,
          credentials: "omit",
          referrerPolicy: "no-referrer",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          discardResponse(response);
          throw new Error("Token metadata unavailable");
        }
        const metadata = await readLimitedJson<unknown>(
          response,
          MAX_METADATA_BYTES
        );
        return processTokenUriMetadata(metadata);
      });
    } finally {
      deadline.dispose();
    }
  });
}
