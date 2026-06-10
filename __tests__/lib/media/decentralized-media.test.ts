import {
  getDecentralizedMediaFetchUrls,
  normalizeDecentralizedMediaUrl,
  parseDecentralizedMediaRef,
  resolveDecentralizedMediaInputs,
  to6529ResolverUrl,
  toExternalFallbackUrls,
  toNativeUri,
} from "@/lib/media/decentralized-media";

const CID = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";
const CID_V0 = "QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY";
const TX_ID = "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8";

describe("decentralized media resolver", () => {
  it.each([
    [`ipfs://${CID}/image.png`, "ipfs", CID, "image.png"],
    [`ipfs://ipfs/${CID}/image.png`, "ipfs", CID, "image.png"],
    [`ipns://example.eth/avatar.png`, "ipns", "example.eth", "avatar.png"],
    [`ar://${TX_ID}/metadata.json`, "arweave", TX_ID, "metadata.json"],
    [`https://media.6529.io/ipfs/${CID}/image.png`, "ipfs", CID, "image.png"],
    [
      `https://media.6529.io/arweave/${TX_ID}/metadata.json`,
      "arweave",
      TX_ID,
      "metadata.json",
    ],
    [`https://ipfs.io/ipfs/${CID}/image.png`, "ipfs", CID, "image.png"],
    [`https://cf-ipfs.com/ipfs/${CID}`, "ipfs", CID, ""],
    [`https://${CID}.ipfs.nftstorage.link/image.png`, "ipfs", CID, "image.png"],
    [
      `https://arweave.net/${TX_ID}/metadata.json`,
      "arweave",
      TX_ID,
      "metadata.json",
    ],
    [
      `https://${TX_ID.toLowerCase()}.arweave.net`,
      "arweave",
      TX_ID.toLowerCase(),
      "",
    ],
  ])("parses %s", (input, protocol, id, path) => {
    expect(parseDecentralizedMediaRef(input)).toEqual({
      protocol,
      id,
      path,
    });
  });

  it("builds native, resolver, and external fallback urls", () => {
    const ref = parseDecentralizedMediaRef(
      `https://ipfs.io/ipfs/${CID}/image.png`
    );

    expect(ref).toEqual({ protocol: "ipfs", id: CID, path: "image.png" });
    expect(toNativeUri(ref!)).toBe(`ipfs://${CID}/image.png`);
    expect(to6529ResolverUrl(ref!)).toBe(
      `https://media.6529.io/ipfs/${CID}/image.png`
    );
    expect(toExternalFallbackUrls(ref!)).toEqual(
      expect.arrayContaining([
        `https://ipfs.io/ipfs/${CID}/image.png`,
        `https://cf-ipfs.com/ipfs/${CID}/image.png`,
        `https://${CID}.ipfs.dweb.link/image.png`,
      ])
    );
  });

  it("supports bare IPFS CIDs for legacy inputs", () => {
    expect(parseDecentralizedMediaRef(CID_V0)).toEqual({
      protocol: "ipfs",
      id: CID_V0,
      path: "",
    });
  });

  it("normalizes recognized gateway urls to the 6529 resolver", () => {
    expect(normalizeDecentralizedMediaUrl(`https://arweave.net/${TX_ID}`)).toBe(
      `https://media.6529.io/arweave/${TX_ID}`
    );
  });

  it("returns fetch urls with the resolver first", () => {
    expect(getDecentralizedMediaFetchUrls(`ar://${TX_ID}`).slice(0, 3)).toEqual(
      [
        `https://media.6529.io/arweave/${TX_ID}`,
        `https://arweave.net/${TX_ID}`,
        `https://gateway.arweave.net/${TX_ID}`,
      ]
    );
  });

  it("reports query or hash stripping per item", () => {
    const [item] = resolveDecentralizedMediaInputs([
      `https://ipfs.io/ipfs/${CID}/image.png?download=1#view`,
    ]);

    expect(item).toEqual(
      expect.objectContaining({
        recognized: true,
        native_uri: `ipfs://${CID}/image.png`,
        warnings: ["query_or_hash_stripped"],
      })
    );
  });

  it("keeps unrecognized http urls and invalid inputs item-scoped", () => {
    expect(
      resolveDecentralizedMediaInputs([
        "https://example.com/image.png",
        "nota://valid-media",
        "",
      ])
    ).toEqual([
      {
        input: "https://example.com/image.png",
        recognized: false,
        external_fallback_urls: [],
        warnings: [],
      },
      {
        input: "nota://valid-media",
        recognized: false,
        external_fallback_urls: [],
        warnings: ["unsupported_scheme"],
      },
      {
        input: "",
        recognized: false,
        external_fallback_urls: [],
        warnings: ["invalid_url"],
      },
    ]);
  });
});
