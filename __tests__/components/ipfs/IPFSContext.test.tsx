import {
  resolveIpfsUrl,
  resolveIpfsUrlSync,
} from "@/components/ipfs/IPFSContext";
import { publicEnv } from "@/config/env";

const mockConstructor = jest.fn();
const mockInit = jest.fn();
const mockAddFile = jest.fn();

jest.mock("@/components/ipfs/IPFSService", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((config: unknown) => {
    mockConstructor(config);
    return { init: mockInit, addFile: mockAddFile };
  }),
}));

const originalEnv = { ...publicEnv };
const CID = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";

type IsolatedUploads = {
  readonly addFileToIpfs: (file: File) => Promise<string>;
  readonly isolatedEnv: typeof publicEnv;
};

// Each test gets a fresh module so the lazily created client starts empty.
function loadUploads(): IsolatedUploads {
  let uploads: IsolatedUploads | undefined;
  jest.isolateModules(() => {
    const { addFileToIpfs } = require("@/components/ipfs/IPFSContext") as {
      addFileToIpfs: (file: File) => Promise<string>;
    };
    const { publicEnv: isolatedEnv } = require("@/config/env") as {
      publicEnv: typeof publicEnv;
    };
    uploads = { addFileToIpfs, isolatedEnv };
  });
  return uploads!;
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(publicEnv, originalEnv);
  mockInit.mockResolvedValue(undefined);
  mockAddFile.mockResolvedValue(CID);
});

describe("IPFS uploads", () => {
  it("does not create the IPFS client until the first upload", async () => {
    const { addFileToIpfs } = loadUploads();
    expect(mockConstructor).not.toHaveBeenCalled();

    const file = new File(["a"], "a.png", { type: "image/png" });
    await expect(addFileToIpfs(file)).resolves.toBe(CID);

    expect(mockConstructor).toHaveBeenCalledWith({
      apiEndpoint: "https://api-ipfs.test.6529.io",
      mfsPath: "testfiles",
    });
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockAddFile).toHaveBeenCalledWith(file);
    expect(mockInit.mock.invocationCallOrder[0]).toBeLessThan(
      mockAddFile.mock.invocationCallOrder[0]!
    );
  });

  it("reuses one prepared client for later uploads", async () => {
    const { addFileToIpfs } = loadUploads();
    await Promise.all([
      addFileToIpfs(new File(["a"], "a.png")),
      addFileToIpfs(new File(["b"], "b.png")),
    ]);
    await addFileToIpfs(new File(["c"], "c.png"));

    expect(mockConstructor).toHaveBeenCalledTimes(1);
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockAddFile).toHaveBeenCalledTimes(3);
  });

  it("still uploads when MFS preparation fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    mockInit.mockRejectedValueOnce(new Error("mkdir failed"));
    try {
      const { addFileToIpfs } = loadUploads();
      await expect(addFileToIpfs(new File(["a"], "a.png"))).resolves.toBe(CID);
      expect(consoleError).toHaveBeenCalledWith(
        "Error initializing IPFS service",
        expect.any(Error)
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("rejects without an IPFS API endpoint and retries on the next upload", async () => {
    const { addFileToIpfs, isolatedEnv } = loadUploads();
    const configuredEndpoint = isolatedEnv.IPFS_API_ENDPOINT;
    isolatedEnv.IPFS_API_ENDPOINT = undefined;
    await expect(addFileToIpfs(new File(["a"], "a.png"))).rejects.toThrow(
      "Missing IPFS_API_ENDPOINT"
    );
    expect(mockConstructor).not.toHaveBeenCalled();

    isolatedEnv.IPFS_API_ENDPOINT = configuredEndpoint;
    await expect(addFileToIpfs(new File(["a"], "a.png"))).resolves.toBe(CID);
    expect(mockConstructor).toHaveBeenCalledTimes(1);
  });
});

describe("IPFS URL resolution", () => {
  it("resolves ipfs urls to gateway", () => {
    const url = resolveIpfsUrl(`ipfs://${CID}`);
    expect(url).toBe(`https://media.6529.io/ipfs/${CID}`);
  });

  it("resolves synchronously when needed", () => {
    expect(resolveIpfsUrlSync(`ipfs://${CID}`)).toBe(
      `https://media.6529.io/ipfs/${CID}`
    );
  });

  it("normalizes ipfs.io urls back to the 6529 resolver", () => {
    expect(resolveIpfsUrlSync(`https://ipfs.io/ipfs/${CID}`)).toBe(
      `https://media.6529.io/ipfs/${CID}`
    );
  });

  it("uses the configured media resolver endpoint when provided", () => {
    publicEnv.MEDIA_RESOLVER_ENDPOINT = "https://media.test.6529.io/base";

    expect(resolveIpfsUrlSync(`https://ipfs.io/ipfs/${CID}?x=1#hash`)).toBe(
      `https://media.test.6529.io/base/ipfs/${CID}`
    );
  });

  it("does not require the legacy gateway endpoint to resolve media", () => {
    publicEnv.IPFS_GATEWAY_ENDPOINT = undefined;
    publicEnv.IPFS_API_ENDPOINT = undefined;
    const url = resolveIpfsUrl(`ipfs://${CID}`);
    expect(url).toBe(`https://media.6529.io/ipfs/${CID}`);
  });
});
