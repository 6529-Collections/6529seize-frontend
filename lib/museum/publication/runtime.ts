import {
  getMuseumPublicationEnvironment,
  isMuseumLocalFixtureEnvironment,
  type MuseumPublicationEnvironment,
} from "@/config/museumPublicationEnv.server";
import { getNodeEnv } from "@/config/env";
import { cache } from "react";
import {
  MUSEUM_PUBLICATION_BUILD_SNAPSHOT_MAX_CLOCK_SKEW_MS,
  readMuseumPublicationBuildSnapshot,
} from "./buildSnapshot.server";
import { GitHubMuseumPublicationSource } from "./github";
import { museumPublicationCatalogResolver } from "./catalog";
import { legacyCaseyPublicationAssembler } from "./legacyCasey";
import {
  createMuseumLocalFixtureFetch,
  readMuseumLocalFixtureMediaAssetPaths,
  readMuseumLocalFixtureVisitorPaths,
} from "./localFixture";
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

interface MuseumPublicationRuntimeOptions {
  readonly initialLastValid?: MuseumLastValidPublication;
}

export function resolveMuseumPublicationRef(
  environment: MuseumPublicationEnvironment = getMuseumPublicationEnvironment(),
  nodeEnvironment: string | undefined = getNodeEnv()
): string {
  const testCommit = environment["MUSEUM_PUBLICATION_TEST_COMMIT"];
  if (testCommit === undefined) {
    return DEFAULT_PUBLICATION_REF;
  }
  if (nodeEnvironment === "production") {
    throw new Error("publication_test_commit_not_allowed_in_production");
  }
  if (environment["PLAYWRIGHT_READONLY"] !== PLAYWRIGHT_READONLY_VALUE) {
    throw new Error("publication_test_commit_requires_readonly");
  }
  if (!isExactGitCommit(testCommit)) {
    throw new Error("publication_test_commit_not_exact");
  }
  return testCommit;
}

export function shouldUseMuseumPublicationBuildSnapshot(
  environment: MuseumPublicationEnvironment = getMuseumPublicationEnvironment()
): boolean {
  return (
    environment.MUSEUM_PUBLICATION_TEST_COMMIT === undefined &&
    environment.MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT === undefined
  );
}

export function createMuseumPublicationRuntime(
  source: MuseumPublicationSource,
  now: () => number = Date.now,
  random: () => number = Math.random,
  options: MuseumPublicationRuntimeOptions = {}
): MuseumPublicationRuntime {
  let cache: RuntimeCacheEntry | undefined;
  let lastValid = options.initialLastValid;
  if (lastValid !== undefined) {
    const acceptedAt = Date.parse(lastValid.acceptedAt);
    if (
      !Number.isFinite(acceptedAt) ||
      acceptedAt >
        now() + MUSEUM_PUBLICATION_BUILD_SNAPSHOT_MAX_CLOCK_SKEW_MS
    ) {
      lastValid = undefined;
    }
  }
  const refreshInBackground = lastValid !== undefined;
  let inFlight: Promise<MuseumPublicationLoadState> | undefined;
  let consecutiveFailures = 0;

  // A build snapshot is accepted through the same ten-minute freshness window
  // as a runtime load. Older snapshots remain eligible only as explicit stale
  // state while a verified refresh proceeds.
  if (lastValid !== undefined) {
    const acceptedAt = Date.parse(lastValid.acceptedAt);
    const age = now() - acceptedAt;
    if (Number.isFinite(acceptedAt) && age <= CURRENT_TTL_MS) {
      cache = {
        loadedAt: acceptedAt,
        state: {
          status: "current",
          publication: lastValid.publication,
          errorCode: null,
          failedAt: null,
          lastValidAcceptedAt: null,
        },
        ttlMs: CURRENT_TTL_MS,
      };
    }
  }

  const pendingState = (
    usableLastValid: MuseumLastValidPublication | undefined,
    currentTime: number
  ): MuseumPublicationLoadState =>
    usableLastValid === undefined
      ? {
          status: "unavailable",
          publication: null,
          errorCode: "publication_refresh_pending",
          failedAt: new Date(currentTime).toISOString(),
          lastValidAcceptedAt: null,
        }
      : {
          status: "stale",
          publication: usableLastValid.publication,
          errorCode: "publication_refresh_pending",
          failedAt: new Date(currentTime).toISOString(),
          lastValidAcceptedAt: usableLastValid.acceptedAt,
        };

  const load = async (): Promise<MuseumPublicationLoadState> => {
    const currentTime = now();
    const cachedStaleIsExpired =
      cache?.state.status === "stale" &&
      currentTime - Date.parse(cache.state.lastValidAcceptedAt) > STALE_TTL_MS;
    if (
      cache !== undefined &&
      !cachedStaleIsExpired &&
      currentTime - cache.loadedAt <= cache.ttlMs
    ) {
      return cache.state;
    }

    const usableLastValid =
      lastValid !== undefined &&
      currentTime - Date.parse(lastValid.acceptedAt) <= STALE_TTL_MS
        ? lastValid
        : undefined;

    if (inFlight !== undefined) {
      return refreshInBackground
        ? pendingState(usableLastValid, currentTime)
        : inFlight;
    }

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
    if (refreshInBackground) {
      // The source owns its error-to-state conversion. This rejection handler
      // protects the detached refresh if an alternative source violates that
      // contract; the next request can retry after `finally` clears inFlight.
      void request.catch(() => undefined);
      return pendingState(usableLastValid, currentTime);
    }
    return request;
  };

  return { load };
}

function createMuseumPublicationSource(
  environment: MuseumPublicationEnvironment
): MuseumPublicationSource {
  const localFixtureRoot = environment.MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT;
  if (localFixtureRoot !== undefined) {
    const localFixtureCommit =
      environment.MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT;
    if (
      !isMuseumLocalFixtureEnvironment(environment, getNodeEnv()) ||
      localFixtureCommit === undefined ||
      !isExactGitCommit(localFixtureCommit)
    ) {
      throw new Error("publication_local_fixture_not_allowed");
    }
    return new GitHubMuseumPublicationSource({
      ref: localFixtureCommit,
      assembler: legacyCaseyPublicationAssembler,
      fetch: createMuseumLocalFixtureFetch(
        localFixtureRoot,
        localFixtureCommit
      ),
      allowUncataloguedTestFixture: true,
      localFixtureAcceptedPaths:
        readMuseumLocalFixtureVisitorPaths(localFixtureRoot),
      localFixtureMediaAssetPaths: readMuseumLocalFixtureMediaAssetPaths(
        localFixtureRoot,
        localFixtureCommit
      ),
    });
  }
  return new GitHubMuseumPublicationSource({
    ref: resolveMuseumPublicationRef(environment),
    assembler: legacyCaseyPublicationAssembler,
    catalogResolver: museumPublicationCatalogResolver,
  });
}

const publicationEnvironment = getMuseumPublicationEnvironment();

const githubPublicationSource = createMuseumPublicationSource(
  publicationEnvironment
);

const buildSnapshot = shouldUseMuseumPublicationBuildSnapshot(
  publicationEnvironment
)
  ? readMuseumPublicationBuildSnapshot()
  : undefined;

const museumPublicationRuntime = createMuseumPublicationRuntime(
  githubPublicationSource,
  Date.now,
  Math.random,
  {
    ...(buildSnapshot === undefined ? {} : { initialLastValid: buildSnapshot }),
  }
);

// Layouts and pages can request the publication independently. Per-render
// memoization keeps one render atomic if a background refresh finishes midway.
export const getMuseumPublicationState = cache(
  async (): Promise<MuseumPublicationLoadState> =>
    museumPublicationRuntime.load()
);
