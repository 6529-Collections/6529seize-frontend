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
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==",
    "base64"
  )
);

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
  getStagingApiKey: () => undefined,
}));

jest.mock("@/app/api/og-metadata/profiles/[identity]/font", () => ({
  loadMontserratFonts: mockLoadMontserratFonts,
}));

import { GET } from "@/app/api/og-metadata/nfts/[contract]/[id]/route";
import {
  GRADIENT_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import React from "react";

const REMEME_CONTRACT = "0x869a96493d64ed5bbbfc24d96c5e84f95e558cf2";
const OG_IMAGE_PROXY_PATH = "/api/og-metadata/image";
const FALLBACK_CACHE_CONTROL =
  "public, max-age=60, s-maxage=300, stale-while-revalidate=300";
const DEFAULT_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400";

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

const collectTextNodes = (node: React.ReactNode): string[] => {
  if (typeof node === "string" || typeof node === "number") {
    return [`${node}`];
  }

  if (!React.isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectTextNodes(node.type(node.props));
  }

  const props = node.props as {
    readonly children?: React.ReactNode;
  };

  return React.Children.toArray(props.children).flatMap((child) =>
    collectTextNodes(child)
  );
};

const streamResponse = (contentType: string, bytes: Uint8Array) => ({
  ok: true,
  headers: new Headers({ "content-type": contentType }),
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
});

const jsonResponse = (data: unknown) =>
  streamResponse(
    "application/json",
    new TextEncoder().encode(JSON.stringify(data))
  );

/** Serves the backend lookup as JSON and the image proxy as a PNG. */
const mockBackend = (apiResponse: unknown) => {
  mockFetch.mockImplementation(async (url: string) => {
    if (url.includes(OG_IMAGE_PROXY_PATH)) {
      return streamResponse("image/png", png);
    }
    return apiResponse === undefined
      ? { ok: false, status: 404, headers: new Headers(), body: null }
      : jsonResponse(apiResponse);
  });
};

const memeResponse = (overrides: Record<string, unknown> = {}) => ({
  data: [
    {
      id: 542,
      contract: MEMES_CONTRACT,
      name: "Open Source",
      artist: "vertigo",
      scaled: "https://cdn.test/542.png",
      ...overrides,
    },
  ],
});

const renderCard = async (
  contract: string,
  id: string,
  query = "",
  host = "https://6529.test"
) => {
  const response = await GET(
    {
      url: `${host}/api/og-metadata/nfts/${contract}/${id}${query}`,
    } as Request,
    { params: Promise.resolve({ contract, id }) }
  );
  const element = mockImageResponse.mock.calls[0]?.[0] as React.ReactNode;
  return { element, response };
};

const getText = (element: React.ReactNode): string =>
  collectTextNodes(element).join(" ");

describe("/api/og-metadata/nfts/[contract]/[id]", () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    mockBackend(undefined);
    mockImageResponse.mockClear();
    mockLoadMontserratFonts.mockReset();
    mockLoadMontserratFonts.mockResolvedValue(mockFonts);
    mockNextResponseJson.mockReset();
    mockNextResponseJson.mockImplementation((body, init) => ({
      body,
      status: init?.status ?? 200,
      json: async () => body,
    }));
  });

  it.each(["", "?format=landscape"])(
    "renders text and artwork resolved from the backend (%s)",
    async (query) => {
      mockBackend(memeResponse());
      const { element } = await renderCard(MEMES_CONTRACT, "542", query);

      expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
      expect(mockImageResponse.mock.calls[0]?.[1]).toEqual({
        width: 1200,
        height: 630,
        fonts: mockFonts,
        headers: { "Cache-Control": DEFAULT_CACHE_CONTROL },
      });
      const text = getText(element);
      expect(text).toContain("Open Source");
      expect(text).toContain("vertigo");
      expect(text).toContain("The Memes");
      expect(
        collectImageSrcs(element).some(
          (src) =>
            src.includes(`${OG_IMAGE_PROXY_PATH}?`) ||
            src.startsWith("data:image/png;base64,")
        )
      ).toBe(true);
    }
  );

  it("ignores display text, badge and artwork supplied in the query", async () => {
    mockBackend(memeResponse());
    const query = new URLSearchParams({
      title: "Injected title",
      subtitle: "Injected subtitle",
      badge: "Injected badge",
      collection: "Injected collection",
      artist: "Injected artist",
      displayId: "Injected id",
      image: "https://attacker.test/card.png",
    });

    const { element } = await renderCard(
      MEMES_CONTRACT,
      "542",
      `?${query.toString()}`
    );

    const text = getText(element);
    expect(text).toContain("Open Source");
    expect(text).toContain("vertigo");
    expect(text).not.toContain("Injected");
    const sources = collectImageSrcs(element).join(" ");
    expect(sources).not.toContain("attacker.test");
    expect(sources).toContain(encodeURIComponent("https://cdn.test/542.png"));
  });

  it("never fetches an artwork URL supplied in the query", async () => {
    mockBackend(undefined);
    const response = await GET(
      {
        url:
          `https://6529.test/api/og-metadata/nfts/${MEMES_CONTRACT}/542` +
          `?format=portrait&image=${encodeURIComponent("https://attacker.test/card.png")}`,
      } as Request,
      { params: Promise.resolve({ contract: MEMES_CONTRACT, id: "542" }) }
    );

    expect(response.status).toBe(502);
    expect(mockImageResponse).not.toHaveBeenCalled();
    const requested = mockFetch.mock.calls.map(([url]) => String(url));
    expect(requested.join(" ")).not.toContain("attacker.test");
  });

  it("builds image proxy URLs from the configured origin, not the request host", async () => {
    mockBackend(memeResponse());
    const { element } = await renderCard(
      MEMES_CONTRACT,
      "542",
      "",
      "https://localhost:3001"
    );

    const proxied = collectImageSrcs(element).filter((src) =>
      src.includes(`${OG_IMAGE_PROXY_PATH}?`)
    );
    expect(proxied.length).toBeGreaterThan(0);
    proxied.forEach((src) => {
      expect(src.startsWith("https://6529.test/")).toBe(true);
    });
  });

  it("preserves long backend image URLs without text truncation", async () => {
    const imageUrl = `https://cdn.test/assets/${"card-path-".repeat(
      24
    )}image.png?signature=${"signed-".repeat(35)}`;
    mockBackend(memeResponse({ scaled: imageUrl }));

    const { element } = await renderCard(MEMES_CONTRACT, "542");

    const proxiedSrc = collectImageSrcs(element).find((src) =>
      src.includes(`${OG_IMAGE_PROXY_PATH}?`)
    );
    expect(imageUrl.length).toBeGreaterThan(180);
    expect(proxiedSrc).toBeDefined();
    if (proxiedSrc === undefined) {
      throw new Error("Expected long image URL to be proxied.");
    }
    expect(new URL(proxiedSrc).searchParams.get("url")).toBe(imageUrl);
  });

  it("renders a ReMeme from the rememes backend lookup", async () => {
    mockBackend({
      data: [
        {
          contract: REMEME_CONTRACT,
          id: "39",
          contract_opensea_data: { collectionName: "SEIZING" },
          metadata: { name: "GDRC #2" },
          media: { thumbnailUrl: "https://cdn.test/thumb.gif" },
          s3_image_scaled: "",
        },
      ],
    });

    const { element } = await renderCard(REMEME_CONTRACT, "39");

    expect(String(mockFetch.mock.calls[0]?.[0])).toBe(
      `https://api.6529.test/api/rememes?contract=${REMEME_CONTRACT}&id=39`
    );
    const text = getText(element);
    expect(text).toContain("GDRC #2");
    expect(text).toContain("SEIZING");
    expect(
      collectImageSrcs(element).some((src) =>
        src.includes(encodeURIComponent("https://cdn.test/thumb.gif"))
      )
    ).toBe(true);
  });

  it.each([
    [MEMES_CONTRACT, "The Memes #542"],
    [GRADIENT_CONTRACT, "6529 Gradient #542"],
    [NEXTGEN_CONTRACT, "NextGen #542"],
    [REMEME_CONTRACT, "NFT #542"],
  ])(
    "renders a neutral card for %s when the lookup is unavailable",
    async (contract, expected) => {
      mockBackend(undefined);

      const { element } = await renderCard(contract, "542");

      expect(getText(element)).toContain(expected);
      expect(mockImageResponse.mock.calls[0]?.[1]).toMatchObject({
        headers: { "Cache-Control": FALLBACK_CACHE_CONTROL },
      });
    }
  );

  it("keeps injected text out of a neutral fallback card", async () => {
    mockBackend(undefined);

    const { element } = await renderCard(
      REMEME_CONTRACT,
      "7",
      `?title=${encodeURIComponent("Claim your reward at attacker.test")}`
    );

    expect(getText(element)).not.toContain("attacker.test");
    expect(getText(element)).toContain("NFT #7");
  });

  it.each([
    ["landscape", 1200, 630],
    ["square", 1080, 1080],
    ["portrait", 1080, 1350],
    ["story", 1080, 1920],
  ])("renders %s at its export dimensions", async (format, width, height) => {
    mockBackend(memeResponse());

    const { element } = await renderCard(
      MEMES_CONTRACT,
      "542",
      `?format=${format}`
    );

    expect(mockImageResponse.mock.calls[0]?.[1]).toMatchObject({
      width,
      height,
    });
    expect(collectImageSrcs(element)).toContain(
      `data:image/png;base64,${Buffer.from(png).toString("base64")}`
    );
  });

  it.each(["landscape", "square", "portrait", "story"])(
    "rejects failed artwork fetches for explicit %s exports",
    async (format) => {
      mockFetch.mockImplementation(async (url: string) =>
        url.includes(OG_IMAGE_PROXY_PATH)
          ? { ok: false, headers: new Headers() }
          : jsonResponse(memeResponse())
      );

      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/${MEMES_CONTRACT}/542?format=${format}`,
        } as Request,
        { params: Promise.resolve({ contract: MEMES_CONTRACT, id: "542" }) }
      );

      expect(response.status).toBe(502);
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "https://localhost/secret.png"])(
    "does not return a placeholder download when export artwork is unavailable (%s)",
    async (scaled) => {
      mockBackend(memeResponse({ scaled }));

      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/${MEMES_CONTRACT}/542?format=story`,
        } as Request,
        { params: Promise.resolve({ contract: MEMES_CONTRACT, id: "542" }) }
      );

      expect(response.status).toBe(502);
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );

  it("retries a transient lookup failure so an export still has its artwork", async () => {
    mockBackend(memeResponse());
    mockFetch.mockImplementationOnce(async () => ({
      ok: false,
      status: 503,
      headers: new Headers(),
      body: null,
    }));

    const { element, response } = await renderCard(
      MEMES_CONTRACT,
      "542",
      "?format=portrait"
    );

    expect(response.status).not.toBe(502);
    expect(getText(element)).toContain("Open Source");
    expect(collectImageSrcs(element)).toContain(
      `data:image/png;base64,${Buffer.from(png).toString("base64")}`
    );
    const lookups = mockFetch.mock.calls.filter(
      ([url]) => !String(url).includes(OG_IMAGE_PROXY_PATH)
    );
    expect(lookups).toHaveLength(2);
  });

  describe("lookup deadline", () => {
    const slowBackend = () =>
      mockFetch.mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes(OG_IMAGE_PROXY_PATH)) {
          return Promise.resolve(streamResponse("image/png", png));
        }
        return new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => resolve(jsonResponse(memeResponse())),
            7_000
          );
          init?.signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new Error("aborted"));
            },
            { once: true }
          );
        });
      });

    it("lets an explicit export wait for a slow lookup", async () => {
      jest.useFakeTimers();
      slowBackend();

      const pending = renderCard(MEMES_CONTRACT, "542", "?format=square");
      await jest.advanceTimersByTimeAsync(7_000);
      const { element, response } = await pending;

      expect(response.status).not.toBe(502);
      expect(getText(element)).toContain("Open Source");
    });

    it("keeps the short deadline for crawler previews", async () => {
      jest.useFakeTimers();
      slowBackend();

      const pending = renderCard(MEMES_CONTRACT, "542");
      await jest.advanceTimersByTimeAsync(7_000);
      const { element } = await pending;

      expect(getText(element)).toContain("The Memes #542");
      expect(getText(element)).not.toContain("Open Source");
    });
  });

  it.each(["wide", "constructor", "__proto__", ""])(
    "rejects unsupported format %s before rendering",
    async (format) => {
      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/${MEMES_CONTRACT}/542?format=${format}`,
        } as Request,
        { params: Promise.resolve({ contract: MEMES_CONTRACT, id: "542" }) }
      );

      expect(response.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLoadMontserratFonts).not.toHaveBeenCalled();
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );

  it("returns 400 when the NFT identity is incomplete", async () => {
    const response = await GET(
      { url: "https://6529.test/api/og-metadata/nfts/0xabc/" } as Request,
      {
        params: Promise.resolve({ contract: "0xabc" }),
      }
    );

    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Invalid NFT. Use /api/og-metadata/nfts/<contract>/<id>." },
      { status: 400 }
    );
    expect(response.status).toBe(400);
  });

  it.each([
    ["0xabc", "42"],
    ["not-a-contract", "42"],
    [MEMES_CONTRACT, "Free text in the path"],
    [MEMES_CONTRACT, "42abc"],
    [MEMES_CONTRACT, "-1"],
    [MEMES_CONTRACT, "1".repeat(79)],
    [`${MEMES_CONTRACT}00`, "42"],
  ])(
    "rejects the unsupported identity %s / %s before any lookup",
    async (contract, id) => {
      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/${encodeURIComponent(contract)}/${encodeURIComponent(id)}`,
        } as Request,
        { params: Promise.resolve({ contract, id }) }
      );

      expect(response.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );
});
