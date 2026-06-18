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

import { GET } from "@/app/api/og-metadata/collections/[collection]/route";
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

describe("/api/og-metadata/collections/[collection]", () => {
  beforeEach(() => {
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

  it("returns a default collection image response for known collections", async () => {
    const response = await GET(
      {
        url: "https://6529.test/api/og-metadata/collections/the-memes",
      } as Request,
      {
        params: Promise.resolve({ collection: "the-memes" }),
      }
    );

    expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
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
    expect(response).toBe(mockImageResponse.mock.results[0]?.value);
  });

  it("preserves long image URLs without text truncation", async () => {
    const imageUrl = `https://cdn.test/collections/${"preview-".repeat(
      26
    )}card.png?signature=${"signed-".repeat(35)}`;

    await GET(
      {
        url:
          "https://6529.test/api/og-metadata/collections/the-memes" +
          `?image=${encodeURIComponent(imageUrl)}`,
      } as Request,
      {
        params: Promise.resolve({ collection: "the-memes" }),
      }
    );

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
