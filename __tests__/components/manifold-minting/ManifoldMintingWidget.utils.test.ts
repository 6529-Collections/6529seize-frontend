import {
  createMintReceipt,
  type MintArtwork,
} from "@/components/manifold-minting/ManifoldMintingWidget.utils";
import { MEMES_CONTRACT } from "@/constants/constants";

const input = {
  locale: "en-US" as const,
  contract: MEMES_CONTRACT,
  tokenId: 547,
  quantity: 3,
  recipient: "0x0000000000000000000000000000000000000abc",
};

describe("createMintReceipt", () => {
  it.each([undefined, null, 42, {}, "", "   "])(
    "keeps the submitted mint details when metadata has an invalid name (%p)",
    (name) => {
      // Metadata arrives over the network and can violate its declared type.
      const artwork = { name } as unknown as MintArtwork;
      expect(createMintReceipt({ ...input, artwork })).toEqual({
        quantity: input.quantity,
        recipient: input.recipient,
        artworkName: "The Memes #547",
        imageUrl: undefined,
        collectionLabel: undefined,
      });
    }
  );

  it("keeps a valid artwork name when its metadata image URL is malformed", () => {
    const artwork = {
      name: "  A confirmed artwork  ",
      imageUrl: 42,
    } as unknown as MintArtwork;
    expect(createMintReceipt({ ...input, artwork })).toEqual({
      quantity: input.quantity,
      recipient: input.recipient,
      artworkName: "A confirmed artwork",
      imageUrl: undefined,
      collectionLabel: "The Memes #547",
    });
  });
});
