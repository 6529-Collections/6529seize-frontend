import {
  isFarcasterHost,
  parseFarcasterResource,
} from "@/src/services/farcaster/url";

describe("farcaster URL parsing", () => {
  it("identifies farcaster hosts", () => {
    expect(isFarcasterHost("warpcast.com")).toBe(true);
    expect(isFarcasterHost("www.warpcast.com")).toBe(true);
    expect(isFarcasterHost("farcaster.xyz")).toBe(true);
    expect(isFarcasterHost("example.com")).toBe(false);
  });

  it("parses user profiles", () => {
    const url = new URL("https://warpcast.com/alice");
    const result = parseFarcasterResource(url);

    expect(result).toEqual({
      type: "profile",
      username: "alice",
      canonicalUrl: "https://warpcast.com/alice",
    });
  });

  it("rejects blocked profile routes", () => {
    expect(parseFarcasterResource(new URL("https://warpcast.com/alice/likes"))).toBeNull();
  });

  it("parses cast URLs", () => {
    const url = new URL("https://warpcast.com/alice/0xabc");
    const result = parseFarcasterResource(url);

    expect(result).toEqual({
      type: "cast",
      username: "alice",
      castHash: "0xabc",
      canonicalUrl: "https://warpcast.com/alice/0xabc",
    });
  });

  it("parses channel casts", () => {
    const url = new URL("https://warpcast.com/~/channel/dev/0xabc");
    const result = parseFarcasterResource(url);

    expect(result).toEqual({
      type: "cast",
      channel: "dev",
      castHash: "0xabc",
      canonicalUrl: "https://warpcast.com/~/channel/dev/0xabc",
    });
  });

  it("parses channels", () => {
    const url = new URL("https://warpcast.com/~/channel/dev");
    const result = parseFarcasterResource(url);

    expect(result).toEqual({
      type: "channel",
      channel: "dev",
      canonicalUrl: "https://warpcast.com/~/channel/dev",
    });
  });

  it("returns null for unsupported URLs", () => {
    expect(parseFarcasterResource(new URL("https://example.com"))).toBeNull();
    expect(parseFarcasterResource(new URL("https://warpcast.com/~/invalid"))).toBeNull();
  });
});
