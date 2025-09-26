const mockPublicClient = {
  getEnsResolver: jest.fn(),
  getEnsAddress: jest.fn(),
  getEnsAvatar: jest.fn(),
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
jest.mock("@ensdomains/content-hash", () => ({
  getCodec: jest.fn(() => undefined),
  decode: jest.fn(() => ""),
}), { virtual: true });

const ensModule = require("@/app/api/open-graph/ens");

const { getAddress } = jest.requireActual("viem");

const {
  detectEnsTarget,
  fetchEnsPreview,
  __clearEnsCachesForTesting,
  EnsPreviewError,
} = ensModule as {
  detectEnsTarget: (raw: string | null) => any;
  fetchEnsPreview: (target: { kind: string; input: string }) => Promise<any>;
  __clearEnsCachesForTesting: () => void;
  EnsPreviewError: new (status: number, message: string) => Error;
};

describe("ENS utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearEnsCachesForTesting();
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

  it("detects ENS addresses", () => {
    expect(
      detectEnsTarget("0x1234567890abcdef1234567890abcdef12345678")
    ).toEqual({
      kind: "address",
      input: getAddress("0x1234567890abcdef1234567890abcdef12345678"),
    });
    expect(
      detectEnsTarget(
        "https://etherscan.io/address/0x0000000000000000000000000000000000000001"
      )
    ).toEqual({
      kind: "address",
      input: getAddress("0x0000000000000000000000000000000000000001"),
    });
  });

  it("fetches ENS name previews", async () => {
    const resolverAddress = "0x1111111111111111111111111111111111111111";
    const ownerAddress = "0x2222222222222222222222222222222222222222";
    const registrantAddress = "0x3333333333333333333333333333333333333333";
    const encodedContenthash = "0x";

    mockPublicClient.getEnsResolver.mockResolvedValue(resolverAddress);
    mockPublicClient.getEnsAddress.mockResolvedValue(ownerAddress);
    mockPublicClient.getEnsAvatar.mockResolvedValue(
      "https://example.com/avatar.png"
    );
    mockPublicClient.getEnsText.mockImplementation(
      async ({ key }: { key: string }) => {
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
    mockPublicClient.getEnsAvatar.mockResolvedValue(
      "https://example.com/avatar.png"
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
