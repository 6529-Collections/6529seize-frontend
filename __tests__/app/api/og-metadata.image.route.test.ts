jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    fetchPublicUrl: jest.fn(),
  };
});

class MockNextResponse {
  readonly body: BodyInit | null;
  readonly headers: { get: (name: string) => string | null };
  readonly status: number;

  constructor(body: BodyInit | null, init?: ResponseInit) {
    const headerValues = new Map<string, string>();
    Object.entries(init?.headers ?? {}).forEach(([key, value]) => {
      headerValues.set(key.toLowerCase(), `${value}`);
    });
    this.body = body;
    this.headers = {
      get: (name: string) => headerValues.get(name.toLowerCase()) ?? null,
    };
    this.status = init?.status ?? 200;
  }

  static json(body: unknown, init?: ResponseInit): MockNextResponse {
    const headers = init?.headers
      ? { ...init.headers, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    return new MockNextResponse(JSON.stringify(body), {
      ...init,
      headers,
    });
  }

  async json(): Promise<unknown> {
    if (typeof this.body !== "string") {
      throw new Error("Mock JSON response body must be a string.");
    }

    return JSON.parse(this.body);
  }
}

jest.mock("next/server", () => ({
  NextResponse: MockNextResponse,
}));

import { GET } from "@/app/api/og-metadata/image/route";
import { fetchPublicUrl } from "@/lib/security/urlGuard";
import type { NextRequest } from "next/server";

const mockFetchPublicUrl = fetchPublicUrl as jest.Mock;
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

const createRequest = (sourceUrl: string): NextRequest =>
  ({
    nextUrl: new URL(
      `http://localhost:3001/api/og-metadata/image?url=${encodeURIComponent(
        sourceUrl
      )}&w=1108`
    ),
  }) as NextRequest;

const createReadableBody = (buffer: Buffer) => {
  let hasRead = false;
  return {
    getReader: () => ({
      cancel: jest.fn(),
      read: jest.fn(async () => {
        if (hasRead) {
          return { done: true, value: undefined };
        }
        hasRead = true;
        return { done: false, value: new Uint8Array(buffer) };
      }),
      releaseLock: jest.fn(),
    }),
  };
};

const createHeaders = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? null,
});

const mockImageResponse = (contentLength: number): void => {
  mockFetchPublicUrl.mockResolvedValue(
    {
      body: createReadableBody(PNG_1X1),
      headers: {
        get: createHeaders({
          "content-length": `${contentLength}`,
          "content-type": "image/png",
        }).get,
      },
      ok: true,
      status: 200,
    }
  );
};

describe("/api/og-metadata/image", () => {
  beforeEach(() => {
    mockFetchPublicUrl.mockReset();
  });

  it("normalizes source images up to 50 MiB for drop OG previews", async () => {
    mockImageResponse(50 * 1024 * 1024);

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/drop.png")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
  });

  it("still rejects source images above the proxy cap", async () => {
    mockImageResponse(51 * 1024 * 1024);

    const response = await GET(
      createRequest("https://d3lqz0a4bldqgf.cloudfront.net/huge.png")
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to normalize image",
    });
  });

  it("keeps invalid media urls as JSON errors", async () => {
    const response = await GET(createRequest("http://localhost/secret.png"));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Invalid image url",
    });
  });
});
