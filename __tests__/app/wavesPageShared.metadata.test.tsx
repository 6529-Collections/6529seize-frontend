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

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/app/waves/wave-feed-seed.server", () => ({
  fetchServerWaveFeedSeed: jest.fn(),
}));

jest.mock("@/components/waves/WaveServerFeedSeed", () => ({
  __esModule: true,
  default: () => null,
  WaveServerFeedSeedGate: ({ children }: any) => children,
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
          alt: "The Memes - Main Stage wave social card",
        },
      ],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      site: "@6529Collections",
    });
  });

  it("uses chat drop metadata when a serial number is shared", async () => {
    (commonApiFetch as jest.Mock)
      .mockResolvedValueOnce({
        id: "wave-chat",
        name: "Memes-Chat",
        author: {
          handle: "punk6529",
          primary_address: "0xfd22004806a6846ea67ad883356be810f0428793",
        },
      })
      .mockResolvedValueOnce({
        author: {
          handle: "phoebeum",
          primary_address: "0xfe49a85e98941f1a115acd4beb98521023a25802",
        },
        drop: {
          serial_no: 6411,
          drop_type: "CHAT",
        },
      });

    const metadata = await buildWavesMetadata("wave-chat", {
      serialNo: "6411",
    });

    expect(metadata.title).toBe("@phoebeum in Memes-Chat");
    expect(metadata.description).toBe("Waves | 6529.io");
    expect(metadata.openGraph).toMatchObject({
      title: "@phoebeum in Memes-Chat",
      description: "Waves | 6529.io",
      images: [
        {
          url: "https://6529.io/api/og-metadata/drops/6411",
          width: 1200,
          height: 630,
          alt: "@phoebeum drop in Memes-Chat social card",
        },
      ],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      site: "@6529Collections",
    });
  });

  it("uses drop metadata when a drop id query param is shared", async () => {
    (commonApiFetch as jest.Mock)
      .mockResolvedValueOnce({
        id: "wave-chat",
        name: "Memes-Chat",
        author: {
          handle: "punk6529",
          primary_address: "0xfd22004806a6846ea67ad883356be810f0428793",
        },
      })
      .mockResolvedValueOnce({
        author: {
          handle: "phoebeum",
          primary_address: "0xfe49a85e98941f1a115acd4beb98521023a25802",
        },
        drop: {
          serial_no: 6511,
          drop_type: "CHAT",
        },
      });

    const metadata = await buildWavesMetadata("wave-chat", {
      drop: "c6151fb2-3358-40d7-9ce5-8613467f800f",
    });

    expect(commonApiFetch).toHaveBeenLastCalledWith({
      endpoint: "og-metadata/drops/c6151fb2-3358-40d7-9ce5-8613467f800f",
      headers: { "x-test": "1" },
    });
    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          url: "https://6529.io/api/og-metadata/drops/c6151fb2-3358-40d7-9ce5-8613467f800f",
          width: 1200,
          height: 630,
        },
      ],
    });
  });

  it("uses submission drop metadata when a serial number is shared", async () => {
    (commonApiFetch as jest.Mock)
      .mockResolvedValueOnce({
        id: "wave-submission",
        name: "The Memes - Main Stage",
        author: {
          handle: "punk6529",
          primary_address: "0xfd22004806a6846ea67ad883356be810f0428793",
        },
      })
      .mockResolvedValueOnce({
        author: {
          handle: "prxt0",
          primary_address: "0x7f3774eadae4beb01919dec7f32a72e417ab5de3",
        },
        drop: {
          serial_no: 6408,
          drop_type: "SUBMISSION",
          title: "Test resubmission preview",
        },
      });

    const metadata = await buildWavesMetadata("wave-submission", {
      serialNo: "6408",
    });

    expect(metadata.title).toBe("Test resubmission preview by @prxt0");
    expect(metadata.description).toBe(
      "The Memes - Main Stage | Waves | 6529.io"
    );
    expect(metadata.openGraph).toMatchObject({
      title: "Test resubmission preview by @prxt0",
      description: "The Memes - Main Stage | Waves | 6529.io",
      images: [
        {
          url: "https://6529.io/api/og-metadata/drops/6408",
          width: 1200,
          height: 630,
          alt: "Test resubmission preview drop social card",
        },
      ],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      site: "@6529Collections",
    });
  });
});
