import {
  getMuseumPublicationEnvironment,
  type MuseumPublicationEnvironment,
} from "@/config/museumPublicationEnv.server";
import { GitHubMuseumPublicationSource } from "./github";
import { legacyCaseyPublicationAssembler } from "./legacyCasey";
import { isExactGitCommit } from "./security";
import type {
  MuseumLastValidPublication,
  MuseumPublicationLoadState,
  MuseumPublicationSource,
} from "./types";

const CURRENT_TTL_MS = 10 * 60 * 1000;
const FAILURE_BASE_TTL_MS = 30 * 1000;
const FAILURE_MAX_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PUBLICATION_REF = "main";
const PLAYWRIGHT_READONLY_VALUE = "1";

interface RuntimeCacheEntry {
  readonly loadedAt: number;
  readonly state: MuseumPublicationLoadState;
  readonly ttlMs: number;
}

interface MuseumPublicationRuntime {
  load(): Promise<MuseumPublicationLoadState>;
}

export function resolveMuseumPublicationRef(
  environment: MuseumPublicationEnvironment = getMuseumPublicationEnvironment()
): string {
  const testCommit = environment["MUSEUM_PUBLICATION_TEST_COMMIT"];
  if (testCommit === undefined) {
    return DEFAULT_PUBLICATION_REF;
  }
  if (environment["PLAYWRIGHT_READONLY"] !== PLAYWRIGHT_READONLY_VALUE) {
    throw new Error("publication_test_commit_requires_readonly");
  }
  if (!isExactGitCommit(testCommit)) {
    throw new Error("publication_test_commit_not_exact");
  }
  return testCommit;
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
  ref: resolveMuseumPublicationRef(),
  assembler: legacyCaseyPublicationAssembler,
});

const museumPublicationRuntime = createMuseumPublicationRuntime(
  githubPublicationSource
);

export async function getMuseumPublicationState(): Promise<MuseumPublicationLoadState> {
  return museumPublicationRuntime.load();
}
