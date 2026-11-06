jest.mock("next/server", () => ({
  NextResponse: { json: jest.fn((body, init) => ({ body, ...init })) },
}));
jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("@/lib/e2ee/emoji-pack.server", () => ({
  getE2eeEmojiPack: jest.fn(),
}));
import { GET } from "@/app/api/e2ee/emoji-pack/route";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getE2eeEmojiPack } from "@/lib/e2ee/emoji-pack.server";
import { NextResponse } from "next/server";

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isE2eeEnabled).mockReturnValue(true);
});
it("serves the same public pack without reading any request or chat data", async () => {
  const pack = [{ id: "gm", src: "data:image/webp;base64,UklGRg==" }];
  jest.mocked(getE2eeEmojiPack).mockResolvedValue(pack);
  await GET();
  expect(NextResponse.json).toHaveBeenCalledWith(pack, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
});
it("does not fetch assets when encrypted messages are disabled", async () => {
  jest.mocked(isE2eeEnabled).mockReturnValue(false);
  await GET();
  expect(getE2eeEmojiPack).not.toHaveBeenCalled();
  expect(NextResponse.json).toHaveBeenCalledWith(
    { error: "Not found" },
    { status: 404 }
  );
});
it("fails without sending external image URLs or caching an error", async () => {
  jest.mocked(getE2eeEmojiPack).mockRejectedValue(new Error("upstream"));
  await GET();
  expect(NextResponse.json).toHaveBeenCalledWith(
    { error: "Emoji pack unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
});
