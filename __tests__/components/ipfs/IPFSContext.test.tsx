import {
  IpfsProvider,
  resolveIpfsUrl,
  resolveIpfsUrlSync,
  useIpfsService,
} from "@/components/ipfs/IPFSContext";
import { publicEnv } from "@/config/env";
import IpfsService from "@/components/ipfs/IPFSService";
import { render, renderHook, waitFor } from "@testing-library/react";

jest.mock("@/components/ipfs/IPFSService");

const MockIpfsService = IpfsService as jest.MockedClass<typeof IpfsService>;

const originalEnv = { ...publicEnv };
const CID = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(publicEnv, originalEnv);
});

describe("IpfsContext", () => {
  it("initializes IpfsService on mount", async () => {
    const init = jest.fn();
    MockIpfsService.mockImplementation(() => ({ init }) as any);

    render(
      <IpfsProvider>
        <div>child</div>
      </IpfsProvider>
    );

    await waitFor(() => expect(MockIpfsService).toHaveBeenCalled());
    expect(MockIpfsService).toHaveBeenCalledWith({
      apiEndpoint: "https://api-ipfs.test.6529.io",
      mfsPath: "testfiles",
    });
    expect(init).toHaveBeenCalled();
  });

  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => {
        return useIpfsService();
      });
    }).toThrow("useIpfsService must be used within an IpfsProvider");
  });

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
