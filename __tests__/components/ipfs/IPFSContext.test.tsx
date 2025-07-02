import { renderHook, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import React from "react";
import {
  IpfsProvider,
  useIpfsService,
  resolveIpfsUrl,
} from "../../../components/ipfs/IPFSContext";
import IpfsService from "../../../components/ipfs/IPFSService";

jest.mock("../../../components/ipfs/IPFSService");

const MockIpfsService = IpfsService as jest.MockedClass<typeof IpfsService>;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.IPFS_API_ENDPOINT = "https://test.6529.io";
  process.env.IPFS_GATEWAY_ENDPOINT = "https://gateway";
  process.env.IPFS_MFS_PATH = "files";
});

afterAll(() => {
  delete process.env.IPFS_API_ENDPOINT;
  delete process.env.IPFS_GATEWAY_ENDPOINT;
  delete process.env.IPFS_MFS_PATH;
});

describe("IpfsContext", () => {
  it("initializes IpfsService on mount", async () => {
    const init = jest.fn();
    MockIpfsService.mockImplementation(() => ({ init } as any));

    render(
      <IpfsProvider>
        <div>child</div>
      </IpfsProvider>
    );

    await waitFor(() => expect(MockIpfsService).toHaveBeenCalled());
    expect(MockIpfsService).toHaveBeenCalledWith({
      apiEndpoint: "https://test.6529.io",
      mfsPath: "files",
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

  it("resolves ipfs urls to gateway", async () => {
    const url = await resolveIpfsUrl("ipfs://abc");
    expect(url).toBe("https://gateway/ipfs/abc");
  });

  it("returns original url if env missing", async () => {
    delete process.env.IPFS_API_ENDPOINT;
    delete process.env.IPFS_GATEWAY_ENDPOINT;
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const url = await resolveIpfsUrl("ipfs://xyz");
    expect(url).toBe("ipfs://xyz");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
