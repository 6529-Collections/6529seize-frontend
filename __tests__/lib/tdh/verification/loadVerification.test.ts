/**
 * @jest-environment node
 */
import {
  createVerificationLoader,
  resolveVerificationSource,
} from "@/lib/tdh/verification/loadVerification.server";
import { syntheticDay, syntheticIndex } from "./fixtures";

const BASE = "https://verification.example/tdh";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function fetchFrom(routes: Record<string, () => Promise<Response>>) {
  return jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const handler = routes[url];
    if (!handler) {
      return jsonResponse({ message: "not found" }, 404);
    }
    return handler();
  }) as unknown as jest.MockedFunction<typeof fetch>;
}

describe("resolveVerificationSource", () => {
  it.each([
    [undefined, true, "awaiting"],
    ["", true, "awaiting"],
    ["   ", false, "sample"],
    [undefined, false, "sample"],
    ["https://verification.example/tdh", true, "remote"],
    ["http://localhost:4010/tdh", false, "remote"],
    ["http://localhost:4010/tdh", true, "invalid"],
    ["http://verification.example/tdh", false, "invalid"],
    ["https://user:secret@verification.example/", true, "invalid"],
    ["https://verification.example/?q=1", true, "invalid"],
    ["not a url", true, "invalid"],
  ])("base %p in production=%p resolves to %p", (base, isProduction, kind) => {
    expect(resolveVerificationSource(base, isProduction).kind).toBe(kind);
  });

  it("treats the base as a directory so a path can never escape it", () => {
    const source = resolveVerificationSource(BASE, true);
    expect(
      source.kind === "remote" && new URL("index.json", source.base).toString()
    ).toBe("https://verification.example/tdh/index.json");
  });
});

describe("createVerificationLoader", () => {
  it("returns awaiting in production without a data source, and never fetches", async () => {
    const fetchImpl = fetchFrom({});
    const loader = createVerificationLoader({
      base: undefined,
      isProduction: true,
      fetchImpl,
    });
    await expect(loader.loadIndex()).resolves.toEqual({ status: "awaiting" });
    await expect(loader.loadDay(20_741)).resolves.toEqual({
      status: "not-found",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns the bundled sample outside production without a data source", async () => {
    const loader = createVerificationLoader({
      base: undefined,
      isProduction: false,
    });
    const index = await loader.loadIndex();
    expect(index).toMatchObject({
      status: "ok",
      source: "sample",
      indexUrl: null,
    });
    await expect(loader.loadDay(20_741)).resolves.toMatchObject({
      status: "ok",
      dayUrl: null,
    });
    await expect(loader.loadDay(1)).resolves.toEqual({ status: "not-found" });
  });

  it("fetches and validates the index and a day from the data source", async () => {
    const fetchImpl = fetchFrom({
      [`${BASE}/index.json`]: async () => jsonResponse(syntheticIndex()),
      [`${BASE}/days/20741.json`]: async () => jsonResponse(syntheticDay()),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    await expect(loader.loadIndex()).resolves.toMatchObject({
      status: "ok",
      source: "remote",
      indexUrl: `${BASE}/index.json`,
    });
    await expect(loader.loadDay(20_741, 600)).resolves.toMatchObject({
      status: "ok",
      dayUrl: `${BASE}/days/20741.json`,
    });
    const [, init] = fetchImpl.mock.calls[1] ?? [];
    expect(init).toMatchObject({ next: { revalidate: 600 } });
    expect((init as RequestInit | undefined)?.signal).toBeDefined();
  });

  it("treats an empty index as awaiting the first report", async () => {
    const fetchImpl = fetchFrom({
      [`${BASE}/index.json`]: async () => jsonResponse({ days: [] }),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    await expect(loader.loadIndex()).resolves.toEqual({ status: "awaiting" });
  });

  it("reports network, HTTP and validation failures as errors", async () => {
    const loaderFor = (handler: () => Promise<Response>) =>
      createVerificationLoader({
        base: BASE,
        isProduction: true,
        fetchImpl: fetchFrom({ [`${BASE}/index.json`]: handler }),
      });
    await expect(
      loaderFor(async () => {
        throw new DOMException("The operation timed out.", "TimeoutError");
      }).loadIndex()
    ).resolves.toEqual({ status: "error", reason: "network" });
    await expect(
      loaderFor(async () => jsonResponse({}, 503)).loadIndex()
    ).resolves.toEqual({
      status: "error",
      reason: "http",
    });
    await expect(
      loaderFor(async () => jsonResponse({ days: "x" })).loadIndex()
    ).resolves.toEqual({
      status: "error",
      reason: "invalid",
    });
    await expect(
      loaderFor(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => Promise.reject(new SyntaxError("bad")),
          }) as unknown as Response
      ).loadIndex()
    ).resolves.toEqual({ status: "error", reason: "invalid" });
  });

  it("maps a missing day to not-found and a mislabelled day to invalid", async () => {
    const fetchImpl = fetchFrom({
      [`${BASE}/days/20740.json`]: async () => jsonResponse(syntheticDay()),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    await expect(loader.loadDay(20_739)).resolves.toEqual({
      status: "not-found",
    });
    await expect(loader.loadDay(20_740)).resolves.toEqual({
      status: "error",
      reason: "invalid",
    });
    await expect(loader.loadDay(-1)).resolves.toEqual({ status: "not-found" });
  });

  it("refuses a misconfigured data source instead of falling back to the sample", async () => {
    const loader = createVerificationLoader({
      base: "http://example.com",
      isProduction: true,
    });
    await expect(loader.loadIndex()).resolves.toEqual({
      status: "error",
      reason: "config",
    });
    await expect(loader.loadDay(20_741)).resolves.toEqual({
      status: "error",
      reason: "config",
    });
  });

  it("rejects a day file that names a holder", async () => {
    const day = syntheticDay();
    const fetchImpl = fetchFrom({
      [`${BASE}/days/20741.json`]: async () =>
        jsonResponse({
          ...day,
          differences: [
            {
              ...day.differences[0],
              label: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
            },
          ],
        }),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    await expect(loader.loadDay(20_741)).resolves.toEqual({
      status: "error",
      reason: "invalid",
    });
  });
});
