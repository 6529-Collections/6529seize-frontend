import { parseFarcasterResource } from "@/src/services/farcaster/url";

describe("parseFarcasterResource", () => {
  it("parses profile URLs", () => {
    const result = parseFarcasterResource(new URL("https://warpcast.com/dwr.eth"));
    expect(result).toEqual({
      type: "profile",
      username: "dwr.eth",
      canonicalUrl: "https://warpcast.com/dwr.eth",
    });
  });

  it("parses cast URLs", () => {
    const result = parseFarcasterResource(
      new URL("https://warpcast.com/dwr.eth/0x123abc")
    );
    expect(result).toEqual({
      type: "cast",
      username: "dwr.eth",
      castHash: "0x123abc",
      canonicalUrl: "https://warpcast.com/dwr.eth/0x123abc",
    });
  });

  it("parses channel URLs", () => {
    const result = parseFarcasterResource(
      new URL("https://warpcast.com/~/channel/6529")
    );
    expect(result).toEqual({
      type: "channel",
      channel: "6529",
      canonicalUrl: "https://warpcast.com/~/channel/6529",
    });
  });

  it("parses channel cast URLs", () => {
    const result = parseFarcasterResource(
      new URL("https://warpcast.com/~/channel/6529/0xfeed")
    );
    expect(result).toEqual({
      type: "cast",
      channel: "6529",
      castHash: "0xfeed",
      canonicalUrl: "https://warpcast.com/~/channel/6529/0xfeed",
    });
  });

  it("normalizes www host", () => {
    const result = parseFarcasterResource(
      new URL("https://www.warpcast.com/dwr.eth")
    );
    expect(result).toEqual({
      type: "profile",
      username: "dwr.eth",
      canonicalUrl: "https://warpcast.com/dwr.eth",
    });
  });

  it("rejects profile subpaths", () => {
    const result = parseFarcasterResource(
      new URL("https://warpcast.com/dwr.eth/likes")
    );
    expect(result).toBeNull();
  });

  it("rejects unsupported hosts", () => {
    const result = parseFarcasterResource(new URL("https://example.com/post"));
    expect(result).toBeNull();
  });

  it("supports farcaster.xyz alias", () => {
    const result = parseFarcasterResource(
      new URL("https://farcaster.xyz/dwr")
    );
    expect(result).toEqual({
      type: "profile",
      username: "dwr",
      canonicalUrl: "https://warpcast.com/dwr",
    });
  });
});
