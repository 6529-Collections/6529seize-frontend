/**
 * @jest-environment node
 */
import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import { createFormalManifestLoader } from "@/lib/tdh/formal/loadFormalManifest.server";
import { formalManifestSchema } from "@/lib/tdh/formal/manifest";
import { PUBLIC_TDH_FEED_BASE } from "@/lib/tdh/verification/loadVerification.server";

const BASE = "https://verification.example/tdh";
const URL = `${BASE}/formal/manifest.json`;
const BUNDLED = formalManifestSchema.parse(BUNDLED_FORMAL_MANIFEST);

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function loaderFor(
  handler: (() => Promise<Response>) | null,
  baseOrUnset: string | null = BASE
) {
  const base = baseOrUnset ?? undefined;
  const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
    if (handler === null || String(input) !== URL) {
      throw new Error(`unexpected fetch of ${String(input)}`);
    }
    return handler();
  }) as unknown as jest.MockedFunction<typeof fetch>;
  return {
    fetchImpl,
    load: createFormalManifestLoader({ base, isProduction: true, fetchImpl }),
  };
}

describe("createFormalManifestLoader", () => {
  it("shows the published manifest when the feed serves a valid one", async () => {
    const newer = {
      ...BUNDLED,
      source: { ...BUNDLED.source, commit: "f".repeat(40) },
    };
    const { load, fetchImpl } = loaderFor(async () => jsonResponse(newer));
    const result = await load();
    expect(result.status).toBe("published");
    expect(result.status === "published" && result.url).toBe(URL);
    expect(result.manifest.source.commit).toBe("f".repeat(40));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back to the bundled copy, saying why", async () => {
    const cases: Array<[() => Promise<Response>, string]> = [
      [async () => jsonResponse({ error: "AccessDenied" }, 403), "unpublished"],
      [async () => jsonResponse({}, 404), "unpublished"],
      [async () => jsonResponse({}, 503), "unavailable"],
      [
        async () => {
          throw new DOMException("The operation timed out.", "TimeoutError");
        },
        "unavailable",
      ],
      [async () => jsonResponse({ format: "other" }), "invalid"],
      [
        async () =>
          jsonResponse({
            ...BUNDLED,
            source: { ...BUNDLED.source, dirty: true },
          }),
        "invalid",
      ],
    ];
    for (const [handler, reason] of cases) {
      const result = await loaderFor(handler).load();
      expect(result).toMatchObject({ status: "bundled", reason });
      expect(result.manifest.source.commit).toBe(BUNDLED.source.commit);
    }
  });

  it("never fetches from a misconfigured base", async () => {
    const { load, fetchImpl } = loaderFor(null, "http://example.com");
    await expect(load()).resolves.toMatchObject({
      status: "bundled",
      reason: "unconfigured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads the manifest from 6529's public feed when no base is configured", async () => {
    for (const base of [undefined, ""]) {
      const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
        expect(String(input)).toBe(
          `${PUBLIC_TDH_FEED_BASE}formal/manifest.json`
        );
        return jsonResponse(BUNDLED);
      }) as unknown as jest.MockedFunction<typeof fetch>;
      const load = createFormalManifestLoader({
        base,
        isProduction: true,
        fetchImpl,
      });
      await expect(load()).resolves.toMatchObject({ status: "published" });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });
});
