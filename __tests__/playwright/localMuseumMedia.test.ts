/** @jest-environment node */
import { createHash } from "node:crypto";
import fs from "node:fs";
import type { Page, Route } from "@playwright/test";
import manifest from "../../tests/fixtures/museum-media/manifest.json";
import { installLocalMuseumMedia } from "../../tests/support/localMuseumMedia";

const origin = "http://localhost:3101";
const proxyUrl = (source: string) =>
  `${origin}/api/museum/media?url=${encodeURIComponent(source)}`;

describe("local Museum retained media", () => {
  const environment = process.env["PLAYWRIGHT_ENV"];
  const registerRoute = jest.fn();
  const page = { route: registerRoute } as Pick<Page, "route">;

  beforeEach(() => {
    delete process.env["PLAYWRIGHT_ENV"];
    registerRoute.mockClear();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (environment === undefined) delete process.env["PLAYWRIGHT_ENV"];
    else process.env["PLAYWRIGHT_ENV"] = environment;
  });

  async function registration() {
    await installLocalMuseumMedia(page, origin);
    return registerRoute.mock.calls[0] as Parameters<Page["route"]>;
  }

  function request(source: string, method = "GET") {
    const route = {
      request: () => ({ method: () => method, url: () => proxyUrl(source) }),
      fulfill: jest.fn().mockResolvedValue(undefined),
      fallback: jest.fn().mockResolvedValue(undefined),
      abort: jest.fn().mockResolvedValue(undefined),
    };
    return { mock: route, route: route as unknown as Route };
  }

  it.each([
    undefined,
    "https://staging.6529.io",
    "https://6529.io",
    "http://localhost.example.com",
  ])("keeps live delivery for %s", async (baseURL) => {
    await installLocalMuseumMedia(page, baseURL);
    expect(registerRoute).not.toHaveBeenCalled();
  });

  it.each(["staging", "production"])(
    "preserves explicit %s runs",
    async (value) => {
      process.env["PLAYWRIGHT_ENV"] = value;
      await installLocalMuseumMedia(page, origin);
      expect(registerRoute).not.toHaveBeenCalled();
    }
  );

  it("matches only the same-origin media proxy", async () => {
    const [matches] = await registration();
    if (typeof matches !== "function") throw new Error("Missing URL predicate");
    expect(matches(new URL(proxyUrl(manifest[0]!.url)))).toBe(true);
    for (const url of [
      "https://6529.io/api/museum/media",
      `${origin}/api/other`,
      `${origin}/api/museum/media/extra`,
    ]) {
      expect(matches(new URL(url))).toBe(false);
    }
  });

  it("serves every pinned derivative byte-for-byte without network fallback", async () => {
    const [, handle] = await registration();
    expect(manifest).toHaveLength(18);
    for (const entry of manifest) {
      const { mock, route } = request(entry.url);
      await handle(route, route.request());
      const response = mock.fulfill.mock.calls[0]![0];
      expect(response.status).toBe(200);
      expect(response.contentType).toBe("image/webp");
      expect(createHash("sha256").update(response.body).digest("hex")).toBe(
        entry.sha256
      );
      expect(mock.fallback).not.toHaveBeenCalled();
    }
  });

  it.each(["https://example.com/image.webp", `${manifest[0]!.url}?changed=1`])(
    "fails closed for an unknown derivative %s",
    async (source) => {
      const [, handle] = await registration();
      const { mock, route } = request(source);
      await expect(handle(route, route.request())).rejects.toThrow(
        "Unrecorded Museum media"
      );
      expect(mock.abort).toHaveBeenCalledWith("failed");
      expect(mock.fulfill).not.toHaveBeenCalled();
      expect(mock.fallback).not.toHaveBeenCalled();
    }
  );

  it("preserves request guards for non-GET requests", async () => {
    const [, handle] = await registration();
    const { mock, route } = request(manifest[0]!.url, "POST");
    await handle(route, route.request());
    expect(mock.fallback).toHaveBeenCalledTimes(1);
    expect(mock.fulfill).not.toHaveBeenCalled();
  });

  it("rejects corrupt fixture bytes before installing an interceptor", async () => {
    jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("corrupt"));
    await expect(installLocalMuseumMedia(page, origin)).rejects.toThrow(
      "hash mismatch"
    );
    expect(registerRoute).not.toHaveBeenCalled();
  });
});
