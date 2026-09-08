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
  });
});
