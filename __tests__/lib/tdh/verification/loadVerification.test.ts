/**
 * @jest-environment node
 */
import {
  PUBLIC_TDH_FEED_BASE,
  resolveVerificationSource,
} from "@/lib/tdh/verification/feedSource";
import { createVerificationLoader } from "@/lib/tdh/verification/loadVerification.server";
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
    [undefined, true, "remote"],
    ["", true, "remote"],
    ["   ", false, "remote"],
    [undefined, false, "remote"],
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

  it("reads 6529's public feed when no base is configured, in every environment", () => {
    for (const isProduction of [true, false]) {
      const source = resolveVerificationSource(undefined, isProduction);
      expect(source.kind === "remote" && source.base.toString()).toBe(
        PUBLIC_TDH_FEED_BASE
      );
    }
  });

  it("treats the base as a directory so a path can never escape it", () => {
    const source = resolveVerificationSource(BASE, true);
    expect(
      source.kind === "remote" && new URL("index.json", source.base).toString()
    ).toBe("https://verification.example/tdh/index.json");
  });
});

describe("createVerificationLoader", () => {
  it("fetches the public feed without a configured base, and shows no bundled data", async () => {
    const fetchImpl = fetchFrom({
      [`${PUBLIC_TDH_FEED_BASE}index.json`]: async () =>
        jsonResponse(syntheticIndex()),
      [`${PUBLIC_TDH_FEED_BASE}days/20741.json`]: async () =>
        jsonResponse(syntheticDay()),
    });
    const loader = createVerificationLoader({
      base: undefined,
      isProduction: true,
      fetchImpl,
    });
    await expect(loader.loadIndex()).resolves.toMatchObject({
      status: "ok",
      source: "remote",
      indexUrl: `${PUBLIC_TDH_FEED_BASE}index.json`,
    });
    await expect(loader.loadDay(20_741)).resolves.toMatchObject({
      status: "ok",
      dayUrl: `${PUBLIC_TDH_FEED_BASE}days/20741.json`,
    });
    await expect(loader.loadDay(1)).resolves.toEqual({ status: "not-found" });
  });

  it("hashes a day file's bytes, so its page can show exactly what it read", async () => {
    const body = JSON.stringify(syntheticDay());
    const fetchImpl = fetchFrom({
      [`${BASE}/days/20741.json`]: async () =>
        new Response(body, {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    const { createHash } = await import("node:crypto");
    await expect(loader.loadDay(20_741)).resolves.toMatchObject({
      status: "ok",
      sha256: createHash("sha256").update(body).digest("hex"),
      text: body,
    });
  });

  it("keeps a day file's text byte for byte, so a browser can hash it again", async () => {
    const body = `﻿${JSON.stringify(syntheticDay())}`;
    const bytes = new TextEncoder().encode(body);
    const fetchImpl = fetchFrom({
      [`${BASE}/days/20741.json`]: async () =>
        new Response(bytes, {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    const load = await loader.loadDay(20_741);
    const text = load.status === "ok" ? load.text : null;
    // The byte-order mark stays, so the text encodes back to the same bytes.
    expect(text).not.toBeNull();
    expect(new TextEncoder().encode(text ?? "")).toEqual(bytes);
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

  it("reads 403 and 404 as not yet published: the feed's origin answers 403 for a missing file", async () => {
    for (const status of [403, 404]) {
      const loader = createVerificationLoader({
        base: BASE,
        isProduction: true,
        fetchImpl: fetchFrom({
          [`${BASE}/index.json`]: async () =>
            jsonResponse({ error: "AccessDenied" }, status),
          [`${BASE}/days/20742.json`]: async () =>
            jsonResponse({ error: "AccessDenied" }, status),
        }),
      });
      await expect(loader.loadIndex()).resolves.toEqual({ status: "awaiting" });
      await expect(loader.loadDay(20_742)).resolves.toEqual({
        status: "not-found",
      });
    }
    const forbidden = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl: fetchFrom({
        [`${BASE}/index.json`]: async () => jsonResponse({}, 401),
      }),
    });
    await expect(forbidden.loadIndex()).resolves.toEqual({
      status: "error",
      reason: "http",
    });
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

  it("refuses a misconfigured data source instead of falling back to another", async () => {
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

  it("drops any per-record list a day file carries, so no holder reaches the page", async () => {
    const day = syntheticDay();
    const fetchImpl = fetchFrom({
      [`${BASE}/days/20741.json`]: async () =>
        jsonResponse({
          ...day,
          differences: [
            {
              label: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
              fields: [{ name: "memes#1.tdh", rust: 1, python: 1, live: 2 }],
            },
          ],
        }),
    });
    const loader = createVerificationLoader({
      base: BASE,
      isProduction: true,
      fetchImpl,
    });
    const load = await loader.loadDay(20_741);
    expect(load.status).toBe("ok");
    expect(JSON.stringify(load)).not.toContain("0x33fd");
    expect(JSON.stringify(load)).not.toContain("memes#1");
  });

  it("rejects a day file whose cause could carry free text", async () => {
    const day = syntheticDay();
    const fetchImpl = fetchFrom({
      [`${BASE}/days/20741.json`]: async () =>
        jsonResponse({
          ...day,
          differenceSummary: {
            ...day.differenceSummary,
            byCause: { "0x33fd426905f149f8376e227d0c9d3340aad17af1": 1 },
          },
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
