const mockImageResponse = jest.fn((element, init) => ({
  element,
  init,
}));
const mockNextResponseJson = jest.fn();
const mockFonts = [
  {
    name: "Montserrat",
    data: new ArrayBuffer(8),
    weight: 400,
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
    API_ENDPOINT: "https://api.test",
    BASE_ENDPOINT: "https://6529.test",
  },
}));

jest.mock("@/app/api/og-metadata/profiles/[identity]/font", () => ({
  loadMontserratFonts: mockLoadMontserratFonts,
}));

import { GET } from "@/app/api/og-metadata/waves/[id]/route";

describe("/api/og-metadata/waves/[id]", () => {
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
    globalThis.fetch = jest.fn();
  });

  it("fetches wave metadata from the backend and returns an image response", async () => {
    const metadata = {
      entity_type: "WAVE",
      entity_id: "wave-1",
      author: { id: "profile-1", handle: "punk6529", cic: 47, level: 100 },
      wave: {
        id: "wave-1",
        name: "Memes-Chat",
        description: "Memes chat is the main chat for the Memes Maxis",
      },
    };
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => metadata,
    });

    const response = await GET(
      { url: "https://6529.test/api/og-metadata/waves/wave%201" } as Request,
      {
        params: Promise.resolve({ id: "wave 1" }),
      }
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test/api/og-metadata/waves/wave%201",
      { next: { revalidate: 3600 } }
    );
    expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
    expect(mockImageResponse).toHaveBeenCalledTimes(1);
    const imageOptions = mockImageResponse.mock.calls[0]?.[1];
    expect(imageOptions?.width).toBe(1200);
    expect(imageOptions?.height).toBe(630);
    expect(imageOptions?.headers).toEqual({
      "Cache-Control":
        "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
    });
    expect(imageOptions?.fonts).toBe(mockFonts);
    expect(response).toBe(mockImageResponse.mock.results[0]?.value);
  });

  it("returns 400 when the wave id param is missing", async () => {
    const response = await GET(
      { url: "https://6529.test/api/og-metadata/waves/" } as Request,
      {
        params: Promise.resolve({}),
      }
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Invalid wave id. Use /api/og-metadata/waves/<id>." },
      { status: 400 }
    );
    expect(response.status).toBe(400);
  });

  it("returns 502 when backend metadata is unavailable", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const response = await GET(
      { url: "https://6529.test/api/og-metadata/waves/missing" } as Request,
      {
        params: Promise.resolve({ id: "missing" }),
      }
    );

    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Unable to generate wave OG metadata image." },
      { status: 502 }
    );
    expect(response.status).toBe(502);
  });
});
