/** @jest-environment node */
import { NextRequest } from "next/server";

const mockValidateInteractivePreview = jest.fn();

jest.mock("@/app/api/interactive-preview/validateInteractivePreview", () => ({
  validateInteractivePreview: (...args: unknown[]) =>
    mockValidateInteractivePreview(...args),
}));

type Route = typeof import("@/app/api/interactive-preview/route");

const CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
const SITE = "https://6529.io";

function loadRoute(): Route {
  let route: Route | undefined;
  jest.isolateModules(() => {
    route = require("@/app/api/interactive-preview/route") as Route;
  });
  return route!;
}

function post(
  body: unknown,
  headers: Record<string, string | null> = {},
  ip = "8.8.8.8"
): NextRequest {
  const merged: Record<string, string | null> = {
    host: "6529.io",
    origin: SITE,
    "content-type": "application/json",
    "x-forwarded-for": ip,
    ...headers,
  };
  const requestHeaders = new Headers();
  for (const [name, value] of Object.entries(merged)) {
    if (value !== null) {
      requestHeaders.set(name, value);
    }
  }
  return new NextRequest(`${SITE}/api/interactive-preview`, {
    method: "POST",
    headers: requestHeaders,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/interactive-preview", () => {
  beforeEach(() => {
    mockValidateInteractivePreview.mockReset();
    mockValidateInteractivePreview.mockResolvedValue({
      ok: true,
      finalUrl: `https://media.6529.io/ipfs/${CID}`,
      contentType: "text/html",
    });
  });

  it("returns the validator's result for a same-origin JSON request, never cached", async () => {
    const { POST } = loadRoute();
    const response = await POST(post({ provider: "ipfs", path: CID }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      finalUrl: `https://media.6529.io/ipfs/${CID}`,
      contentType: "text/html",
    });
    expect(mockValidateInteractivePreview).toHaveBeenCalledWith({
      provider: "ipfs",
      path: CID,
    });
  });

  it("passes validation failures through as a 200 result", async () => {
    mockValidateInteractivePreview.mockResolvedValue({
      ok: false,
      reason: "Gateway returned 404.",
    });
    const { POST } = loadRoute();
    const response = await POST(post({ provider: "arweave", path: CID }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: "Gateway returned 404.",
    });
  });

  it("accepts an Origin that matches X-Forwarded-Host", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post(
        { provider: "ipfs", path: CID },
        { host: "internal-origin:3001", "x-forwarded-host": "6529.io" }
      )
    );

    expect(response.status).toBe(200);
  });

  it.each([
    ["no Origin header", { origin: null }],
    ["an opaque Origin", { origin: "null" }],
    ["another site's Origin", { origin: "https://evil.example" }],
    ["a look-alike Origin", { origin: "https://6529.io.evil.example" }],
    ["a different port", { origin: "https://6529.io:8443" }],
    ["a malformed Origin", { origin: "not a url" }],
  ])("rejects %s before any work", async (_label, headers) => {
    const { POST } = loadRoute();
    const response = await POST(post({ provider: "ipfs", path: CID }, headers));

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockValidateInteractivePreview).not.toHaveBeenCalled();
  });

  it.each([
    ["text/plain", 415],
    ["application/x-www-form-urlencoded", 415],
    ["multipart/form-data; boundary=x", 415],
  ])("rejects a %s body", async (contentType, status) => {
    const { POST } = loadRoute();
    const response = await POST(
      post({ provider: "ipfs", path: CID }, { "content-type": contentType })
    );

    expect(response.status).toBe(status);
    expect(mockValidateInteractivePreview).not.toHaveBeenCalled();
  });

  it("accepts a JSON content type with a charset", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post(
        { provider: "ipfs", path: CID },
        { "content-type": "application/json; charset=utf-8" }
      )
    );

    expect(response.status).toBe(200);
  });

  it("rejects a body larger than 2 KB", async () => {
    const { POST } = loadRoute();
    const response = await POST(
      post({ provider: "ipfs", path: "x".repeat(4096) })
    );

    expect(response.status).toBe(413);
    expect(mockValidateInteractivePreview).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["an array", [CID]],
    ["a missing path", { provider: "ipfs" }],
    ["an extra key", { provider: "ipfs", path: CID, url: "https://x.test" }],
    ["an unknown provider", { provider: "http", path: CID }],
    ["a non-string path", { provider: "ipfs", path: 42 }],
    ["an over-long path", { provider: "ipfs", path: "a".repeat(257) }],
  ])("rejects %s with 400", async (_label, body) => {
    const { POST } = loadRoute();
    const response = await POST(post(body));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mockValidateInteractivePreview).not.toHaveBeenCalled();
  });

  it("limits each client to 30 checks a minute", async () => {
    const { POST } = loadRoute();
    for (let index = 0; index < 30; index += 1) {
      const response = await POST(
        post({ provider: "ipfs", path: CID }, {}, "8.8.4.4")
      );
      expect(response.status).toBe(200);
    }

    const limited = await POST(
      post({ provider: "ipfs", path: CID }, {}, "8.8.4.4")
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get("cache-control")).toBe("no-store");
    expect(mockValidateInteractivePreview).toHaveBeenCalledTimes(30);

    const otherClient = await POST(
      post({ provider: "ipfs", path: CID }, {}, "1.1.1.1")
    );
    expect(otherClient.status).toBe(200);
  });

  it("exports POST only", () => {
    expect(Object.keys(loadRoute()).sort()).toEqual(["POST"]);
  });
});
