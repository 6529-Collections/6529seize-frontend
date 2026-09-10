import { renderHook } from "@testing-library/react";
import { useChainId, useSignTypedData } from "wagmi";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useProfileCmsPublishSign } from "@/hooks/profile-cms/useProfileCmsPublishSign";
import {
  buildProfileCmsPublishTypedData,
  type ProfileCmsPublishContext,
} from "@/lib/profile-cms/builder/publish";

jest.mock("wagmi", () => ({
  useChainId: jest.fn(),
  useSignTypedData: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const useChainIdMock = useChainId as jest.Mock;
const useSignTypedDataMock = useSignTypedData as jest.Mock;
const useSeizeConnectContextMock = useSeizeConnectContext as jest.Mock;

const context: ProfileCmsPublishContext = {
  draftId: "draft-1",
  profileId: "profile-1",
  handle: "punk6529",
  packageId: "pkg-punk6529-builder-mvp",
  version: 3,
  payloadHash: "sha256:aa",
  packageHash: "sha256:bb",
  primaryPath: "/punk6529/index.html",
  receipt: {
    provider: "arweave",
    uri: "ar://tx",
    content_hash: "sha256:bb",
    canonical: true,
    recorded_at: "2026-07-05T00:00:00.000Z",
  },
};

const typedData = buildProfileCmsPublishTypedData({
  context,
  chainId: 1,
  deadline: 1_792_345_678_000,
});

describe("useProfileCmsPublishSign", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useChainIdMock.mockReturnValue(1);
    useSeizeConnectContextMock.mockReturnValue({
      address: "0xowner",
      isConnected: true,
      isSafeWallet: false,
    });
  });

  it("converts uint256 fields to bigint before signing and returns the signature", async () => {
    const signTypedDataAsync = jest.fn(async () => "0xsignature");
    useSignTypedDataMock.mockReturnValue({ signTypedDataAsync });

    const { result } = renderHook(() => useProfileCmsPublishSign());
    const signed = await result.current.signTypedData(typedData);

    expect(signed).toEqual({ ok: true, signature: "0xsignature" });
    const call = signTypedDataAsync.mock.calls[0][0];
    expect(call.message.version).toBe(3n);
    expect(call.message.deadline).toBe(1_792_345_678_000n);
    expect(call.domain.verifyingContract).toBeUndefined();
    expect(result.current.chainId).toBe(1);
    expect(result.current.signerAddress).toBe("0xowner");
    expect(result.current.isSafe).toBe(false);
  });

  it("reports a user rejection distinctly", async () => {
    const rejection = Object.assign(new Error("denied"), {
      name: "UserRejectedRequestError",
    });
    const signTypedDataAsync = jest.fn(async () => {
      throw rejection;
    });
    useSignTypedDataMock.mockReturnValue({ signTypedDataAsync });

    const { result } = renderHook(() => useProfileCmsPublishSign());
    const signed = await result.current.signTypedData(typedData);

    expect(signed).toEqual({ ok: false, rejected: true });
  });

  it("reports a non-rejection signing failure as not-rejected", async () => {
    const signTypedDataAsync = jest.fn(async () => {
      throw new Error("provider offline");
    });
    useSignTypedDataMock.mockReturnValue({ signTypedDataAsync });

    const { result } = renderHook(() => useProfileCmsPublishSign());
    const signed = await result.current.signTypedData(typedData);

    expect(signed).toEqual({ ok: false, rejected: false });
  });

  it("passes through Safe detection from the connect context", () => {
    useSeizeConnectContextMock.mockReturnValue({
      address: "0xsafe",
      isConnected: true,
      isSafeWallet: true,
    });
    useSignTypedDataMock.mockReturnValue({ signTypedDataAsync: jest.fn() });

    const { result } = renderHook(() => useProfileCmsPublishSign());
    expect(result.current.isSafe).toBe(true);
  });
});
