"use client";

import { publicEnv } from "@/config/env";
import {
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";

export const resolveIpfsUrlSync = (url: string) => {
  try {
    const parsed = parseDecentralizedMediaRef(url);
    if (!parsed) {
      return url;
    }

    return to6529ResolverUrl(parsed, publicEnv.MEDIA_RESOLVER_ENDPOINT);
  } catch (error) {
    console.error("Error resolving IPFS URL", error);
    return url;
  }
};

export const resolveIpfsUrl = (url: string) => {
  return resolveIpfsUrlSync(url);
};
