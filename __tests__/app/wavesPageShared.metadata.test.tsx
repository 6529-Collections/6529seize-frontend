import { commonApiFetch } from "@/services/api/common-api";
import { buildWavesMetadata } from "@/app/waves/waves-page.shared";

jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.io",
    VERSION: "test-version",
  },
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-test": "1" }),
}));

jest.mock("@/helpers/stream.helpers", () => ({
  prefetchWavesOverview: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/app/waves/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="waves-page-client" />,
}));

describe("buildWavesMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the wave OG image endpoint for wave metadata", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      id: "wave-1",
      name: "The Memes - Main Stage",
      author: {
        handle: "punk6529",
        primary_address: "0xfd22004806a6846ea67ad883356be810f0428793",
      },
      metrics: {
        subscribers_count: 3,
        drops_count: 119,
      },
    });

    const metadata = await buildWavesMetadata("wave-1");

    expect(metadata.title).toBe("The Memes - Main Stage by @punk6529");
    expect(metadata.description).toBe("Waves | 6529.io");
    expect(metadata.openGraph).toMatchObject({
      title: "The Memes - Main Stage by @punk6529",
      description: "Waves | 6529.io",
      images: [
        {
          url: "https://6529.io/api/og-metadata/waves/wave-1",
          width: 1200,
          height: 630,
        },
      ],
    });
    expect(metadata.twitter).toEqual({ card: "summary_large_image" });
  });
});
