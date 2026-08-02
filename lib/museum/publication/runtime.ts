import { GitHubMuseumPublicationSource } from "./github";
import { legacyCaseyPublicationAssembler } from "./legacyCasey";
import type {
  MuseumLastValidPublication,
  MuseumPublicationLoadState,
  MuseumPublicationSource,
} from "./types";

const CURRENT_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;

interface RuntimeCacheEntry {
  readonly loadedAt: number;
  readonly state: MuseumPublicationLoadState;
}

export interface MuseumPublicationRuntime {
  load(): Promise<MuseumPublicationLoadState>;
}

export function createMuseumPublicationRuntime(
  source: MuseumPublicationSource,
  now: () => number = Date.now
): MuseumPublicationRuntime {
  let cache: RuntimeCacheEntry | undefined;
  let lastValid: MuseumLastValidPublication | undefined;
  let inFlight: Promise<MuseumPublicationLoadState> | undefined;

  const load = async (): Promise<MuseumPublicationLoadState> => {
    const currentTime = now();
    if (cache !== undefined) {
      const ttl =
        cache.state.status === "current" ? CURRENT_TTL_MS : FAILURE_TTL_MS;
      if (currentTime - cache.loadedAt <= ttl) {
        return cache.state;
      }
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
          lastValid = {
            publication: state.publication,
            acceptedAt: new Date(loadedAt).toISOString(),
          };
        }
        cache = { loadedAt, state };
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
