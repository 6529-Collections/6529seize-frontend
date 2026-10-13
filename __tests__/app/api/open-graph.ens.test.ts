const mockPublicClient = {
  getEnsResolver: jest.fn(),
  getEnsAddress: jest.fn(),
  getEnsText: jest.fn(),
  getEnsName: jest.fn(),
  readContract: jest.fn(),
};

jest.mock("viem", () => {
  const actual = jest.requireActual("viem");
  return {
    ...actual,
    createPublicClient: jest.fn(() => mockPublicClient),
    fallback: jest.fn((value) => value),
    http: jest.fn((...args) => (args.length > 0 ? { url: args[0] } : {})),
  };
});

jest.mock("viem/chains", () => ({ mainnet: { id: 1 } }));
jest.mock(
  "@ensdomains/content-hash",
  () => ({
    getCodec: jest.fn(() => undefined),
    decode: jest.fn(() => ""),
  }),
  { virtual: true }
);
jest.mock("@/app/api/open-graph/tokenUriMetadata", () => ({
  fetchTokenUriJson: jest.fn(),
}));

const ensModule = require("@/app/api/open-graph/ens");

const { getAddress } = jest.requireActual("viem");

const { detectEnsTarget, fetchEnsPreview } = ensModule as {
  detectEnsTarget: (raw: string | null) => any;
  fetchEnsPreview: (target: { kind: string; input: string }) => Promise<any>;
};

describe("ENS utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("detects ENS names", () => {
    expect(detectEnsTarget("vitalik.eth")).toEqual({
      kind: "name",
      input: "vitalik.eth",
    });
    expect(detectEnsTarget("https://app.ens.domains/name/alice.eth")).toEqual({
      kind: "name",
      input: "alice.eth",
    });
  });

  it("detects bare and ENS-app addresses without claiming Etherscan URLs", () => {
    expect(
      detectEnsTarget("0x1234567890abcdef1234567890abcdef12345678")
    ).toEqual({
      kind: "address",
      input: getAddress("0x1234567890abcdef1234567890abcdef12345678"),
    });
    expect(
      detectEnsTarget(
        "https://app.ens.domains/address/0x0000000000000000000000000000000000000001"
      )
    ).toEqual({
      kind: "address",
      input: getAddress("0x0000000000000000000000000000000000000001"),
    });
    expect(
      detectEnsTarget(
        "https://etherscan.io/address/0x0000000000000000000000000000000000000001"
      )
    ).toBeNull();
  });

  it("fetches ENS name previews", async () => {
    const resolverAddress = "0x1111111111111111111111111111111111111111";
    const ownerAddress = "0x2222222222222222222222222222222222222222";
    const registrantAddress = "0x3333333333333333333333333333333333333333";
    const encodedContenthash = "0x";

    mockPublicClient.getEnsResolver.mockResolvedValue(resolverAddress);
    mockPublicClient.getEnsAddress.mockResolvedValue(ownerAddress);
    mockPublicClient.getEnsText.mockImplementation(
      async ({ key }: { key: string }) => {
        if (key === "avatar") {
          return "https://example.com/avatar.png";
        }
        if (key === "url") {
          return "example.com";
        }
        if (key === "com.twitter") {
          return "vitalik";
        }
        if (key === "description") {
          return "  Leading builder  ";
        }
        return null;
      }
    );

    mockPublicClient.readContract.mockImplementation(
      ({ address, functionName }: any) => {
        if (address === resolverAddress && functionName === "contenthash") {
          return encodedContenthash;
        }
        if (
          functionName === "owner" &&
          typeof address === "string" &&
          address.endsWith("d2e1e")
        ) {
          return "0x060f1546642E67c485D56248201feA2f9AB1803C";
        }
        if (functionName === "ownerOf") {
          return registrantAddress;
        }
        if (functionName === "nameExpires") {
          return BigInt(1_700_000_000);
        }
        if (functionName === "getData") {
          return [ownerAddress, 0, BigInt(1_700_000_100)];
        }
        throw new Error(`Unexpected readContract call for ${functionName}`);
      }
    );

    const preview = await fetchEnsPreview({
      kind: "name",
      input: "vitalik.eth",
    });

    expect(preview.type).toBe("ens.name");
    expect(preview.name).toBe("vitalik.eth");
    expect(preview.address).toBe(ownerAddress);
    expect(preview.avatarUrl).toBe("https://example.com/avatar.png");
    expect(preview.records.url).toBe("https://example.com/");
    expect(preview.records["com.twitter"]).toBe("vitalik");
    expect(preview.records.description).toBe("Leading builder");
    expect(preview.contenthash).toBeNull();
    expect(preview.ownership.isWrapped).toBe(true);
    expect(preview.ownership.registrant).toBe(registrantAddress);
    expect(preview.ownership.expiry).toBeGreaterThan(0);
  });

  it("fetches ENS address previews", async () => {
    const address = "0x4444444444444444444444444444444444444444";
    mockPublicClient.getEnsName.mockResolvedValue("alice.eth");
    mockPublicClient.getEnsAddress.mockResolvedValue(address);
    mockPublicClient.getEnsText.mockImplementation(
      async ({ key }: { key: string }) =>
        key === "avatar" ? "https://example.com/avatar.png" : null
    );

    const preview = await fetchEnsPreview({
      kind: "address",
      input: address,
    });

    expect(preview.type).toBe("ens.address");
    expect(preview.primaryName).toBe("alice.eth");
    expect(preview.forwardMatch).toBe(true);
    expect(preview.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("throws for invalid names", async () => {
    await expect(
      fetchEnsPreview({ kind: "name", input: "not a name" })
    ).rejects.toThrow(/^Invalid ENS name provided/);
  });
});

describe("ENS avatars", () => {
  const { fetchTokenUriJson } = jest.requireMock(
    "@/app/api/open-graph/tokenUriMetadata"
  ) as { fetchTokenUriJson: jest.Mock };
  const NFT_CONTRACT = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
  const IPFS_CID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const ARWEAVE_ID = "a".repeat(43);
  const originalFetch = globalThis.fetch;
  const unguardedFetch = jest.fn();
  let addressSeed = 0x5000;

  async function previewAvatar(record: string | null): Promise<unknown> {
    addressSeed += 1;
    const address = getAddress(
      `0x${addressSeed.toString(16).padStart(40, "0")}`
    );
    mockPublicClient.getEnsName.mockResolvedValue("alice.eth");
    mockPublicClient.getEnsAddress.mockResolvedValue(address);
    mockPublicClient.getEnsText.mockImplementation(
      async ({ key }: { key: string }) => (key === "avatar" ? record : null)
    );

    const preview = await fetchEnsPreview({ kind: "address", input: address });
    return preview.avatarUrl;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = unguardedFetch;
  });

  afterEach(() => {
    expect(unguardedFetch).not.toHaveBeenCalled();
    globalThis.fetch = originalFetch;
  });

  it("returns direct image URLs for the browser without fetching them", async () => {
    await expect(previewAvatar("https://example.com/me.png")).resolves.toBe(
      "https://example.com/me.png"
    );
    expect(fetchTokenUriJson).not.toHaveBeenCalled();
  });

  it("maps IPFS avatars to the media resolver", async () => {
    await expect(previewAvatar(`ipfs://${IPFS_CID}`)).resolves.toMatch(
      new RegExp(String.raw`^https://[^/]+/ipfs/${IPFS_CID}$`)
    );
  });

  it("drops inline and unparseable avatar records", async () => {
    await expect(
      previewAvatar("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")
    ).resolves.toBeNull();
    await expect(previewAvatar("not a url")).resolves.toBeNull();
    await expect(previewAvatar(null)).resolves.toBeNull();
  });

  it("resolves ERC-1155 avatars through the guarded metadata fetcher", async () => {
    mockPublicClient.readContract.mockResolvedValue(
      "https://metadata.example/{id}.json"
    );
    fetchTokenUriJson.mockResolvedValue({ image: `ar://${ARWEAVE_ID}` });

    await expect(
      previewAvatar(`eip155:1/erc1155:${NFT_CONTRACT}/26`)
    ).resolves.toMatch(
      new RegExp(String.raw`^https://[^/]+/arweave/${ARWEAVE_ID}$`)
    );
    expect(mockPublicClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: NFT_CONTRACT,
        functionName: "uri",
        args: [26n],
      })
    );
    expect(fetchTokenUriJson).toHaveBeenCalledWith(
      new URL(`https://metadata.example/${"1a".padStart(64, "0")}.json`),
      expect.objectContaining({ policy: expect.any(Object) })
    );
  });

  it("decodes on-chain ERC-721 metadata without a network fetch", async () => {
    const metadata = Buffer.from(
      JSON.stringify({ image: "https://example.com/token.png" })
    ).toString("base64");
    mockPublicClient.readContract.mockResolvedValue(
      `data:application/json;base64,${metadata}`
    );

    await expect(
      previewAvatar(`eip155:1/erc721:${NFT_CONTRACT.toLowerCase()}/7`)
    ).resolves.toBe("https://example.com/token.png");
    expect(mockPublicClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "tokenURI", args: [7n] })
    );
    expect(fetchTokenUriJson).not.toHaveBeenCalled();
  });

  it("decodes raw and URL-encoded on-chain metadata", async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(
      `data:application/json;utf8,${encodeURIComponent(
        JSON.stringify({ image_url: `ipfs://${IPFS_CID}` })
      )}`
    );
    await expect(
      previewAvatar(`eip155:1/erc721:${NFT_CONTRACT}/8`)
    ).resolves.toMatch(new RegExp(String.raw`/ipfs/${IPFS_CID}$`));

    mockPublicClient.readContract.mockResolvedValueOnce(
      JSON.stringify({ image: "https://example.com/raw.png" })
    );
    await expect(
      previewAvatar(`did:nft:eip155:1_erc721:${NFT_CONTRACT}_9`)
    ).resolves.toBe("https://example.com/raw.png");
    expect(fetchTokenUriJson).not.toHaveBeenCalled();
  });

  it("ignores NFT avatars outside Ethereum mainnet or with unusable metadata", async () => {
    await expect(
      previewAvatar(`eip155:137/erc721:${NFT_CONTRACT}/1`)
    ).resolves.toBeNull();
    expect(mockPublicClient.readContract).not.toHaveBeenCalled();

    mockPublicClient.readContract.mockResolvedValue("file:///metadata.json");
    await expect(
      previewAvatar(`eip155:1/erc721:${NFT_CONTRACT}/1`)
    ).resolves.toBeNull();
    expect(fetchTokenUriJson).not.toHaveBeenCalled();
  });
});
