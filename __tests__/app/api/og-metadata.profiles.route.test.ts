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
  {
    name: "Montserrat",
    data: new ArrayBuffer(8),
    weight: 500,
    style: "normal",
  },
  {
    name: "Montserrat",
    data: new ArrayBuffer(8),
    weight: 600,
    style: "normal",
  },
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
    API_ENDPOINT: "https://api.test",
    BASE_ENDPOINT: "https://6529.test",
  },
}));

jest.mock("@/app/api/og-metadata/profiles/[identity]/font", () => ({
  loadMontserratFonts: mockLoadMontserratFonts,
}));

import { GET } from "@/app/api/og-metadata/profiles/[identity]/route";

describe("/api/og-metadata/profiles/[identity]", () => {
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

  it("fetches profile metadata from the backend and returns an image response", async () => {
    const metadata = {
      entity_type: "PROFILE",
      entity_id: "profile-1",
      profile: {
        id: "profile-1",
        handle: "alice",
        primary_address: "0x1234567890abcdef",
        cic: -20,
        rep: 1234,
        level: 7,
        tdh: 99999,
        description: "A test profile",
        twitter_handle: "@alice",
        media: [{ url: "https://cdn.test/avatar.png" }],
        banner: {
          primary: "#112233",
          secondary: "#445566",
          media: [{ url: "https://cdn.test/banner.png" }],
        },
      },
    };
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => metadata,
    });

    const response = await GET(
      {
        url: "https://6529.test/api/og-metadata/profiles/alice%206529",
      } as Request,
      {
        params: Promise.resolve({ identity: "alice 6529" }),
      }
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test/api/og-metadata/profiles/alice%206529",
      { next: { revalidate: 300 } }
    );
    expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
    expect(mockImageResponse).toHaveBeenCalledTimes(1);
    const imageOptions = mockImageResponse.mock.calls[0]?.[1];
    expect(imageOptions?.width).toBe(1200);
    expect(imageOptions?.height).toBe(630);
    expect(imageOptions?.headers).toEqual({
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    });
    expect(imageOptions?.fonts).toBe(mockFonts);
    expect(response).toBe(mockImageResponse.mock.results[0]?.value);
  });

  it("returns 400 when the identity param is missing", async () => {
    const response = await GET(
      { url: "https://6529.test/api/og-metadata/profiles/" } as Request,
      {
        params: Promise.resolve({}),
      }
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Invalid identity. Use /api/og-metadata/profiles/<identity>." },
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
      { url: "https://6529.test/api/og-metadata/profiles/missing" } as Request,
      {
        params: Promise.resolve({ identity: "missing" }),
      }
    );

    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Unable to generate profile OG metadata image." },
      { status: 502 }
    );
    expect(response.status).toBe(502);
  });
});
