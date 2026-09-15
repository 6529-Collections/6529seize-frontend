import TheMemesDetailPage, {
  generateMetadata,
} from "@/app/the-memes/[id]/page";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import type { MemePageInitialData } from "@/components/the-memes/useMemePageFallbackData";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";
import type { ReactElement } from "react";

jest.mock("@/components/the-memes/MemePage", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@/components/the-memes/MemeShared", () => {
  const actual = jest.requireActual("@/components/the-memes/MemeShared");

  return {
    ...actual,
    getSharedAppServerSideProps: jest.fn(),
  };
});

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  getCanonicalNextMintNumber: () => 123,
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.test.6529.io",
    BASE_ENDPOINT: "https://6529.io",
  },
}));

const mockShared = getSharedAppServerSideProps as jest.Mock;
const mockFetchUrl = fetchUrl as jest.Mock;
const prefetchedNft = {
  id: 123,
  contract: MEMES_CONTRACT,
  name: "Meme",
};
const prefetchedMetadata = {
  id: 123,
  meme: 123,
  meme_name: "Meme",
};

async function getInitialDataFromPage(): Promise<
  MemePageInitialData | undefined
> {
  const page = await TheMemesDetailPage({
    params: Promise.resolve({ id: "123" }),
  });
  const children = (
    page as ReactElement<{
      readonly children: readonly ReactElement[];
    }>
  ).props.children;
  const memePage = children[1] as ReactElement<{
    readonly initialData?: MemePageInitialData | undefined;
  }>;

  return memePage.props.initialData;
}

describe("The Memes detail page data seed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes complete server data to the card", async () => {
    mockFetchUrl.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.includes("/api/nfts?")
          ? [prefetchedNft]
          : [prefetchedMetadata],
      })
    );

    await expect(getInitialDataFromPage()).resolves.toEqual({
      nft: prefetchedNft,
      nftMeta: prefetchedMetadata,
      nftNotFound: false,
    });
  });

  it("passes the upcoming state when metadata is not found", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(getInitialDataFromPage()).resolves.toEqual({
      nftNotFound: true,
    });
  });

  it.each([
    ["the NFT is missing", [prefetchedMetadata], []],
    [
      "metadata is duplicated",
      [prefetchedMetadata, prefetchedMetadata],
      [prefetchedNft],
    ],
  ])("uses the client fallback when %s", async (_case, metadata, nfts) => {
    mockFetchUrl.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.includes("/api/nfts?") ? nfts : metadata,
      })
    );

    await expect(getInitialDataFromPage()).resolves.toBeUndefined();
  });
});

describe("The Memes detail generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchUrl.mockResolvedValue({ data: [prefetchedNft] });
  });

  it("canonicalizes locale query variants to the focused tab URL", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
      openGraph: {
        title: "Meme",
        url: "https://6529.io/the-memes/123?focus=activity",
        images: [
          { url: "https://6529.io/meme-preview.png", width: 1200, height: 630 },
        ],
      },
      alternates: {
        canonical: "https://6529.io/the-memes/123?focus=activity",
        languages: {
          "en-US": "https://6529.io/the-memes/123",
        },
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({
        focus: "history",
        locale: "fr-FR",
      }),
    });

    expect(mockShared).toHaveBeenCalledWith(
      MEMES_CONTRACT,
      "123",
      "history",
      false,
      "fr-FR",
      prefetchedNft
    );
    expect(metadata.alternates).toMatchObject({
      canonical: "https://6529.io/the-memes/123?focus=activity",
      languages: {
        "en-US": "https://6529.io/the-memes/123",
      },
    });
    expect(metadata.openGraph).toEqual({
      title: "Meme",
      images: [
        { url: "https://6529.io/meme-preview.png", width: 1200, height: 630 },
      ],
      url: "https://6529.io/the-memes/123?focus=activity",
    });
  });

  it("drops locale and invalid focus variants from the canonical URL", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
      alternates: { canonical: "https://6529.io/the-memes/123" },
      openGraph: { url: "https://6529.io/the-memes/123" },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({
        focus: "not-a-tab",
        locale: "fr-FR",
      }),
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "https://6529.io/the-memes/123",
    });
    expect(metadata.openGraph?.url).toBe("https://6529.io/the-memes/123");
  });

  it("uses the base card URL for the default live focus", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
      alternates: { canonical: "https://6529.io/the-memes/123" },
      openGraph: { url: "https://6529.io/the-memes/123" },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({
        focus: "live",
        locale: "fr-FR",
      }),
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "https://6529.io/the-memes/123",
    });
    expect(metadata.openGraph?.url).toBe("https://6529.io/the-memes/123");
  });

  it("keeps the confirmed next mint indexable at its canonical card URL", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });
    mockShared.mockResolvedValue({
      title: "The Memes #123",
      alternates: { canonical: "https://6529.io/the-memes/123" },
      robots: { index: true, follow: true },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({}),
    });

    expect(mockShared).toHaveBeenCalledWith(
      MEMES_CONTRACT,
      "123",
      "",
      false,
      "en-US",
      null
    );
    expect(metadata).toMatchObject({
      alternates: { canonical: "https://6529.io/the-memes/123" },
      robots: { index: true, follow: true },
    });
  });

  it("noindexes temporary source failures instead of treating them as missing", async () => {
    mockFetchUrl.mockRejectedValue(new Error("upstream unavailable"));

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "901" }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(mockShared).not.toHaveBeenCalled();
  });

  it.each([
    ["non-array payloads", {}, {}],
    [
      "duplicate NFT records",
      [prefetchedNft, prefetchedNft],
      [prefetchedMetadata],
    ],
    [
      "mismatched record IDs",
      [{ ...prefetchedNft, id: 124 }],
      [{ ...prefetchedMetadata, id: 124 }],
    ],
  ])("noindexes %s as unavailable", async (_case, nfts, metadata) => {
    mockFetchUrl.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.includes("/api/nfts?") ? nfts : metadata,
      })
    );

    const result = await generateMetadata({
      params: Promise.resolve({ id: "123" }),
      searchParams: Promise.resolve({}),
    });

    expect(result.robots).toEqual({ index: false, follow: true });
    expect(mockShared).not.toHaveBeenCalled();
  });

  it("rejects arbitrary absent card IDs", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(
      generateMetadata({
        params: Promise.resolve({ id: "99999999" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow();
  });
});
