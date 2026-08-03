import { GitHubMuseumPublicationSource } from "./github";
import { legacyCaseyPublicationAssembler } from "./legacyCasey";
import type {
  MuseumLastValidPublication,
  MuseumPublicationLoadState,
  MuseumPublicationSource,
} from "./types";

const CURRENT_TTL_MS = 10 * 60 * 1000;
const FAILURE_BASE_TTL_MS = 30 * 1000;
const FAILURE_MAX_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;

interface RuntimeCacheEntry {
  readonly loadedAt: number;
  readonly state: MuseumPublicationLoadState;
  readonly ttlMs: number;
}

interface MuseumPublicationRuntime {
  load(): Promise<MuseumPublicationLoadState>;
}

export function createMuseumPublicationRuntime(
  source: MuseumPublicationSource,
  now: () => number = Date.now,
  random: () => number = Math.random
): MuseumPublicationRuntime {
  let cache: RuntimeCacheEntry | undefined;
  let lastValid: MuseumLastValidPublication | undefined;
  let inFlight: Promise<MuseumPublicationLoadState> | undefined;
  let consecutiveFailures = 0;

  const load = async (): Promise<MuseumPublicationLoadState> => {
    const currentTime = now();
    if (cache !== undefined && currentTime - cache.loadedAt <= cache.ttlMs) {
      return cache.state;
    }

    if (inFlight !== undefined) {
      return inFlight;
    }

    const usableLastValid =
      lastValid !== undefined &&
      currentTime - Date.parse(lastValid.acceptedAt) <= STALE_TTL_MS
        ? lastValid
        : undefined;

    const request = source
      .load(usableLastValid)
      .then((state): MuseumPublicationLoadState => {
        const loadedAt = now();
        if (state.status === "current") {
          consecutiveFailures = 0;
          lastValid = {
            publication: state.publication,
            acceptedAt: new Date(loadedAt).toISOString(),
          };
          cache = { loadedAt, state, ttlMs: CURRENT_TTL_MS };
        } else {
          consecutiveFailures += 1;
          const exponent = Math.min(consecutiveFailures - 1, 10);
          const exponentialTtl = Math.min(
            FAILURE_BASE_TTL_MS * 2 ** exponent,
            FAILURE_MAX_TTL_MS
          );
          const randomValue = Math.min(Math.max(random(), 0), 1);
          const jitteredTtl = Math.round(
            exponentialTtl * (1 + randomValue * 0.2)
          );
          cache = {
            loadedAt,
            state,
            ttlMs: Math.min(jitteredTtl, FAILURE_MAX_TTL_MS),
          };
        }
        return state;
      })
      .finally(() => {
        inFlight = undefined;
      });
    inFlight = request;
    return request;
  };

  return { load };
}

const githubPublicationSource = new GitHubMuseumPublicationSource({
  ref: "main",
  assembler: legacyCaseyPublicationAssembler,
});

const museumPublicationRuntime = createMuseumPublicationRuntime(
  githubPublicationSource
);

export async function getMuseumPublicationState(): Promise<MuseumPublicationLoadState> {
  return museumPublicationRuntime.load();
}
