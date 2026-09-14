import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { useSignMessage, useSignTypedData } from "wagmi";
import { UserRejectedRequestError } from "viem";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { buildMemesSubmissionTypedData } from "@/services/wallet-signatures/memes-submission-signature";

jest.mock("wagmi", () => ({
  useSignMessage: jest.fn(),
  useSignTypedData: jest.fn(),
}));

jest.mock("@/services/wallet-signatures/structured-wallet-signatures", () => ({
  buildDropSignatureMessage: jest.fn(),
  isStructuredSignaturesEnabled: jest.fn(() => false),
  getWalletSignatureAudience: jest.fn(() => "api.6529.io"),
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

const memesDrop: ApiCreateDropRequest = {
  wave_id: "wave-1",
  drop_type: ApiDropType.Participatory,
  title: "A Meme Card",
  parts: [{ content: "An original test card", media: [] }],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [],
  signature: null,
  signer_address: "0x1111111111111111111111111111111111111111",
};
const memesWave = { id: "wave-1", name: "The Memes Main Stage" };
const mockSignTypedDataAsync = jest.fn();
const idleMutationState = {
  context: undefined,
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  isError: false,
  isIdle: true,
  isPaused: false,
  isPending: false,
  isSuccess: false,
  reset: jest.fn(),
  status: "idle",
  submittedAt: 0,
  variables: undefined,
} as const;

describe("useDropSignature", () => {
  beforeEach(() => {
    mockSetToast.mockClear();
    mockSignTypedDataAsync.mockReset();
    jest.mocked(useSignTypedData).mockReturnValue({
      ...idleMutationState,
      signTypedData: jest.fn(),
      signTypedDataAsync: mockSignTypedDataAsync,
    });
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

  it("shows signature rejected for legacy 4001 wallet rejection objects", async () => {
    (useSignMessage as jest.Mock).mockReturnValue({
      signMessageAsync: jest.fn().mockRejectedValue({
        code: 4001,
        message: "Not Allowed",
        stack:
          "Error: Not Allowed\n    at userRejectedRequest (RabbyMobile://native-bundle/background.js:1:1)",
      }),
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

  it("signs the Memes typed fields through the connected wallet and submits the same envelope", async () => {
    const signMessageAsync = jest.fn();
    jest.mocked(useSignMessage).mockReturnValue({
      ...idleMutationState,
      signMessage: jest.fn(),
      signMessageAsync,
    });
    mockSignTypedDataAsync.mockResolvedValue("0xtyped");
    const { result } = renderHook(() => useDropSignature());
    let signed: Awaited<ReturnType<typeof result.current.signDrop>> | undefined;
    await act(async () => {
      signed = await result.current.signDrop({
        drop: memesDrop,
        termsOfService: "Terms",
        memesWave,
      });
    });
    expect(signed?.success).toBe(true);
    expect(signed?.signature).toBe("0xtyped");
    const envelope: ReturnType<typeof buildMemesSubmissionTypedData> =
      JSON.parse(signed?.signatureMessage ?? "null");
    expect(envelope.primaryType).toBe("MemeCardSubmission");
    expect(envelope.message.Action).toBe("Submit a Meme Card to The Memes");
    expect(mockSignTypedDataAsync).toHaveBeenCalledWith({
      ...envelope,
      types: {
        MemeCardSubmission: envelope.types.MemeCardSubmission,
        SubmissionVerification: envelope.types.SubmissionVerification,
      },
    });
    expect(envelope.message.Verification.Wallet).toBe(memesDrop.signer_address);
    expect(signMessageAsync).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    {
      code: 4001,
      expectedMessage: "Signature request was canceled in your wallet.",
    },
    { code: 4200, expectedMessage: dropSignatureFailedMessage },
  ])(
    "does not retry text signing after typed signing fails with $code",
    async ({ code, expectedMessage }) => {
      const signMessageAsync = jest.fn();
      jest.mocked(useSignMessage).mockReturnValue({
        ...idleMutationState,
        signMessage: jest.fn(),
        signMessageAsync,
      });
      mockSignTypedDataAsync.mockRejectedValue({ code });
      const { result } = renderHook(() => useDropSignature());
      await act(async () => {
        expect(
          await result.current.signDrop({
            drop: memesDrop,
            termsOfService: "Terms",
            memesWave,
          })
        ).toEqual({ success: false });
      });
      expect(mockSignTypedDataAsync).toHaveBeenCalledTimes(1);
      expect(signMessageAsync).not.toHaveBeenCalled();
      expect(mockSetToast).toHaveBeenCalledWith({
        message: expectedMessage,
        type: "error",
      });
    }
  );

  it("does not open the wallet for mismatched Memes destination details", async () => {
    const { result } = renderHook(() => useDropSignature());
    await act(async () => {
      expect(
        await result.current.signDrop({
          drop: memesDrop,
          termsOfService: "Terms",
          memesWave: { ...memesWave, id: "other-wave" },
        })
      ).toEqual({ success: false });
    });
    expect(mockSignTypedDataAsync).not.toHaveBeenCalled();
  });
});
