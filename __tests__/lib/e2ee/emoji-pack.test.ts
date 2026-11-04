import { parseE2eeEmojiPack } from "@/lib/e2ee/emoji-pack";

const emoji = { id: "gm", src: "data:image/webp;base64,UklGRg==" };

it("accepts inline catalog assets and rejects URLs, invalid IDs and duplicates", () => {
  expect(parseE2eeEmojiPack([emoji])).toEqual([emoji]);
  for (const invalid of [
    null,
    {},
    [null],
    [emoji, emoji],
    [{ ...emoji, id: "../gm" }],
    [{ ...emoji, id: "x".repeat(63) }],
    [{ ...emoji, src: "https://example.com/track.webp" }],
    [{ ...emoji, src: "data:image/svg+xml;base64,PHN2Zz4=" }],
  ]) {
    expect(() => parseE2eeEmojiPack(invalid)).toThrow();
  }
});
