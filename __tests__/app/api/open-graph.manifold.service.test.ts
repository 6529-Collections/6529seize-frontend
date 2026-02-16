import { createManifoldPlan } from "@/app/api/open-graph/manifold/service";

describe("createManifoldPlan", () => {
  const fetchHtml = jest.fn();
  const assertPublicUrl = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    assertPublicUrl.mockResolvedValue(undefined);
  });

  it("creates a plan for manifold listing URLs", () => {
    const plan = createManifoldPlan(
      new URL("https://manifold.xyz/@andrew-hooker/id/4098474224"),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(
      "manifold:listing:https://manifold.xyz/@andrew-hooker/id/4098474224"
    );
  });

  it("returns null for non-listing manifold URLs", () => {
    const plan = createManifoldPlan(new URL("https://manifold.xyz/@artist"), {
      fetchHtml,
      assertPublicUrl,
    });

    expect(plan).toBeNull();
  });

  it("returns null for lookalike domains", () => {
    const plan = createManifoldPlan(
      new URL("https://notmanifold.xyz/@andrew-hooker/id/4098474224"),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).toBeNull();
  });

  it("parses manifold listing payload with image/title/price", async () => {
    const payload = {
      instanceData: {
        type: "marketplace_listing",
        identifier: "16476",
        metaImage: "https://arweave.net/test-image",
        metaTitle: "The Big Bang",
        metaDescription: "Listing description",
        listing: {
          priceEth: "0.42",
        },
      },
    };

    fetchHtml.mockResolvedValue({
      html: `<html><head><script>hydrateWorkPage(${JSON.stringify(payload)});</script></head></html>`,
      contentType: "text/html",
      finalUrl: "https://manifold.xyz/@andrew-hooker/id/4098474224",
    });

    const plan = createManifoldPlan(
      new URL("https://manifold.xyz/@andrew-hooker/id/4098474224"),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "manifold.listing",
        title: "The Big Bang",
        description: "Listing description",
        siteName: "Manifold",
        manifold: expect.objectContaining({
          listingId: "16476",
          creatorHandle: "andrew-hooker",
          priceEth: "0.42",
        }),
      })
    );
  });

  it("falls back to generic OG response when manifold payload is invalid", async () => {
    fetchHtml.mockResolvedValue({
      html: "<html><head><title>Fallback title</title></head><body>empty</body></html>",
      contentType: "text/html",
      finalUrl: "https://manifold.xyz/@andrew-hooker/id/4098474224",
    });

    const plan = createManifoldPlan(
      new URL("https://manifold.xyz/@andrew-hooker/id/4098474224"),
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
    expect(result?.data.type).not.toBe("manifold.listing");
  });
});
