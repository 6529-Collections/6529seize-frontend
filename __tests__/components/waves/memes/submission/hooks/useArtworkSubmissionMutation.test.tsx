import { AuthContext } from "@/components/auth/Auth";
import { useArtworkSubmissionMutation } from "@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { prepareProposalCard } from "@/components/waves/memes/submission/utils/prepareProposalCard";
import { createInitialState } from "@/components/waves/memes/submission/hooks/artworkSubmissionFormState";
import { ApiProposalFrameResponseMimeTypeEnum } from "@/generated/models/ApiProposalFrameResponse";

jest.mock(
  "@/components/waves/memes/submission/utils/prepareProposalCard",
  () => ({ prepareProposalCard: jest.fn() })
);

jest.mock("@/hooks/drops/useDropSignature");
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "test-jwt"),
  getWalletAddress: jest.fn(() => "0xabc"),
}));

const mockUseDropSignature = useDropSignature as jest.MockedFunction<
  typeof useDropSignature
>;
const mockCommonApiPost = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

const expectedAuthStateFingerprint = getAuthStateFingerprint({
  walletAddress: "0xabc",
  jwt: "test-jwt",
});

const submissionData = {
  externalMedia: {
    url: "ipfs://bafy-art",
    mimeType: "image/png",
  },
  traits: {
    title: "Artwork",
    description: "Description",
    artist: "Alice",
    seizeArtistProfile: "alice",
  } as TraitsData,
  isAdditionalActionPromised: false,
  waveId: "wave-1",
  waveName: "The Memes Main Stage",
  termsOfService: "Terms",
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const setupHook = () => {
  const requestAuth = jest.fn(async () => ({ success: true }));
  const setToast = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ requestAuth, setToast } as any}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useArtworkSubmissionMutation(), { wrapper });
  return { ...hook, requestAuth, setToast };
};

const submitOptions = {
  expectedAuthStateFingerprint,
  identityChangedMessage: "Wallet changed",
};

describe("useArtworkSubmissionMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("locks duplicate attempts and stays loading through signing and processing", async () => {
    const signature = createDeferred<{
      success: boolean;
      signature?: string;
    }>();
    const post = createDeferred<ApiDrop>();
    mockUseDropSignature.mockReturnValue({
      signDrop: jest.fn(() => signature.promise),
      isLoading: false,
    });
    mockCommonApiPost.mockReturnValue(post.promise);
    const { result, requestAuth } = setupHook();

    let firstSubmission!: Promise<ApiDrop | null>;
    let duplicateSubmission!: Promise<ApiDrop | null>;
    act(() => {
      firstSubmission = result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
      duplicateSubmission = result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
      expect(result.current.submissionPhase).toBe("signing");
    });
    await expect(duplicateSubmission).resolves.toBeNull();

    await act(async () => {
      signature.resolve({ success: true, signature: "0xsigned" });
    });
    await waitFor(() => {
      expect(result.current.submissionPhase).toBe("processing");
      expect(result.current.isSubmitting).toBe(true);
    });
    expect(requestAuth).toHaveBeenCalledWith({
      expectedAuthStateFingerprint,
    });

    await act(async () => {
      post.resolve({ id: "drop-1" } as ApiDrop);
      await firstSubmission;
    });
    expect(result.current.submissionPhase).toBe("success");
    expect(result.current.isSubmitting).toBe(false);
    expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
    expect(prepareProposalCard).not.toHaveBeenCalled();
  });

  it("unlocks retry and returns to idle when signing is canceled", async () => {
    const signDrop = jest.fn(async () => ({ success: false }));
    mockUseDropSignature.mockReturnValue({ signDrop, isLoading: false });
    const { result } = setupHook();

    await act(async () => {
      await result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
    });

    expect(result.current.submissionPhase).toBe("idle");
    expect(result.current.isSubmitting).toBe(false);

    await act(async () => {
      await result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(signDrop).toHaveBeenCalledTimes(2);
    expect(signDrop).toHaveBeenLastCalledWith({
      drop: expect.objectContaining({ title: "Artwork", wave_id: "wave-1" }),
      termsOfService: "Terms",
      memesWave: { id: "wave-1", name: "The Memes Main Stage" },
    });
    expect(mockCommonApiPost).not.toHaveBeenCalled();
  });

  it("signs and submits the published HTML, framed still, and original editing metadata", async () => {
    const signDrop = jest.fn(async () => ({
      success: true,
      signature: "0xsigned",
    }));
    mockUseDropSignature.mockReturnValue({ signDrop, isLoading: false });
    const operationalData = createInitialState({}).operationalData;
    operationalData.additional_media.preview_image =
      "https://example.com/framed.png";
    const metadata = {
      version: 1 as const,
      layout: "portrait" as const,
      media_url: submissionData.externalMedia.url,
      mime_type: "image/png",
      preview_image: "",
    };
    jest.mocked(prepareProposalCard).mockResolvedValue({
      media: {
        url: "ipfs://bafyframe/index.html",
        mime_type: ApiProposalFrameResponseMimeTypeEnum.TextHtml,
      },
      operationalData,
      metadata,
    });
    mockCommonApiPost.mockResolvedValue({ id: "drop-framed" });
    const { result } = setupHook();
    await act(async () => {
      await result.current.submitArtwork(
        { ...submissionData, operationalData, proposalFrame: "portrait" },
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(signDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        drop: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              media: [
                { url: "ipfs://bafyframe/index.html", mime_type: "text/html" },
              ],
            }),
          ]),
          metadata: expect.arrayContaining([
            {
              data_key: "proposal_frame",
              data_value: JSON.stringify(metadata),
            },
          ]),
        }),
      })
    );
    expect(mockCommonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "drops/",
        body: expect.objectContaining({ signature: "0xsigned" }),
      })
    );
  });

  it("does not request a signature or submit a drop if frame publication fails", async () => {
    const signDrop = jest.fn();
    mockUseDropSignature.mockReturnValue({ signDrop, isLoading: false });
    jest
      .mocked(prepareProposalCard)
      .mockRejectedValue(new Error("Frame publication failed"));
    const { result, setToast } = setupHook();
    await act(async () => {
      await result.current.submitArtwork(
        { ...submissionData, proposalFrame: "portrait" },
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(signDrop).not.toHaveBeenCalled();
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(result.current.submissionError).toBe("Frame publication failed");
    expect(setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Frame publication failed.",
    });
  });
});
