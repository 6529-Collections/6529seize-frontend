import { createFoundationPlan } from "@/app/api/open-graph/foundation/service";

describe("createFoundationPlan", () => {
  const fetchHtml = jest.fn();
  const assertPublicUrl = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    assertPublicUrl.mockResolvedValue(undefined);
  });

  it("creates a plan for foundation mint URLs", () => {
    const plan = createFoundationPlan(
      new URL(
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(
      "foundation:nft:https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
    );
  });

  it("returns null for non-mint foundation URLs", () => {
    const plan = createFoundationPlan(
      new URL("https://foundation.app/collection/example"),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).toBeNull();
  });

  it("returns null for lookalike domains", () => {
    const plan = createFoundationPlan(
      new URL(
        "https://fake-foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).toBeNull();
  });

  it("parses __NEXT_DATA__ payload for title, description, and image", async () => {
    const payload = {
      props: {
        pageProps: {
          pageData: {
            token: {
              chainId: 1,
              contractAddress: "0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4",
              tokenId: 8,
              name: "ALONE",
              description:
                "I survive, and surrender the remainder to a universe shaped by His will",
              media: {
                url: "https://nft-cdn.alchemy.com/eth-mainnet/1b49f7",
                imageMimeType: "IMAGE_GIF",
              },
            },
          },
        },
      },
    };

    fetchHtml.mockResolvedValue({
      html: `<html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(payload)}</script></head></html>`,
      contentType: "text/html; charset=utf-8",
      finalUrl:
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
    });

    const plan = createFoundationPlan(
      new URL(
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "foundation.nft",
        title: "ALONE | Foundation",
        description:
          "I survive, and surrender the remainder to a universe shaped by His will",
        siteName: "Foundation",
        image: expect.objectContaining({
          url: "https://nft-cdn.alchemy.com/eth-mainnet/1b49f7",
          type: "image/gif",
        }),
      })
    );
  });

  it("falls back to Foundation OG card when media URLs are missing", async () => {
    const payload = {
      props: {
        pageProps: {
          pageData: {
            token: {
              chainId: 1,
              contractAddress: "0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4",
              tokenId: 8,
              name: "ALONE",
              description:
                "I survive, and surrender the remainder to a universe shaped by His will",
              media: {
                url: null,
                imageMimeType: "IMAGE_GIF",
              },
              sourceUrl: null,
            },
          },
        },
      },
    };

    fetchHtml.mockResolvedValue({
      html: `<html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(payload)}</script></head></html>`,
      contentType: "text/html; charset=utf-8",
      finalUrl:
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
    });

    const plan = createFoundationPlan(
      new URL(
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "foundation.nft",
        image: expect.objectContaining({
          url: "https://foundation.app/api/og/nft/1/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
          type: "image/gif",
        }),
      })
    );
  });

  it("falls back to generic OG response when __NEXT_DATA__ is missing", async () => {
    fetchHtml.mockResolvedValue({
      html: "<html><head><title>Fallback title</title></head><body></body></html>",
      contentType: "text/html",
      finalUrl:
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
    });

    const plan = createFoundationPlan(
      new URL(
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        title: "Fallback title",
      })
    );
    expect(result?.data.type).not.toBe("foundation.nft");
  });
});
