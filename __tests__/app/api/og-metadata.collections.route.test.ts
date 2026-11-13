const mockImageResponse = jest.fn((element, init) => ({
  element,
  init,
}));
const mockNextResponseJson = jest.fn();
const mockFonts = [
  {
    name: "Montserrat",
    data: new ArrayBuffer(8),
    weight: 700,
    style: "normal",
  },
];
const mockLoadMontserratFonts = jest.fn();
const mockFetch = jest.fn();
const originalFetch = global.fetch;

jest.mock("next/og", () => ({
  ImageResponse: mockImageResponse,
}));

jest.mock("next/server", () => ({
  NextResponse: { json: mockNextResponseJson },
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.test",
    API_ENDPOINT: "https://api.6529.test",
  },
}));

jest.mock("@/config/serverEnv", () => ({
  getStagingApiKey: jest.fn(),
}));

jest.mock("@/app/api/og-metadata/profiles/[identity]/font", () => ({
  loadMontserratFonts: mockLoadMontserratFonts,
}));

jest.mock("@/app/api/og-metadata/_lib/brandedCards", () => {
  const actual = jest.requireActual("@/app/api/og-metadata/_lib/brandedCards");
  return {
    ...actual,
    renderBrandedCollectionOgImage: jest.fn(
      actual.renderBrandedCollectionOgImage
    ),
  };
});

import { renderBrandedCollectionOgImage } from "@/app/api/og-metadata/_lib/brandedCards";
import { GET } from "@/app/api/og-metadata/collections/[collection]/route";
import React from "react";

const mockRenderCollection = jest.mocked(renderBrandedCollectionOgImage);

const DEFAULT_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400";
const FALLBACK_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=300";

const collectImageSrcs = (node: React.ReactNode): string[] => {
  if (!React.isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectImageSrcs(node.type(node.props));
  }

  const props = node.props as {
    readonly src?: string | undefined;
    readonly children?: React.ReactNode;
  };
  const current = typeof props.src === "string" ? [props.src] : [];
  const children = React.Children.toArray(props.children).flatMap((child) =>
    collectImageSrcs(child)
  );

  return [...current, ...children];
};

const jsonResponse = (data: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return {
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    body: {
      getReader: () => ({
        read: jest
          .fn()
          .mockResolvedValueOnce({ done: false, value: bytes })
          .mockResolvedValue({ done: true }),
        releaseLock: jest.fn(),
        cancel: jest.fn().mockResolvedValue(undefined),
      }),
    },
  };
};

const mockBackend = (responses: Record<string, unknown>) => {
  mockFetch.mockImplementation(async (url: string) => {
    const path = new URL(url).pathname.replace(/^\/api\//, "");
    return Object.hasOwn(responses, path)
      ? jsonResponse(responses[path])
      : { ok: false, status: 404, headers: new Headers(), body: null };
  });
};

const renderCard = async (slug: string, query = "") => {
  const response = await GET(
    {
      url: `https://6529.test/api/og-metadata/collections/${slug}${query}`,
    } as Request,
    { params: Promise.resolve({ collection: slug }) }
  );
  const element = mockImageResponse.mock.calls[0]?.[0] as React.ReactNode;
  // The card text and artwork the route resolved before layout.
  const model = mockRenderCollection.mock.calls[0]?.[0];
  return { element, model, response };
};

const getCacheControl = (): unknown =>
  (
    mockImageResponse.mock.calls[0]?.[1] as {
      headers: Record<string, string>;
    }
  ).headers["Cache-Control"];

describe("/api/og-metadata/collections/[collection]", () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    mockBackend({});
    mockImageResponse.mockClear();
    mockRenderCollection.mockClear();
    mockLoadMontserratFonts.mockReset();
    mockLoadMontserratFonts.mockResolvedValue(mockFonts);
    mockNextResponseJson.mockReset();
    mockNextResponseJson.mockImplementation((body, init) => ({
      body,
      status: init?.status ?? 200,
      json: async () => body,
    }));
  });

  it("returns a default collection image response for known collections", async () => {
    const { element, model, response } = await renderCard("the-memes");

    expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
    expect(mockImageResponse).toHaveBeenCalledTimes(1);
    expect(mockImageResponse.mock.calls[0]?.[1]).toEqual({
      width: 1200,
      height: 630,
      fonts: mockFonts,
      headers: { "Cache-Control": DEFAULT_CACHE_CONTROL },
    });
    expect(response).toBe(mockImageResponse.mock.results[0]?.value);
    expect(model).toMatchObject({
      slug: "the-memes",
      title: "The Memes",
      subtitle: "The Memes by 6529",
      imageUrl: "/memes-preview.png",
    });
    expect(collectImageSrcs(element)).toContain(
      "https://6529.test/memes-preview.png"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    ["6529-gradient", "6529 Gradient", "The official 6529 Gradient collection"],
    [
      "meme-lab",
      "Meme Lab",
      "Experiments, editions, and collaborations from Meme Lab",
    ],
    ["nextgen", "NextGen", "Generative art collections from 6529"],
    ["rememes", "ReMemes", "Community remixes and derivatives"],
    ["the-memes", "The Memes", "The Memes by 6529"],
  ])("renders the fixed %s card", async (slug, title, subtitle) => {
    const { model } = await renderCard(slug);

    expect(model).toMatchObject({ slug, title, subtitle });
  });

  it("ignores text, badge and artwork supplied in the query", async () => {
    const query = new URLSearchParams({
      title: "Injected title",
      subtitle: "Injected subtitle",
      badge: "Injected badge",
      image: "https://attacker.test/card.png",
    });

    const { element, model } = await renderCard(
      "the-memes",
      `?${query.toString()}`
    );

    expect(model).toMatchObject({
      title: "The Memes",
      subtitle: "The Memes by 6529",
      imageUrl: "/memes-preview.png",
    });
    expect(model?.badge).toBeUndefined();
    expect(JSON.stringify(model)).not.toContain("Injected");
    expect(collectImageSrcs(element).join(" ")).not.toContain("attacker.test");
  });

  it.each(["unknown-collection", "constructor", "__proto__", "toString"])(
    "returns 404 for the unregistered collection %s",
    async (slug) => {
      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/collections/${slug}`,
        } as Request,
        { params: Promise.resolve({ collection: slug }) }
      );

      expect(response.status).toBe(404);
      expect(mockImageResponse).not.toHaveBeenCalled();
      expect(mockLoadMontserratFonts).not.toHaveBeenCalled();
    }
  );

  it("does not render free text from the path on a card", async () => {
    const slug = "Claim-your-reward-at-attacker.test";
    const response = await GET(
      {
        url: `https://6529.test/api/og-metadata/collections/${slug}`,
      } as Request,
      { params: Promise.resolve({ collection: slug }) }
    );

    expect(response.status).toBe(404);
    expect(mockRenderCollection).not.toHaveBeenCalled();
  });

  it.each([
    ["nextgen", "admin", "NextGen Admin", "Manage NextGen collections"],
    [
      "rememes",
      "add",
      "Add a ReMeme",
      "Submit a community remix or derivative",
    ],
  ])(
    "renders the fixed %s %s variant",
    async (slug, variant, title, subtitle) => {
      const { model } = await renderCard(slug, `?variant=${variant}`);

      expect(model).toMatchObject({ slug, title, subtitle });
      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it("ignores variants that the collection does not define", async () => {
    const { model } = await renderCard("meme-lab", "?variant=admin");

    expect(model).toMatchObject({
      title: "Meme Lab",
      subtitle: "Experiments, editions, and collaborations from Meme Lab",
    });
  });

  it("renders the latest Memes mint from the backend", async () => {
    mockBackend({
      memes_latest: { id: 491, name: "Seize the Memes", scaled: "ignored" },
    });

    const { model } = await renderCard("the-memes", "?variant=mint");

    expect(String(mockFetch.mock.calls[0]?.[0])).toBe(
      "https://api.6529.test/api/memes_latest"
    );
    expect(model).toMatchObject({
      title: "Mint #491 | Seize the Memes | The Memes",
      subtitle: "Latest The Memes mint on 6529.io",
      imageUrl: "/memes-preview.png",
    });
    expect(getCacheControl()).toBe(DEFAULT_CACHE_CONTROL);
  });

  it("falls back to a neutral mint card when the backend is unavailable", async () => {
    const { model } = await renderCard("the-memes", "?variant=mint");

    expect(model).toMatchObject({
      title: "Mint | The Memes",
      subtitle: "Latest The Memes mint on 6529.io",
    });
    expect(getCacheControl()).toBe(FALLBACK_CACHE_CONTROL);
  });

  it("renders a NextGen collection from the backend with its artwork", async () => {
    mockBackend({
      "nextgen/collections/1": {
        id: 1,
        name: "Pebbles",
        banner: "https://cdn.test/pebbles-banner.png",
        image: "https://cdn.test/pebbles.png",
      },
    });

    const { element, model } = await renderCard("nextgen", "?collection=1");

    expect(String(mockFetch.mock.calls[0]?.[0])).toBe(
      "https://api.6529.test/api/nextgen/collections/1"
    );
    expect(model).toMatchObject({
      title: "Pebbles",
      subtitle: "Pebbles | NextGen",
      imageUrl: "https://cdn.test/pebbles-banner.png",
    });
    expect(
      collectImageSrcs(element).some((src) =>
        src.includes(encodeURIComponent("https://cdn.test/pebbles-banner.png"))
      )
    ).toBe(true);
    expect(getCacheControl()).toBe(DEFAULT_CACHE_CONTROL);
  });

  it("uses the collection image when it has no banner", async () => {
    mockBackend({
      "nextgen/collections/1": {
        id: 1,
        name: "Pebbles",
        banner: "",
        image: "https://cdn.test/pebbles.png",
      },
    });

    const { model } = await renderCard("nextgen", "?collection=1");

    expect(model?.imageUrl).toBe("https://cdn.test/pebbles.png");
  });

  it("keeps the default artwork when the collection has no images", async () => {
    mockBackend({ "nextgen/collections/1": { id: 1, name: "Pebbles" } });

    const { model } = await renderCard("nextgen", "?collection=1");

    expect(model?.imageUrl).toBe("/nextgen.png");
  });

  it("combines a collection name with a fixed page label", async () => {
    mockBackend({ "nextgen/collections/1": { id: 1, name: "Pebbles" } });

    const { model } = await renderCard(
      "nextgen",
      "?collection=1&view=Trait%20Sets"
    );

    expect(model?.title).toBe("Trait Sets | Pebbles");
    expect(model?.subtitle).toBe("Pebbles | NextGen");
  });

  it("shows only fixed page labels on landing cards", async () => {
    const { model } = await renderCard("nextgen", "?view=Artists");

    expect(model?.title).toBe("Artists | NextGen");
    expect(model?.subtitle).toBe("Generative art collections from 6529");
  });

  it("ignores page labels outside the fixed set", async () => {
    const { model } = await renderCard(
      "nextgen",
      `?view=${encodeURIComponent("Claim your reward at attacker.test")}`
    );

    expect(model?.title).toBe("NextGen");
  });

  it("keeps the neutral NextGen card when the collection lookup fails", async () => {
    const { model } = await renderCard("nextgen", "?collection=1");

    expect(model).toMatchObject({
      title: "NextGen",
      subtitle: "Generative art collections from 6529",
    });
    expect(getCacheControl()).toBe(FALLBACK_CACHE_CONTROL);
  });

  it("ignores a collection response for a different collection", async () => {
    mockBackend({ "nextgen/collections/1": { id: 2, name: "Other" } });

    const { model } = await renderCard("nextgen", "?collection=1");

    expect(model?.title).toBe("NextGen");
    expect(getCacheControl()).toBe(FALLBACK_CACHE_CONTROL);
  });

  it.each(["abc", "1/../2", "1234567890", "-1"])(
    "does not look up the invalid NextGen collection ID %s",
    async (collectionId) => {
      await renderCard(
        "nextgen",
        `?collection=${encodeURIComponent(collectionId)}`
      );

      expect(mockFetch).not.toHaveBeenCalled();
    }
  );

  it("does not look up a NextGen collection for other collections", async () => {
    const { model } = await renderCard("the-memes", "?collection=1");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(model?.title).toBe("The Memes");
  });

  it("preserves long backend image URLs without text truncation", async () => {
    const imageUrl = `https://cdn.test/collections/${"preview-".repeat(
      26
    )}card.png?signature=${"signed-".repeat(35)}`;
    mockBackend({
      "nextgen/collections/1": { id: 1, name: "Pebbles", banner: imageUrl },
    });

    const { element } = await renderCard("nextgen", "?collection=1");

    const proxiedSrc = collectImageSrcs(element).find((src) =>
      src.includes("/api/og-metadata/image?")
    );
    expect(imageUrl.length).toBeGreaterThan(180);
    expect(proxiedSrc).toBeDefined();
    if (proxiedSrc === undefined) {
      throw new Error("Expected long image URL to be proxied.");
    }
    expect(new URL(proxiedSrc).searchParams.get("url")).toBe(imageUrl);
  });

  it("returns 400 when the collection param is missing", async () => {
    const response = await GET(
      { url: "https://6529.test/api/og-metadata/collections/" } as Request,
      {
        params: Promise.resolve({}),
      }
    );

    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error:
          "Invalid collection. Use /api/og-metadata/collections/<collection>.",
      },
      { status: 400 }
    );
    expect(response.status).toBe(400);
  });
});
