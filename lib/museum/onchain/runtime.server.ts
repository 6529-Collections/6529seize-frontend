import "server-only";
import { cache } from "react";
import { publicEnv } from "@/config/env";
import { getMuseumOnchainFixtureRoot } from "@/config/museumPublicationEnv.server";
import { getMediaResolverSource } from "@/lib/media/decentralized-media";
import { loadFixtureSource } from "./fixture.server";
import { createCidFetcher } from "./ipfs";
import { buildOnchainMuseum, type OnchainMuseumSnapshot } from "./museum";
import { readRegistrySnapshot } from "./registry";

const CURRENT_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;

type OnchainMuseumLoadState =
  | { readonly status: "ready"; readonly snapshot: OnchainMuseumSnapshot }
  | { readonly status: "unavailable"; readonly errorCode: string };

interface CacheEntry {
  readonly at: number;
  readonly state: OnchainMuseumLoadState;
}

let cached: CacheEntry | undefined;
let lastReady: OnchainMuseumSnapshot | undefined;
let inFlight: Promise<OnchainMuseumLoadState> | undefined;

async function loadFresh(): Promise<OnchainMuseumLoadState> {
  const startedAt = Date.now();
  try {
    const networkFetcher = createCidFetcher(
      getMediaResolverSource(publicEnv.MEDIA_RESOLVER_ENDPOINT)
    );
    const fixtureRoot = getMuseumOnchainFixtureRoot();
    const snapshot =
      fixtureRoot === null
        ? await buildOnchainMuseum(
            await readRegistrySnapshot(),
            networkFetcher,
            startedAt
          )
        : await loadFixtureSource(fixtureRoot, networkFetcher).then(
            ({ registry, fetchCid }) =>
              buildOnchainMuseum(registry, fetchCid, startedAt, "fixture")
          );
    lastReady = snapshot;
    return { status: "ready", snapshot };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return {
      status: "unavailable",
      errorCode: message.startsWith("registry_")
        ? (message.split(/\s/u)[0] ?? "registry_unavailable")
        : "registry_unavailable",
    };
  }
}

function refresh(): Promise<OnchainMuseumLoadState> {
  inFlight ??= loadFresh()
    .then((state) => {
      cached = { at: Date.now(), state };
      return state;
    })
    .finally(() => {
      inFlight = undefined;
    });
  return inFlight;
}

/**
 * The verified Museum, read once per ten minutes per server process instead
 * of once per visitor. After expiry the last verified snapshot is served while
 * one refresh runs; a failed load is retried after thirty seconds.
 */
async function loadOnchainMuseum(): Promise<OnchainMuseumLoadState> {
  const now = Date.now();
  const ttl =
    cached?.state.status === "ready" ? CURRENT_TTL_MS : FAILURE_TTL_MS;
  if (cached !== undefined && now - cached.at <= ttl) return cached.state;
  if (lastReady !== undefined) {
    void refresh().catch(() => undefined);
    return { status: "ready", snapshot: lastReady };
  }
  return refresh();
}

/** Per-render memoized so a layout and page share one snapshot. */
export const getOnchainMuseum = cache(loadOnchainMuseum);
