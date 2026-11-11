jest.mock("next/server", () => {
  class MockNextResponse {
    readonly body: unknown;
    readonly status: number;
    readonly headers: unknown;

    constructor(body: unknown, init?: { status?: number; headers?: unknown }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers;
    }

    static json = jest.fn((body, init) => ({ body, ...init }));
  }
  return { NextResponse: MockNextResponse };
});
jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("@/lib/e2ee/emoji-pack.server", () => ({
  getE2eeEmojiPack: jest.fn(),
}));
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/e2ee/emoji-pack/route";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getE2eeEmojiPack } from "@/lib/e2ee/emoji-pack.server";
import { NextResponse } from "next/server";

const PACK_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
  "Content-Type": "application/json",
};

function requestFor(path = "/api/e2ee/emoji-pack", clientIp = "8.8.4.60") {
  return {
    headers: new Headers({ "x-forwarded-for": clientIp }),
    nextUrl: new URL(`https://6529.io${path}`),
  } as unknown as NextRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isE2eeEnabled).mockReturnValue(true);
});
it("serves the same public pack without reading any request or chat data", async () => {
  const pack = [{ id: "gm", src: "data:image/webp;base64,UklGRg==" }];
  jest.mocked(getE2eeEmojiPack).mockResolvedValue(pack);
  const response = (await GET(requestFor())) as unknown as {
    body: unknown;
    headers: unknown;
    status: number;
  };
  expect(response.status).toBe(200);
  expect(response.body).toBe(JSON.stringify(pack));
  expect(response.headers).toEqual(PACK_HEADERS);
});
it("serialises an unchanged pack only once", async () => {
  const pack = [{ id: "wave", src: "data:image/webp;base64,UklGRg==" }];
  jest.mocked(getE2eeEmojiPack).mockResolvedValue(pack);
  const stringify = jest.spyOn(JSON, "stringify");
  await GET(requestFor("/api/e2ee/emoji-pack", "8.8.4.61"));
  await GET(requestFor("/api/e2ee/emoji-pack", "8.8.4.61"));
  expect(stringify.mock.calls.filter(([value]) => value === pack)).toHaveLength(
    1
  );
  stringify.mockRestore();
});
it("rejects query strings without building or sending the pack", async () => {
  const response = await GET(requestFor("/api/e2ee/emoji-pack?v=2"));
  expect(getE2eeEmojiPack).not.toHaveBeenCalled();
  expect(response).toEqual(
    expect.objectContaining({
      body: { error: "Unexpected query parameters" },
      status: 400,
    })
  );
});
it("limits repeated requests from one client", async () => {
  jest.mocked(getE2eeEmojiPack).mockResolvedValue([]);
  let response: { status: number } | undefined;
  for (let index = 0; index < 31; index += 1) {
    response = (await GET(
      requestFor("/api/e2ee/emoji-pack", "8.8.4.62")
    )) as unknown as { status: number };
  }
  expect(response?.status).toBe(429);
});
it("does not fetch assets when encrypted messages are disabled", async () => {
  jest.mocked(isE2eeEnabled).mockReturnValue(false);
  await GET(requestFor());
  expect(getE2eeEmojiPack).not.toHaveBeenCalled();
  expect(NextResponse.json).toHaveBeenCalledWith(
    { error: "Not found" },
    { status: 404 }
  );
});
it("fails without sending external image URLs or caching an error", async () => {
  jest.mocked(getE2eeEmojiPack).mockRejectedValue(new Error("upstream"));
  await GET(requestFor("/api/e2ee/emoji-pack", "8.8.4.63"));
  expect(NextResponse.json).toHaveBeenCalledWith(
    { error: "Emoji pack unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
});
