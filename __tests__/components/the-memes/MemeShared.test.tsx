import {
  getMemeFocusLabel,
  getMemeTabTitle,
  getSharedAppServerSideProps,
  MEME_FOCUS,
} from "@/components/the-memes/MemeShared";
import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";

jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));

describe("getMemeTabTitle", () => {
  it("constructs title with id, nft name and focus", () => {
    const nft = { name: "Card" } as any;
    const title = getMemeTabTitle("The Memes", "3", nft, MEME_FOCUS.COLLECTORS);
    expect(title).toBe("Card | The Memes #3 | Collectors");
  });

  it("returns original title when no extras", () => {
    expect(getMemeTabTitle("The Memes")).toBe("The Memes");
  });

  it("uses message-backed focus labels", () => {
    expect(getMemeFocusLabel(MEME_FOCUS.COLLECTORS, "en-GB")).toBe(
      "Collectors"
    );
    expect(
      getMemeTabTitle("The Memes", "3", undefined, MEME_FOCUS.YOUR_TRANSACTIONS)
    ).toBe("The Memes #3 | Your Transactions");
  });

  it("documents en-US fallback for non-English detail labels", () => {
    expect(getMemeFocusLabel(MEME_FOCUS.COLLECTORS, "fr-FR")).toBe(
      "Collectors"
    );
    expect(
      getMemeTabTitle("The Memes", "3", undefined, MEME_FOCUS.HISTORY, "fr-FR")
    ).toBe("The Memes #3 | History");
  });
});

describe("getSharedAppServerSideProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds large branded social metadata for The Memes", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [
        {
          artist: "6529er",
          name: "Seize the Memes",
          thumbnail: "https://cdn.test/seize.png",
        },
      ],
    });

    const metadata = await getSharedAppServerSideProps(
      MEMES_CONTRACT,
      "1",
      MEME_FOCUS.COLLECTORS
    );
    const [image] = metadata.openGraph?.images as {
      alt: string;
      height: number;
      url: string;
      width: number;
    }[];
    const url = new URL(image.url);

    expect(fetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/nfts?contract=${MEMES_CONTRACT}&id=1`
    );
    expect(metadata.title).toBe("Seize the Memes | Collectors");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(image).toMatchObject({
      alt: "Seize the Memes | Collectors social card",
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe(`/api/og-metadata/nfts/${MEMES_CONTRACT}/1`);
    expect(url.searchParams.get("artist")).toBe("6529er");
    expect(url.searchParams.get("badge")).toBe("The Memes");
    expect(url.searchParams.get("collection")).toBe("The Memes");
    expect(url.searchParams.get("image")).toBe("https://cdn.test/seize.png");
    expect(url.searchParams.get("subtitle")).toBe("The Memes #1 | Collections");
    expect(url.searchParams.get("title")).toBe("Seize the Memes | Collectors");
  });

  it("builds Meme Lab social cards without raw media when data is missing", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });

    const metadata = await getSharedAppServerSideProps(
      MEMELAB_CONTRACT,
      "2",
      MEME_FOCUS.LIVE,
      true
    );
    const [image] = metadata.openGraph?.images as {
      url: string;
    }[];
    const url = new URL(image.url);

    expect(fetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/nfts_memelab?contract=${MEMELAB_CONTRACT}&id=2`
    );
    expect(metadata.title).toBe("Meme Lab #2 | Distribution");
    expect(url.pathname).toBe(`/api/og-metadata/nfts/${MEMELAB_CONTRACT}/2`);
    expect(url.searchParams.get("badge")).toBe("Meme Lab");
    expect(url.searchParams.get("collection")).toBe("Meme Lab");
    expect(url.searchParams.get("image")).toBeNull();
    expect(url.searchParams.get("title")).toBe("Meme Lab #2 | Distribution");
  });

  it("encodes NFT lookup query parameters", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });

    await getSharedAppServerSideProps(
      "collection/alpha",
      "token#1",
      MEME_FOCUS.LIVE
    );

    expect(fetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/nfts?contract=collection%2Falpha&id=token%231"
    );
  });

  it("falls back to safe metadata when the NFT lookup fails", async () => {
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const error = new Error("upstream unavailable");
    (fetchUrl as jest.Mock).mockRejectedValue(error);

    try {
      const metadata = await getSharedAppServerSideProps(
        MEMES_CONTRACT,
        "491",
        MEME_FOCUS.ACTIVITY
      );
      const [image] = metadata.openGraph?.images as {
        alt: string;
        url: string;
      }[];
      const url = new URL(image.url);

      expect(metadata.title).toBe("The Memes #491 | Activity");
      expect(metadata.description).toBe("Collections | test.6529.io");
      expect(image.alt).toBe("The Memes #491 | Activity social card");
      expect(url.pathname).toBe(`/api/og-metadata/nfts/${MEMES_CONTRACT}/491`);
      expect(url.searchParams.get("image")).toBeNull();
      expect(url.searchParams.get("subtitle")).toBe("Collections");
      expect(url.searchParams.get("title")).toBe("The Memes #491 | Activity");
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to fetch NFT metadata for social card",
        {
          contract: MEMES_CONTRACT,
          id: "491",
          error,
        }
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("keeps fallback metadata when the NFT row has no usable name", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [{}] });

    const metadata = await getSharedAppServerSideProps(
      MEMES_CONTRACT,
      "491",
      MEME_FOCUS.ACTIVITY
    );
    const [image] = metadata.openGraph?.images as {
      url: string;
    }[];
    const url = new URL(image.url);

    expect(metadata.title).toBe("The Memes #491 | Activity");
    expect(url.searchParams.get("artist")).toBeNull();
    expect(url.searchParams.get("image")).toBeNull();
    expect(url.searchParams.get("title")).toBe("The Memes #491 | Activity");
  });
});
