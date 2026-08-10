import {
  createMuseumPublicationRuntime,
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  resolveMuseumPublicationRef,
  type MuseumLastValidPublication,
  type MuseumPublication,
  type MuseumPublicationLoadState,
  type MuseumPublicationSource,
} from "@/lib/museum/publication";
import {
  getMuseumPublicationNodeEnvironment,
  isMuseumLocalFixtureEnvironment,
} from "@/config/museumPublicationEnv.server";
import { createCaseyFixture } from "./fixture";

type CurrentState = Extract<
  MuseumPublicationLoadState,
  { readonly status: "current" }
>;

function currentState(publication: MuseumPublication): CurrentState {
  return {
    status: "current",
    publication,
    errorCode: null,
    failedAt: null,
    lastValidAcceptedAt: null,
  };
}

function unavailableState(errorCode: string): MuseumPublicationLoadState {
  return {
    status: "unavailable",
    publication: null,
    errorCode,
    failedAt: "2026-08-02T12:00:00.000Z",
    lastValidAcceptedAt: null,
  };
}

function mockedSource() {
  const load = jest.fn<
    Promise<MuseumPublicationLoadState>,
    [MuseumLastValidPublication?]
  >();
  return {
    load,
    source: { load } satisfies MuseumPublicationSource,
  };
}

async function buildPublication(): Promise<MuseumPublication> {
  const fixture = createCaseyFixture();
  const result = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
    now: () => new Date("2026-08-02T12:00:00.000Z"),
  }).load();
  if (result.status !== "current") {
    throw new Error("test_publication_fixture_unavailable");
  }
  return result.publication;
}

describe("Museum publication runtime", () => {
  let publication: MuseumPublication;

  beforeAll(async () => {
    publication = await buildPublication();
  });

  it("caches a current publication through its ten-minute boundary", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const current = currentState(publication);
    load.mockResolvedValue(current);
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await expect(runtime.load()).resolves.toBe(current);
    now += 10 * 60 * 1000;
    await expect(runtime.load()).resolves.toBe(current);
    expect(load).toHaveBeenCalledTimes(1);

    now += 1;
    await expect(runtime.load()).resolves.toBe(current);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent in-flight source requests", async () => {
    const { load, source } = mockedSource();
    const current = currentState(publication);
    let resolveRequest:
      | ((state: MuseumPublicationLoadState) => void)
      | undefined;
    load.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const runtime = createMuseumPublicationRuntime(source, () => 0);

    const first = runtime.load();
    const second = runtime.load();
    expect(load).toHaveBeenCalledTimes(1);
    if (resolveRequest === undefined) {
      throw new Error("test_source_request_not_started");
    }
    resolveRequest(current);

    await expect(Promise.all([first, second])).resolves.toEqual([
      current,
      current,
    ]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("serves caller-visible stale state from the last valid publication after failure", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const current = currentState(publication);
    load.mockResolvedValueOnce(current).mockImplementationOnce((lastValid) => {
      if (lastValid === undefined) {
        return Promise.resolve(unavailableState("missing_last_valid"));
      }
      return Promise.resolve({
        status: "stale",
        publication: lastValid.publication,
        errorCode: "publication_github_http_503",
        failedAt: new Date(now).toISOString(),
        lastValidAcceptedAt: lastValid.acceptedAt,
      });
    });
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await expect(runtime.load()).resolves.toBe(current);
    now += 10 * 60 * 1000 + 1;
    const stale = await runtime.load();

    expect(stale).toMatchObject({
      status: "stale",
      publication,
      errorCode: "publication_github_http_503",
      lastValidAcceptedAt: "2026-08-02T12:00:00.000Z",
    });
    expect(load).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        publication,
        acceptedAt: "2026-08-02T12:00:00.000Z",
      })
    );
  });

  it("returns and briefly caches unavailable without activating partial data", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const unavailable = unavailableState("publication_manifest_hash_mismatch");
    load.mockResolvedValue(unavailable);
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await expect(runtime.load()).resolves.toEqual({
      status: "unavailable",
      publication: null,
      errorCode: "publication_manifest_hash_mismatch",
      failedAt: "2026-08-02T12:00:00.000Z",
      lastValidAcceptedAt: null,
    });
    now += 30 * 1000;
    await expect(runtime.load()).resolves.toBe(unavailable);
    expect(load).toHaveBeenCalledTimes(1);

    now += 1;
    await runtime.load();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("backs off consecutive source failures and resets after recovery", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const unavailable = unavailableState("publication_github_http_403");
    const current = currentState(publication);
    load
      .mockResolvedValueOnce(unavailable)
      .mockResolvedValueOnce(unavailable)
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(unavailable);
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await runtime.load();
    now += 30 * 1000 + 1;
    await runtime.load();
    now += 60 * 1000;
    await runtime.load();
    expect(load).toHaveBeenCalledTimes(2);

    now += 1;
    await runtime.load();
    expect(load).toHaveBeenCalledTimes(3);

    now += 10 * 60 * 1000 + 1;
    await runtime.load();
    expect(load).toHaveBeenCalledTimes(4);
  });

  it("expires last-valid eligibility after twenty-four hours", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const current = currentState(publication);
    const unavailable = unavailableState("publication_github_http_503");
    load.mockResolvedValueOnce(current).mockResolvedValueOnce(unavailable);
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await runtime.load();
    now += 24 * 60 * 60 * 1000 + 1;
    await expect(runtime.load()).resolves.toBe(unavailable);

    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenNthCalledWith(2, undefined);
  });

  it("keeps the last valid publication eligible at exactly twenty-four hours", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const current = currentState(publication);
    load.mockResolvedValueOnce(current).mockImplementationOnce((lastValid) =>
      Promise.resolve(
        lastValid === undefined
          ? unavailableState("missing_last_valid")
          : {
              status: "stale",
              publication: lastValid.publication,
              errorCode: "publication_github_http_503",
              failedAt: new Date(now).toISOString(),
              lastValidAcceptedAt: lastValid.acceptedAt,
            }
      )
    );
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await runtime.load();
    now += 24 * 60 * 60 * 1000;
    await expect(runtime.load()).resolves.toMatchObject({
      status: "stale",
      publication,
    });
    expect(load).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ publication })
    );
  });

  it("does not extend last-valid eligibility through a cached stale response", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const acceptedAt = new Date(now).toISOString();
    load
      .mockResolvedValueOnce(currentState(publication))
      .mockResolvedValueOnce({
        status: "stale",
        publication,
        errorCode: "publication_github_http_503",
        failedAt: "2026-08-03T11:59:50.000Z",
        lastValidAcceptedAt: acceptedAt,
      })
      .mockResolvedValueOnce(unavailableState("publication_github_http_503"));
    const runtime = createMuseumPublicationRuntime(
      source,
      () => now,
      () => 0
    );

    await runtime.load();
    now += 24 * 60 * 60 * 1000 - 10_000;
    await expect(runtime.load()).resolves.toMatchObject({ status: "stale" });
    now += 10_001;
    await expect(runtime.load()).resolves.toMatchObject({
      status: "unavailable",
    });
    expect(load).toHaveBeenNthCalledWith(3, undefined);
  });
});

describe("Museum publication runtime source ref", () => {
  it("uses the moving canonical ref outside the read-only browser harness", () => {
    expect(resolveMuseumPublicationRef({})).toBe("main");
  });

  it("accepts an exact immutable commit in the read-only browser harness", () => {
    const commit = "66c9eb9fa8c1512ca9450108151d2d7a037c4f31";

    expect(
      resolveMuseumPublicationRef({
        PLAYWRIGHT_READONLY: "1",
        MUSEUM_PUBLICATION_TEST_COMMIT: commit,
      })
    ).toBe(commit);
  });

  it("rejects a test commit outside the read-only browser harness", () => {
    expect(() =>
      resolveMuseumPublicationRef({
        MUSEUM_PUBLICATION_TEST_COMMIT:
          "66c9eb9fa8c1512ca9450108151d2d7a037c4f31",
      })
    ).toThrow("publication_test_commit_requires_readonly");
  });

  it("rejects a mutable or malformed test ref", () => {
    expect(() =>
      resolveMuseumPublicationRef({
        PLAYWRIGHT_READONLY: "1",
        MUSEUM_PUBLICATION_TEST_COMMIT: "main",
      })
    ).toThrow("publication_test_commit_not_exact");
  });

  it("rejects an exact test catalog commit in production", () => {
    expect(() =>
      resolveMuseumPublicationRef(
        {
          PLAYWRIGHT_READONLY: "1",
          MUSEUM_PUBLICATION_TEST_COMMIT:
            "66c9eb9fa8c1512ca9450108151d2d7a037c4f31",
        },
        "production"
      )
    ).toThrow("publication_test_commit_not_allowed_in_production");
  });

  it("keeps uncatalogued local fixtures out of every production phase", () => {
    const environment = {
      PLAYWRIGHT_READONLY: "1",
      MUSEUM_PUBLICATION_LOCAL_FIXTURE_ROOT: "fixture",
    } as const;

    expect(isMuseumLocalFixtureEnvironment(environment, "test")).toBe(true);
    expect(isMuseumLocalFixtureEnvironment(environment, "development")).toBe(
      true
    );
    expect(isMuseumLocalFixtureEnvironment(environment, "production")).toBe(
      false
    );
  });

  it("reads the publication node environment without requiring unrelated public endpoints", () => {
    const previousPublicRuntime = process.env["PUBLIC_RUNTIME"];
    const previousNodeEnvironment = process.env["NODE_ENV"];
    try {
      process.env["NODE_ENV"] = "production";
      process.env["PUBLIC_RUNTIME"] = JSON.stringify({ NODE_ENV: "local" });
      expect(getMuseumPublicationNodeEnvironment()).toBe("local");

      process.env["PUBLIC_RUNTIME"] = "{}";
      expect(getMuseumPublicationNodeEnvironment()).toBe("production");

      process.env["PUBLIC_RUNTIME"] = "not-json";
      expect(() => getMuseumPublicationNodeEnvironment()).toThrow(
        "museum_publication_runtime_environment_invalid"
      );

      process.env["PUBLIC_RUNTIME"] = "[]";
      expect(() => getMuseumPublicationNodeEnvironment()).toThrow(
        "museum_publication_runtime_environment_invalid"
      );

      process.env["PUBLIC_RUNTIME"] = JSON.stringify({ NODE_ENV: "bogus" });
      expect(() => getMuseumPublicationNodeEnvironment()).toThrow(
        "museum_publication_runtime_environment_invalid"
      );
    } finally {
      if (previousPublicRuntime === undefined) {
        delete process.env["PUBLIC_RUNTIME"];
      } else {
        process.env["PUBLIC_RUNTIME"] = previousPublicRuntime;
      }
      if (previousNodeEnvironment === undefined) {
        delete process.env["NODE_ENV"];
      } else {
        process.env["NODE_ENV"] = previousNodeEnvironment;
      }
    }
  });
});
