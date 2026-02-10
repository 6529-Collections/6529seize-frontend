import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { useSignMessage } from "wagmi";

jest.mock("wagmi", () => ({ useSignMessage: jest.fn() }));

const mockHash = "hash";
jest.mock("@/utils/drop-hasher", () => ({
  DropHasher: class { hash() { return mockHash; } },
}));

const mockSetToast = jest.fn();

describe("useDropSignature", () => {
  beforeEach(() => {
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

  it("handles rejection", async () => {
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
    expect(mockSetToast).toHaveBeenCalled();
  });
});
