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

import { GET } from "@/app/api/og-metadata/drops/[id]/route";

describe("/api/og-metadata/drops/[id]", () => {
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

  it("fetches drop metadata from the backend and returns an image response", async () => {
    const metadata = {
      entity_type: "DROP",
      entity_id: "drop-1",
      author: { id: "profile-1", handle: "test1234", cic: 0, level: 0 },
      wave: { id: "wave-1", name: "Memes-Chat" },
      drop: {
        id: "drop-1",
        serial_no: 6411,
        drop_type: "CHAT",
        content: "Hello world",
      },
    };
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => metadata,
    });

    const response = await GET(
      { url: "https://6529.test/api/og-metadata/drops/6411" } as Request,
      {
        params: Promise.resolve({ id: "6411" }),
      }
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.test/api/og-metadata/drops/6411",
      { next: { revalidate: 300 } }
    );
    expect(mockLoadMontserratFonts).toHaveBeenCalledTimes(1);
    expect(mockImageResponse).toHaveBeenCalledTimes(1);
    const imageResponseInit = mockImageResponse.mock.calls[0]?.[1];
    expect(imageResponseInit).toMatchObject({
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
      },
    });
    expect(imageResponseInit?.fonts).toBe(mockFonts);
    expect(response).toBe(mockImageResponse.mock.results[0]?.value);
  });

  it("returns 400 when the drop id param is missing", async () => {
    const response = await GET(
      { url: "https://6529.test/api/og-metadata/drops/" } as Request,
      {
        params: Promise.resolve({}),
      }
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Invalid drop id. Use /api/og-metadata/drops/<id>." },
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
      { url: "https://6529.test/api/og-metadata/drops/missing" } as Request,
      {
        params: Promise.resolve({ id: "missing" }),
      }
    );

    expect(mockImageResponse).not.toHaveBeenCalled();
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: "Unable to generate drop OG metadata image." },
      { status: 502 }
    );
    expect(response.status).toBe(502);
  });
});
