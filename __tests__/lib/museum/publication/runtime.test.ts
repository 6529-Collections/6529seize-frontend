import {
  createMuseumPublicationRuntime,
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumLastValidPublication,
  type MuseumPublication,
  type MuseumPublicationLoadState,
  type MuseumPublicationSource,
} from "@/lib/museum/publication";
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
    const runtime = createMuseumPublicationRuntime(source, () => now);

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
    const runtime = createMuseumPublicationRuntime(source, () => now);

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
    const runtime = createMuseumPublicationRuntime(source, () => now);

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

  it("expires last-valid eligibility after twenty-four hours", async () => {
    let now = Date.parse("2026-08-02T12:00:00.000Z");
    const { load, source } = mockedSource();
    const current = currentState(publication);
    const unavailable = unavailableState("publication_github_http_503");
    load.mockResolvedValueOnce(current).mockResolvedValueOnce(unavailable);
    const runtime = createMuseumPublicationRuntime(source, () => now);

    await runtime.load();
    now += 24 * 60 * 60 * 1000 + 1;
    await expect(runtime.load()).resolves.toBe(unavailable);

    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenNthCalledWith(2, undefined);
  });
});
