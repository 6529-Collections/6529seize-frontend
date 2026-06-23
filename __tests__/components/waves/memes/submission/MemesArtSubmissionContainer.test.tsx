import { render, act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import MemesArtSubmissionContainer from "@/components/waves/memes/submission/MemesArtSubmissionContainer";
import { SubmissionStep } from "@/components/waves/memes/submission/types/Steps";
import { useArtworkSubmissionForm } from "@/components/waves/memes/submission/hooks/useArtworkSubmissionForm";
import { useArtworkSubmissionMutation } from "@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useAuth } from "@/components/auth/Auth";
import { commonApiDelete } from "@/services/api/common-api";
import type { InteractiveMediaMimeType } from "@/components/waves/memes/submission/constants/media";

jest.mock("@/components/auth/Auth");
jest.mock("@/components/waves/memes/submission/hooks/useArtworkSubmissionForm");
jest.mock(
  "@/components/waves/memes/submission/hooks/useArtworkSubmissionMutation"
);
jest.mock("@/components/auth/SeizeConnectContext");
jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({ processDropRemoved: jest.fn() }),
}));
jest.mock(
  "@/components/waves/memes/submission/layout/ModalLayout",
  () =>
    ({ children }: any) => <div>{children}</div>
);
jest.mock(
  "@/components/waves/memes/submission/steps/AgreementStep",
  () => (props: any) => <div data-testid="agreement" {...props} />
);
let artworkProps: any;
jest.mock(
  "@/components/waves/memes/submission/steps/ArtworkStep",
  () => (props: any) => {
    artworkProps = props;
    return <div data-testid="artwork" />;
  }
);
let additionalInfoProps: any;
jest.mock(
  "@/components/waves/memes/submission/steps/AdditionalInfoStep",
  () => (props: any) => {
    additionalInfoProps = props;
    return (
      <button data-testid="additional-submit" onClick={props.onSubmit}>
        submit
      </button>
    );
  }
);
let deleteConfirmationProps: any;
jest.mock(
  "@/components/waves/memes/submission/ResubmitDeleteConfirmation",
  () => ({
    ResubmitDeleteConfirmation: (props: any) => {
      deleteConfirmationProps = props;
      return (
        <button data-testid="delete-original" onClick={props.onDeleteOriginal}>
          delete original
        </button>
      );
    },
  })
);

const mockForm = useArtworkSubmissionForm as jest.MockedFunction<
  typeof useArtworkSubmissionForm
>;
const mockMutation = useArtworkSubmissionMutation as jest.MockedFunction<
  typeof useArtworkSubmissionMutation
>;
const mockSeizeConnect = useSeizeConnectContext as jest.MockedFunction<
  typeof useSeizeConnectContext
>;
const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCommonApiDelete = commonApiDelete as jest.MockedFunction<
  typeof commonApiDelete
>;

describe("MemesArtSubmissionContainer", () => {
  const wave = { id: "w1", participation: { terms: "t" } } as any;
  const onClose = jest.fn();
  let formState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    artworkProps = undefined;
    additionalInfoProps = undefined;
    deleteConfirmationProps = undefined;
    formState = {
      currentStep: SubmissionStep.ARTWORK,
      agreements: false,
      setAgreements: jest.fn(),
      handleContinueFromTerms: jest.fn(),
      handleContinueFromArtwork: jest.fn(async () => true),
      traits: { title: "t", description: "d" },
      setTraits: jest.fn(),
      updateTraitField: jest.fn(),
      isAdditionalActionPromised: false,
      setAdditionalActionPromised: jest.fn((value: boolean) => {
        formState.isAdditionalActionPromised = value;
      }),
      artworkUploaded: false,
      artworkUrl: "",
      selectedFile: null,
      existingMedia: null,
      mediaSource: "upload",
      externalMediaUrl: "",
      externalMediaPreviewUrl: "",
      externalMediaHashInput: "",
      externalMediaProvider: "ipfs",
      externalMediaMimeType: "text/html",
      externalMediaError: null,
      externalMediaValidationStatus: "idle",
      isExternalMediaValid: false,
      operationalData: {
        airdrop_config: [{ id: "test-initial", address: "", count: 20 }],
        payment_info: {
          payment_address: "",
          has_designated_payee: false,
          designated_payee_name: "",
        },
        allowlist_batches: [],
        additional_media: {
          artist_profile_media: [],
          artwork_commentary_media: [],
          preview_image: "",
          promo_video: "",
        },
        commentary: "",
        about_artist: "",
      },
      setAirdropConfig: jest.fn(),
      setPaymentInfo: jest.fn(),
      setAllowlistBatches: jest.fn(),
      setAdditionalMedia: jest.fn(),
      setCommentary: jest.fn(),
      setAboutArtist: jest.fn(),
      handleBackToArtwork: jest.fn(),
    };

    formState.setArtworkUploaded = jest.fn((value: boolean) => {
      formState.artworkUploaded = value;
      if (!value) {
        formState.selectedFile = null;
      }
    });

    formState.handleFileSelect = jest.fn((file: File) => {
      formState.selectedFile = file;
      formState.artworkUploaded = true;
      formState.artworkUrl = "object-url";
    });

    formState.setMediaSource = jest.fn((mode: "upload" | "url") => {
      formState.mediaSource = mode;
    });

    formState.setExternalMediaHash = jest.fn((hash: string) => {
      formState.externalMediaHashInput = hash;
      if (hash) {
        formState.externalMediaUrl = `${formState.externalMediaProvider === "arweave" ? "ar://" : "ipfs://"}${hash}`;
        formState.externalMediaPreviewUrl =
          formState.externalMediaProvider === "arweave"
            ? `https://media.6529.io/arweave/${hash}`
            : `https://media.6529.io/ipfs/${hash}`;
        formState.isExternalMediaValid = true;
        formState.externalMediaValidationStatus = "valid";
        formState.externalMediaError = null;
      } else {
        formState.externalMediaUrl = "";
        formState.externalMediaPreviewUrl = "";
        formState.isExternalMediaValid = false;
        formState.externalMediaValidationStatus = "idle";
        formState.externalMediaError = null;
      }
    });

    formState.setExternalMediaProvider = jest.fn(
      (provider: "ipfs" | "arweave") => {
        formState.externalMediaProvider = provider;
        formState.setExternalMediaHash(formState.externalMediaHashInput);
      }
    );

    formState.setExternalMediaMimeType = jest.fn(
      (mimeType: InteractiveMediaMimeType) => {
        formState.externalMediaMimeType = mimeType;
      }
    );

    formState.clearExternalMedia = jest.fn(() => {
      formState.externalMediaHashInput = "";
      formState.externalMediaUrl = "";
      formState.externalMediaPreviewUrl = "";
      formState.isExternalMediaValid = false;
      formState.externalMediaValidationStatus = "idle";
      formState.externalMediaError = null;
    });

    formState.getSubmissionData = () => ({
      imageUrl: formState.artworkUrl,
      traits: { title: "t", description: "d" },
      operationalData: formState.operationalData,
      isAdditionalActionPromised: formState.isAdditionalActionPromised,
    });
    formState.getMediaSelection = jest.fn(() => ({
      mediaSource: formState.mediaSource,
      selectedFile: formState.selectedFile,
      existingMedia: formState.existingMedia,
      externalUrl: formState.externalMediaUrl,
      externalPreviewUrl: formState.externalMediaPreviewUrl,
      externalProvider: formState.externalMediaProvider,
      externalHash: formState.externalMediaHashInput,
      externalMimeType: formState.externalMediaMimeType,
      isExternalValid: formState.isExternalMediaValid,
    }));

    mockForm.mockReturnValue(formState);
    mockAuth.mockReturnValue({
      connectedProfile: null,
      requestAuth: jest.fn(async () => ({ success: true })),
      setToast: jest.fn(),
    } as any);
    mockCommonApiDelete.mockResolvedValue(undefined as any);
    mockMutation.mockReturnValue({
      submitArtwork: jest.fn(async () => "ok"),
      uploadProgress: 0,
      submissionPhase: "idle",
      submissionError: undefined,
      isSubmitting: false,
    } as any);
    mockSeizeConnect.mockReturnValue({
      address: "0x123",
      isSafeWallet: false,
      walletName: "MetaMask",
      walletIcon: "metamask-icon.svg",
      seizeConnect: jest.fn(),
      seizeDisconnect: jest.fn(),
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection: jest.fn(),
      seizeConnectOpen: false,
      isConnected: true,
      isAuthenticated: true,
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("auto closes on success", () => {
    jest.useFakeTimers();
    mockMutation.mockReturnValueOnce({
      submitArtwork: jest.fn(),
      uploadProgress: 0,
      submissionPhase: "success",
      submissionError: undefined,
      isSubmitting: false,
    } as any);
    render(<MemesArtSubmissionContainer onClose={onClose} wave={wave} />);
    jest.runAllTimers();
    expect(onClose).toHaveBeenCalled();
  });

  it("submits artwork when file selected", async () => {
    const submitArtwork = jest.fn(async () => "result");
    mockMutation.mockReturnValue({
      submitArtwork,
      uploadProgress: 0,
      submissionPhase: "idle",
      submissionError: undefined,
      isSubmitting: false,
    } as any);
    render(<MemesArtSubmissionContainer onClose={onClose} wave={wave} />);
    const file = new File(["a"], "a.png", { type: "image/png" });
    await act(async () => {
      artworkProps.handleFileSelect(file);
    });
    const res = await artworkProps.onSubmit();
    expect(res).toBeTruthy();
  });

  it("passes the additional action promise flag to submission", async () => {
    const user = userEvent.setup();
    const submitArtwork = jest.fn(async () => "result");
    formState.currentStep = SubmissionStep.ADDITIONAL_INFO;
    formState.isAdditionalActionPromised = true;
    formState.existingMedia = {
      url: "https://example.com/art.png",
      mimeType: "image/png",
    };
    formState.artworkUploaded = true;
    formState.artworkUrl = formState.existingMedia.url;
    mockMutation.mockReturnValue({
      submitArtwork,
      uploadProgress: 0,
      submissionPhase: "idle",
      submissionError: undefined,
      isSubmitting: false,
    } as any);

    render(<MemesArtSubmissionContainer onClose={onClose} wave={wave} />);

    await user.click(screen.getByTestId("additional-submit"));

    expect(submitArtwork).toHaveBeenCalledWith(
      expect.objectContaining({
        isAdditionalActionPromised: true,
      }),
      "0x123",
      false,
      expect.any(Object)
    );
  });

  it("shows resubmission acknowledgement before the prefilled form", () => {
    render(
      <MemesArtSubmissionContainer
        onClose={onClose}
        wave={wave}
        sourceDrop={
          {
            id: "source-1",
            title: "Source",
            metadata: [],
            parts: [{ content: "", media: [] }],
          } as any
        }
      />
    );

    expect(
      screen.getByRole("heading", { name: /this creates a new submission/i })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("artwork")).not.toBeInTheDocument();
  });

  it("closes resubmission acknowledgement when canceled", async () => {
    const user = userEvent.setup();

    render(
      <MemesArtSubmissionContainer
        onClose={onClose}
        wave={wave}
        sourceDrop={
          {
            id: "source-1",
            title: "Source",
            metadata: [],
            parts: [{ content: "", media: [] }],
          } as any
        }
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the prefilled form after accepting resubmission acknowledgement", async () => {
    const user = userEvent.setup();

    render(
      <MemesArtSubmissionContainer
        onClose={onClose}
        wave={wave}
        sourceDrop={
          {
            id: "source-1",
            title: "Source",
            metadata: [],
            parts: [{ content: "", media: [] }],
          } as any
        }
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: /i understand, start resubmission/i,
      })
    );

    expect(screen.getByTestId("artwork")).toBeInTheDocument();
  });

  it("treats existing GLTF resubmissions as interactive media", async () => {
    const user = userEvent.setup();
    formState.currentStep = SubmissionStep.ADDITIONAL_INFO;
    formState.existingMedia = {
      url: "https://example.com/model.gltf",
      mimeType: "model/gltf+json",
    };
    formState.artworkUploaded = true;
    formState.artworkUrl = formState.existingMedia.url;

    render(
      <MemesArtSubmissionContainer
        onClose={onClose}
        wave={wave}
        sourceDrop={
          {
            id: "source-1",
            title: "Source",
            metadata: [],
            parts: [{ content: "", media: [] }],
          } as any
        }
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: /i understand, start resubmission/i,
      })
    );

    expect(additionalInfoProps.requiresPreviewImage).toBe(true);
    expect(additionalInfoProps.requiresPromoVideoOption).toBe(true);
    expect(additionalInfoProps.previewRequiredMediaType).toBe("GLTF");
  });

  it("closes the source drop after deleting the original resubmission", async () => {
    const user = userEvent.setup();
    const onSourceDropDeleted = jest.fn();
    const submitArtwork = jest.fn(async () => ({
      id: "replacement-1",
      title: "Replacement",
      metadata: [],
    }));
    formState.currentStep = SubmissionStep.ADDITIONAL_INFO;
    formState.existingMedia = {
      url: "https://example.com/art.png",
      mimeType: "image/png",
    };
    formState.artworkUploaded = true;
    formState.artworkUrl = formState.existingMedia.url;
    mockMutation.mockReturnValue({
      submitArtwork,
      uploadProgress: 0,
      submissionPhase: "idle",
      submissionError: undefined,
      isSubmitting: false,
    } as any);

    render(
      <MemesArtSubmissionContainer
        onClose={onClose}
        wave={wave}
        sourceDrop={
          {
            id: "source-1",
            title: "Original",
            wave: { id: "w1" },
            metadata: [],
            parts: [
              {
                content: "",
                media: [
                  {
                    url: "https://example.com/art.png",
                    mime_type: "image/png",
                  },
                ],
              },
            ],
          } as any
        }
        onSourceDropDeleted={onSourceDropDeleted}
      />
    );

    await user.click(
      screen.getByRole("button", {
        name: /i understand, start resubmission/i,
      })
    );

    await user.click(screen.getByTestId("additional-submit"));
    await screen.findByTestId("delete-original");

    expect(deleteConfirmationProps.replacementDrop.id).toBe("replacement-1");

    await user.click(screen.getByTestId("delete-original"));

    await waitFor(() => {
      expect(mockCommonApiDelete).toHaveBeenCalledWith({
        endpoint: "drops/source-1",
      });
    });
    expect(onClose).toHaveBeenCalled();
    expect(onSourceDropDeleted).toHaveBeenCalledTimes(1);
  });
});
