import { generateMetadata } from "@/app/the-memes/[id]/page";
import { getSharedAppServerSideProps } from "@/components/the-memes/MemeShared";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";

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

describe("The Memes detail generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchUrl.mockResolvedValue({ data: [prefetchedNft] });
  });

  it("canonicalizes locale query variants to the focused tab URL", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
      alternates: {
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
      canonical: "https://6529.io/the-memes/123?focus=history",
      languages: {
        "en-US": "https://6529.io/the-memes/123",
      },
    });
  });

  it("drops locale and invalid focus variants from the canonical URL", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
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
  });

  it("uses the base card URL for the default live focus", async () => {
    mockShared.mockResolvedValue({
      title: "Meme",
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
  });
});
