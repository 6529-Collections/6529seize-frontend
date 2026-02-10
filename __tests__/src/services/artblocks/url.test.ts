import {
  buildLiveUrl,
  buildMediaUrl,
  buildTokenApiUrl,
  parseArtBlocksLink,
} from "@/src/services/artblocks/url";

describe("parseArtBlocksLink", () => {
  it("parses flagship token URLs", () => {
    expect(parseArtBlocksLink("https://www.artblocks.io/token/662000")).toEqual({
      tokenId: "662000",
    });
  });

  it("parses contract-specific token URLs", () => {
    const contract = "0x1234567890abcdef1234567890abcdef12345678";
    expect(
      parseArtBlocksLink(`https://www.artblocks.io/token/${contract}/100`)
    ).toEqual({
      contract: contract,
      tokenId: "100",
    });
  });

  it("parses live viewer URLs", () => {
    expect(parseArtBlocksLink("https://live.artblocks.io/token/555"))
      .toEqual({ tokenId: "555" });
  });

  it("parses media URLs", () => {
    expect(parseArtBlocksLink("https://media.artblocks.io/12345.png")).toEqual({
      tokenId: "12345",
    });
  });

  it("parses media proxy URLs with contract", () => {
    const contract = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    expect(
      parseArtBlocksLink(
        `https://media-proxy.artblocks.io/${contract}/777.png`
      )
    ).toEqual({
      contract: contract,
      tokenId: "777",
    });
  });

  it("parses token API URLs", () => {
    expect(parseArtBlocksLink("https://token.artblocks.io/4321")).toEqual({
      tokenId: "4321",
    });
  });

  it("parses token API URLs with contract", () => {
    const contract = "0xaabbccddeeff00112233445566778899aabbccdd";
    expect(
      parseArtBlocksLink(`https://token.artblocks.io/${contract}/4321`)
    ).toEqual({
      contract: contract,
      tokenId: "4321",
    });
  });

  it("rejects unsupported hosts", () => {
    expect(parseArtBlocksLink("https://example.com/token/1")).toBeNull();
  });

  it("rejects invalid contracts", () => {
    expect(
      parseArtBlocksLink("https://www.artblocks.io/token/invalid/100")
    ).toBeNull();
  });

  it("rejects non-numeric token ids", () => {
    expect(parseArtBlocksLink("https://live.artblocks.io/token/not-a-number"))
      .toBeNull();
  });
});

describe("buildMediaUrl", () => {
  it("builds flagship media URLs", () => {
    expect(buildMediaUrl({ tokenId: "10" })).toBe(
      "https://media.artblocks.io/10.png"
    );
  });

  it("builds contract media URLs", () => {
    const contract = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    expect(buildMediaUrl({ tokenId: "10", contract })).toBe(
      `https://media-proxy.artblocks.io/${contract}/10.png`
    );
  });
});

describe("buildLiveUrl", () => {
  it("builds flagship live viewer URLs", () => {
    expect(buildLiveUrl({ tokenId: "99" })).toBe(
      "https://live.artblocks.io/token/flagship-99"
    );
  });

  it("builds contract live viewer URLs", () => {
    expect(
      buildLiveUrl({
        contract: "0x1234567890abcdef1234567890abcdef12345678",
        tokenId: "99",
      })
    ).toBe(
      "https://live.artblocks.io/token/0x1234567890abcdef1234567890abcdef12345678-99"
    );
  });
});

describe("buildTokenApiUrl", () => {
  it("builds flagship API URL", () => {
    expect(buildTokenApiUrl({ tokenId: "5" })).toEqual([
      "https://token.artblocks.io/5",
    ]);
  });

  it("builds contract API URL", () => {
    const contract = "0x1234567890abcdef1234567890abcdef12345678";
    expect(buildTokenApiUrl({ tokenId: "5", contract })).toEqual([
      `https://token.artblocks.io/${contract}/5`,
    ]);
  });
});
