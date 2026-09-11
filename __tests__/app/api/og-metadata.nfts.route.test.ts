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
  },
}));

jest.mock("@/app/api/og-metadata/profiles/[identity]/font", () => ({
  loadMontserratFonts: mockLoadMontserratFonts,
}));

import { GET } from "@/app/api/og-metadata/nfts/[contract]/[id]/route";
import React from "react";

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

describe("/api/og-metadata/nfts/[contract]/[id]", () => {
  afterAll(() => {
    global.fetch = originalFetch;
  });
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    mockFetch.mockImplementation(async () => ({
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: png })
            .mockResolvedValue({ done: true }),
          releaseLock: jest.fn(),
          cancel: jest.fn().mockResolvedValue(undefined),
        }),
      },
    }));
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

  it("returns an image response from path and query display metadata", async () => {
    const request = {
      url:
        "https://6529.test/api/og-metadata/nfts/0xabc/10000000042" +
        "?title=Test%20Meme&collection=The%20Memes&artist=6529er&displayId=42&image=https%3A%2F%2Fcdn.test%2Fmeme.png",
    } as Request;

    const response = await GET(request, {
      params: Promise.resolve({ contract: "0xabc", id: "10000000042" }),
    });

    expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockImageResponse).toHaveBeenCalledTimes(1);
    expect(mockImageResponse.mock.calls[0]?.[1]).toEqual({
      width: 1200,
      height: 630,
      fonts: mockFonts,
      headers: {
        "Cache-Control":
          "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
    const element = mockImageResponse.mock.calls[0]?.[0] as React.ReactNode;
    const textNodes = collectTextNodes(element);
    expect(textNodes.join(" ")).toContain("#42");
    expect(textNodes).not.toContain("#10,000,000,042");
    expect(response).toBe(mockImageResponse.mock.results[0]?.value);
  });

  it("preserves long image URLs without text truncation", async () => {
    const imageUrl = `https://cdn.test/assets/${"card-path-".repeat(
      24
    )}image.png?signature=${"signed-".repeat(35)}`;
    const request = {
      url:
        "https://6529.test/api/og-metadata/nfts/0xabc/42" +
        `?title=Long%20Image&image=${encodeURIComponent(imageUrl)}`,
    } as Request;

    await GET(request, {
      params: Promise.resolve({ contract: "0xabc", id: "42" }),
    });

    const element = mockImageResponse.mock.calls[0]?.[0] as React.ReactNode;
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
    ["landscape", 1200, 630],
    ["square", 1080, 1080],
    ["portrait", 1080, 1350],
    ["story", 1080, 1920],
  ])("renders %s at its export dimensions", async (format, width, height) => {
    await GET(
      {
        url: `https://6529.test/api/og-metadata/nfts/0xabc/42?format=${format}&image=https%3A%2F%2Fcdn.test%2Fmeme.png`,
      } as Request,
      { params: Promise.resolve({ contract: "0xabc", id: "42" }) }
    );

    expect(mockImageResponse.mock.calls[0]?.[1]).toMatchObject({
      width,
      height,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(collectImageSrcs(mockImageResponse.mock.calls[0]?.[0])).toContain(
      `data:image/png;base64,${Buffer.from(png).toString("base64")}`
    );
  });

  it.each(["landscape", "square", "portrait", "story"])(
    "rejects failed artwork fetches for explicit %s exports",
    async (format) => {
      mockFetch.mockResolvedValue({ ok: false, headers: new Headers() });
      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/0xabc/42?format=${format}&image=https%3A%2F%2Fcdn.test%2Fmissing.png`,
        } as Request,
        { params: Promise.resolve({ contract: "0xabc", id: "42" }) }
      );
      expect(response.status).toBe(502);
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );

  it.each(["wide", "constructor", "__proto__", ""])(
    "rejects unsupported format %s before rendering",
    async (format) => {
      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/0xabc/42?format=${format}`,
        } as Request,
        { params: Promise.resolve({ contract: "0xabc", id: "42" }) }
      );

      expect(response.status).toBe(400);
      expect(mockLoadMontserratFonts).not.toHaveBeenCalled();
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "https://localhost/secret.png"])(
    "does not return a placeholder download when export artwork is unavailable",
    async (image) => {
      const search = new URLSearchParams({ format: "story" });
      if (image) search.set("image", image);
      const response = await GET(
        {
          url: `https://6529.test/api/og-metadata/nfts/0xabc/42?${search}`,
        } as Request,
        { params: Promise.resolve({ contract: "0xabc", id: "42" }) }
      );

      expect(response.status).toBe(502);
      expect(mockImageResponse).not.toHaveBeenCalled();
    }
  );
});
