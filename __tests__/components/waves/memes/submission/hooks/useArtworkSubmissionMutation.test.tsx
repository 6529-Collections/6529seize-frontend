import { AuthContext } from "@/components/auth/Auth";
import {
  useArtworkSubmissionMutation,
  type SubmittedArtwork,
} from "@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import { commonApiPost } from "@/services/api/common-api";
import { getAuthStateFingerprint } from "@/services/auth/auth-token-fingerprint";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  render,
  renderHook,
  waitFor,
  within,
} from "@testing-library/react";
import { AppToastContent } from "@/components/utils/toast/AppToast";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { isChainIdentityActive } from "@/lib/chain-identity/active";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { identityOfWallet } from "@/lib/chain-waves/signing";
import type { ReactNode } from "react";
import { prepareProposalCard } from "@/components/waves/memes/submission/utils/prepareProposalCard";
import { createInitialState } from "@/components/waves/memes/submission/hooks/artworkSubmissionFormState";
import { ApiProposalFrameResponseMimeTypeEnum } from "@/generated/models/ApiProposalFrameResponse";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";

jest.mock(
  "@/components/waves/memes/submission/utils/prepareProposalCard",
  () => ({ prepareProposalCard: jest.fn() })
);
jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(),
}));

jest.mock("@/lib/chain-identity/active", () => ({
  ...jest.requireActual("@/lib/chain-identity/active"),
  isChainIdentityActive: jest.fn(() => false),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));
const mockChainEntrySubmit = jest.fn();
let mockChainEntriesActive = false;
jest.mock("@/components/chain-waves/useChainEntryWriters", () => ({
  useChainEntrySubmit: () =>
    mockChainEntriesActive ? mockChainEntrySubmit : null,
  invalidateChainEntryQueries: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "test-jwt"),
  getWalletAddress: jest.fn(() => "0xabc"),
}));

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

const defaultCompetition = {
  id: "original-primary",
  wave_id: "wave-1",
  config_version: 3,
} as ApiCompetition;
const setupHook = (competition: ApiCompetition | null = defaultCompetition) => {
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
  const hook = renderHook(() => useArtworkSubmissionMutation(competition), {
    wrapper,
  });
  return { ...hook, requestAuth, setToast };
};

const submitOptions = {
  expectedAuthStateFingerprint,
  identityChangedMessage: "Wallet changed",
};

describe("useArtworkSubmissionMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNativeEntry.mockReset().mockResolvedValue({ id: "native-artwork" });
  });

  it("locks duplicate attempts and stays loading through the native signed command", async () => {
    const post = createDeferred<ApiDrop>();
    mockNativeEntry.mockReturnValue(post.promise);
    const { result, requestAuth } = setupHook();

    let firstSubmission!: Promise<SubmittedArtwork | null>;
    let duplicateSubmission!: Promise<SubmittedArtwork | null>;
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
      expect(result.current.submissionPhase).toBe("processing");
    });
    await expect(duplicateSubmission).resolves.toBeNull();

    expect(requestAuth).toHaveBeenCalledWith({
      expectedAuthStateFingerprint,
    });

    await act(async () => {
      post.resolve({ id: "drop-1" } as ApiDrop);
      await firstSubmission;
    });
    expect(result.current.submissionPhase).toBe("success");
    expect(result.current.isSubmitting).toBe(false);
    expect(mockNativeEntry).toHaveBeenCalledTimes(1);
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(prepareProposalCard).not.toHaveBeenCalled();
  });

  it("passes initial collaborators to the native signed submission command", async () => {
    const { result } = setupHook();
    await act(async () => {
      await result.current.submitArtwork(
        {
          ...submissionData,
          collaborators: [
            { id: "B", handle: "artistB", display: "artistB", pfp: null },
          ],
        },
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(mockNativeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ collaborator_ids: ["B"] })
    );
    expect(mockCommonApiPost).not.toHaveBeenCalled();
  });

  it("unlocks retry and returns to idle when signing is canceled", async () => {
    mockNativeEntry.mockRejectedValue(
      Object.assign(new Error("Canceled"), { code: 4001 })
    );
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
    expect(mockNativeEntry).toHaveBeenCalledTimes(2);
    expect(mockCommonApiPost).not.toHaveBeenCalled();
  });

  it("signs and submits the published HTML, framed still, and original editing metadata", async () => {
    mockNativeEntry.mockResolvedValue({ id: "drop-framed" });
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
    const { result } = setupHook();
    await act(async () => {
      await result.current.submitArtwork(
        { ...submissionData, operationalData, proposalFrame: "portrait" },
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(mockNativeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    );
    expect(mockCommonApiPost).not.toHaveBeenCalled();
  });

  it("does not request a signature or submit a drop if frame publication fails", async () => {
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
    expect(mockNativeEntry).not.toHaveBeenCalled();
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(result.current.submissionError).toBe("Frame publication failed");
    expect(setToast).toHaveBeenCalledWith({
      type: "error",
      message: "Frame publication failed.",
    });
  });

  it("uploads the artwork file as a decision entry, keeping the original", async () => {
    const uploaded = {
      url: "https://cdn.example/artwork.png",
      mime_type: "image/png",
    };
    jest.mocked(multiPartUpload).mockResolvedValue(uploaded);
    const imageFile = new File(["art"], "artwork.png", { type: "image/png" });
    const { result } = setupHook();
    await act(async () => {
      await result.current.submitArtwork(
        { ...submissionData, externalMedia: undefined, imageFile },
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        file: imageFile,
        path: "drop",
        purpose: ApiMediaUploadPurpose.DecisionEntry,
      })
    );
    expect(mockNativeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parts: expect.arrayContaining([
          expect.objectContaining({ media: [uploaded] }),
        ]),
      })
    );
  });
});

const mockNativeEntry = jest.fn();
jest.mock("@/hooks/competitions/useCompetitionEntrySubmit", () => ({
  useCompetitionEntrySubmit: (competition: ApiCompetition | null) =>
    competition
      ? mockNativeEntry
      : () => {
          throw new Error("Competition entry scope is required");
        },
}));

it("rejects an explicit missing scope without posting a legacy drop", async () => {
  mockNativeEntry.mockClear();
  const { result } = setupHook(null);
  await act(async () => {
    await result.current.submitArtwork(
      submissionData,
      "0xabc",
      false,
      submitOptions
    );
  });
  expect(mockNativeEntry).not.toHaveBeenCalled();
  expect(mockCommonApiPost).not.toHaveBeenCalled();
  expect(result.current.submissionError).toBe(
    "Competition entry scope is required"
  );
});

describe("useArtworkSubmissionMutation on the 6529 Network", () => {
  const receipt = { entryId: "0xentry", txId: "0xtx" };

  beforeEach(() => {
    mockChainEntriesActive = true;
    mockChainEntrySubmit.mockReset().mockResolvedValue(receipt);
    mockNativeEntry.mockClear();
  });

  afterEach(() => {
    mockChainEntriesActive = false;
  });

  it("sends the artwork there with no 6529.io sign-in or drop", async () => {
    const { result, requestAuth, setToast } = setupHook();
    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
    });

    expect(mockChainEntrySubmit).toHaveBeenCalledWith({
      request: expect.objectContaining({
        wave_id: "wave-1",
        title: "Artwork",
        signer_address: "0xabc",
      }),
      terms: null,
      onStage: expect.any(Function),
    });
    expect(submitted).toEqual({
      chainEntry: receipt,
      title: "Artwork",
      metadata: expect.arrayContaining([
        { data_key: "title", data_value: "Artwork" },
      ]),
      pending: false,
    });
    expect(requestAuth).not.toHaveBeenCalled();
    expect(mockNativeEntry).not.toHaveBeenCalled();
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(result.current.submissionPhase).toBe("success");
    expect(setToast).toHaveBeenCalledWith({
      message:
        "Artwork sent to the 6529 Network. It shows here once 6529.io lists it.",
      type: "success",
    });
  });

  it("counts an artwork that isn't final yet as sent and offers no retry", async () => {
    const { ChainEntryPendingError } = jest.requireActual(
      "@/lib/chain-waves/entryWriters"
    );
    mockChainEntrySubmit.mockRejectedValue(
      new ChainEntryPendingError("not final yet", receipt)
    );
    const { result, setToast } = setupHook();
    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(submitted).toMatchObject({ chainEntry: receipt, pending: true });
    expect(result.current.submissionPhase).toBe("success");
    expect(setToast).toHaveBeenCalledWith({
      message:
        "Your artwork was sent to the 6529 Network but isn't final yet. It may still land, so check in a few minutes before you send it again.",
      type: "warning",
    });
    expect(setToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
  });

  it("returns to idle when the wallet declines", async () => {
    mockChainEntrySubmit.mockRejectedValue(
      Object.assign(new Error("Canceled"), { code: 4001 })
    );
    const { result, setToast } = setupHook();
    await act(async () => {
      await result.current.submitArtwork(
        submissionData,
        "0xabc",
        false,
        submitOptions
      );
    });
    expect(result.current.submissionPhase).toBe("idle");
    expect(mockNativeEntry).not.toHaveBeenCalled();
    expect(setToast).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a refusal before anything was sent",
      new ChainOperationError(
        "rejected",
        "This wallet has no identity on the 6529 Network yet."
      ),
      "This wallet has no identity on the 6529 Network yet.",
    ],
    [
      "a block's refusal",
      new ChainOperationError(
        "failed",
        "The 6529 Network refused this change: ENTRY_LIMIT.",
        "ENTRY_LIMIT"
      ),
      "The change didn't go through, and its fee was still charged. You already have as many entries in this decision as it allows.",
    ],
  ])(
    "shows the network's reason for %s, not 6529.io's connection error",
    async (_case, error, reason) => {
      mockChainEntrySubmit.mockRejectedValue(error);
      const { result, setToast } = setupHook();
      await act(async () => {
        await result.current.submitArtwork(
          submissionData,
          "0xabc",
          false,
          submitOptions
        );
      });
      // The form's error line.
      expect(result.current.submissionPhase).toBe("error");
      expect(result.current.submissionError).toBe(reason);
      // The toast, as 6529.io shows it through its own toast helpers.
      expect(setToast).toHaveBeenCalledTimes(1);
      expect(setToast.mock.calls[0][0].details).toBeUndefined();
      const toast = render(
        <AppToastContent toast={setToast.mock.calls[0][0]} />
      ).container;
      expect(toast).toHaveTextContent("Couldn't submit this artwork.");
      expect(toast).toHaveTextContent(reason);
      expect(toast).not.toHaveTextContent(
        /Network error|Wallet error|Please try again/
      );
    }
  );

  it("points a wallet with no identity to the identity page once it takes changes", async () => {
    jest.mocked(isChainIdentityActive).mockReturnValue(true);
    const lookup = jest
      .spyOn(chainGateway, "getIdentityByWallet")
      .mockResolvedValue(null);
    mockChainEntrySubmit.mockImplementation(() =>
      identityOfWallet(`0x${"12".repeat(20)}`)
    );
    try {
      const { result, setToast } = setupHook();
      await act(async () => {
        await result.current.submitArtwork(
          submissionData,
          "0xabc",
          false,
          submitOptions
        );
      });
      expect(result.current.submissionError).toBe(
        "This wallet has no identity on the 6529 Network yet."
      );
      const toast = render(
        <AppToastContent toast={setToast.mock.calls[0][0]} />
      ).container;
      expect(toast).toHaveTextContent(
        "This wallet has no identity on the 6529 Network yet. Set one up on your identity page."
      );
      expect(
        within(toast).getByRole("link", { name: "your identity page" })
      ).toHaveAttribute("href", "/network/identity");
    } finally {
      jest.mocked(isChainIdentityActive).mockReturnValue(false);
      lookup.mockRestore();
    }
  });
});
