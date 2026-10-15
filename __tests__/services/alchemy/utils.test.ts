import {
  processContractMetadataResponse,
  processTokenMetadataResponse,
  processTokenUriMetadata,
} from "@/services/alchemy/utils";
import type { AlchemyTokenMetadataEntry } from "@/services/alchemy/types";

const address = "0xe5b281fa9117e8dA3d0502c2C4bB2831e391b471";
const thumbnail = "https://res.cloudinary.com/alchemyapi/thumbnail.png";
const original =
  "https://arweave.net/D_9TET4dn4_WD2jlb6AzIfJkgh6tlQkclBghRQqz_uc";

function tokenImage(token: Partial<AlchemyTokenMetadataEntry>) {
  return processTokenMetadataResponse({
    tokens: [{ tokenId: "17", ...token }],
  })[0]?.imageUrl;
}

describe("Alchemy image metadata", () => {
  it.each([null, "null", "undefined", "", "   ", "not a URL"])(
    "treats unusable collection artwork %p as missing",
    (imageUrl) => {
      expect(
        processContractMetadataResponse(
          { address, openSeaMetadata: { imageUrl } },
          address
        )?.imageUrl
      ).toBeNull();
    }
  );

  it("uses available cached collection artwork after an invalid image field", () => {
    expect(
      processContractMetadataResponse(
        {
          address,
          openSeaMetadata: { imageUrl: "null" },
          image: { cachedUrl: thumbnail },
        },
        address
      )?.imageUrl
    ).toBe(thumbnail);
  });

  it("keeps thumbnails preferred over original artwork", () => {
    expect(
      tokenImage({ image: { thumbnailUrl: thumbnail, originalUrl: original } })
    ).toBe(thumbnail);
  });

  it("ignores an invalid thumbnail and preserves the cached image", () => {
    expect(
      tokenImage({ image: { thumbnailUrl: "null", cachedUrl: thumbnail } })
    ).toBe(thumbnail);
  });

  it.each([
    { image: { originalUrl: original } },
    { metadata: { image: original } },
    { raw: { metadata: { image: original } } },
    { raw: { metadata: { original_image_url: original } } },
  ])("recovers supplied original artwork without a thumbnail: %p", (token) => {
    expect(tokenImage(token)).toBe(original);
  });

  it.each([
    "null",
    "javascript:alert(1)",
    "http://arweave.net/image",
    "https://unknown.example/image",
    "https://arweave.net.evil.example/image",
    "https://user:password@arweave.net/image",
    "https://arweave.net:444/image",
  ])("does not load unsupported raw artwork %s", (image) => {
    expect(tokenImage({ raw: { metadata: { image } } })).toBeNull();
  });

  it("resolves native IPFS artwork through the existing image resolver", () => {
    const cid = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";
    expect(
      processTokenUriMetadata({
        name: "Original title",
        image: `ipfs://${cid}/image.png`,
      })
    ).toEqual({
      name: "Original title",
      imageUrl: `https://media.6529.io/ipfs/${cid}/image.png`,
    });
  });

  it.each([null, [], "invalid"])(
    "ignores invalid original metadata %p",
    (metadata) => {
      expect(processTokenUriMetadata(metadata)).toBeNull();
    }
  );

  it("preserves the supplied token number when artwork is absent", () => {
    expect(
      processTokenMetadataResponse({
        tokens: [
          {
            tokenId: "1",
            name: "#1",
            image: { thumbnailUrl: null, cachedUrl: null, originalUrl: null },
          },
        ],
      })[0]
    ).toMatchObject({ tokenId: 1n, name: "#1", imageUrl: null });
  });
});
