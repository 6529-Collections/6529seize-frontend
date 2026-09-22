import { generateMetadata } from "@/app/meme-lab/page";
import { getAppMetadata } from "@/components/providers/metadata";

jest.mock("@/components/memelab/MemeLab", () => () => null);
jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn((metadata: unknown) => metadata),
  getCollectionSocialCardImagePath: jest.fn(
    (collection: string) => `/social/${collection}`
  ),
  getLargeSocialCardMetadata: jest.fn((metadata: unknown) => metadata),
}));

describe("Meme Lab metadata", () => {
  it("describes the collection rather than only its navigation category", async () => {
    await generateMetadata();

    expect(getAppMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Meme Lab | Collections",
        description:
          "Meme Lab is a 6529 NFT collection connected to The Memes.",
      }),
      { canonicalPath: "/meme-lab" }
    );
  });
});
