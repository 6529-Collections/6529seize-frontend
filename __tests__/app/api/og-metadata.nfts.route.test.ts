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

import { GET } from "@/app/api/og-metadata/nfts/[contract]/[id]/route";

describe("/api/og-metadata/nfts/[contract]/[id]", () => {
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

  it("returns an image response from path and query display metadata", async () => {
    const request = {
      url:
        "https://6529.test/api/og-metadata/nfts/0xabc/42" +
        "?title=Test%20Meme&collection=The%20Memes&artist=6529er&image=https%3A%2F%2Fcdn.test%2Fmeme.png",
    } as Request;

    const response = await GET(request, {
      params: Promise.resolve({ contract: "0xabc", id: "42" }),
    });

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
});
