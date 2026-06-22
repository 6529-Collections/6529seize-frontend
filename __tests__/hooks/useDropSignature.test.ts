import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { useSignMessage } from "wagmi";
import { UserRejectedRequestError } from "viem";

jest.mock("wagmi", () => ({ useSignMessage: jest.fn() }));

jest.mock("@/services/wallet-signatures/structured-wallet-signatures", () => ({
  buildDropSignatureMessage: jest.fn(),
  isStructuredSignaturesEnabled: jest.fn(() => false),
}));

const mockHash = "hash";
jest.mock("@/utils/drop-hasher", () => ({
  DropHasher: class {
    hash() {
      return mockHash;
    }
  },
}));

const mockSetToast = jest.fn();
const dropSignatureFailedMessage =
  "Signature failed. Make sure your wallet is connected and unlocked, and that you are using the wallet linked to your 6529 account. If it still fails, log out of 6529 and log back in, then try again.";

describe("useDropSignature", () => {
  beforeEach(() => {
    mockSetToast.mockClear();
    jest.spyOn(React, "useContext").mockReturnValue({ setToast: mockSetToast });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns signature when user signs", async () => {
    (useSignMessage as jest.Mock).mockReturnValue({
      signMessageAsync: jest.fn().mockResolvedValue("sig"),
    });
    const { result } = renderHook(() => useDropSignature());
    const drop = { parts: [], drop_type: 0 } as any;
    let res: any;
    await act(async () => {
      res = await result.current.signDrop({ drop, termsOfService: null });
    });
    expect(res).toEqual({ success: true, signature: "sig" });
  });

  it("shows drop-specific copy when signing fails", async () => {
    (useSignMessage as jest.Mock).mockReturnValue({
      signMessageAsync: jest.fn().mockRejectedValue(new Error("err")),
    });
    const { result } = renderHook(() => useDropSignature());
    const drop = { parts: [], drop_type: 0 } as any;
    let res: any;
    await act(async () => {
      res = await result.current.signDrop({ drop, termsOfService: null });
    });
    expect(res).toEqual({ success: false });
    expect(mockSetToast).toHaveBeenCalledWith({
      message: dropSignatureFailedMessage,
      type: "error",
    });
  });

  it("shows signature rejected when the user rejects signing", async () => {
    (useSignMessage as jest.Mock).mockReturnValue({
      signMessageAsync: jest
        .fn()
        .mockRejectedValue(new UserRejectedRequestError(new Error("rejected"))),
    });
    const { result } = renderHook(() => useDropSignature());
    const drop = { parts: [], drop_type: 0 } as any;
    let res: any;
    await act(async () => {
      res = await result.current.signDrop({ drop, termsOfService: null });
    });
    expect(res).toEqual({ success: false });
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "Signature request was canceled in your wallet.",
      type: "error",
    });
  });
});
