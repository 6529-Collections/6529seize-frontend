import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useArtworkSubmissionForm } from "@/components/waves/memes/submission/hooks/useArtworkSubmissionForm";
import type { MemesSubmissionInitialDraft } from "@/components/waves/memes/submission/utils/submissionDraft";
import type { CicStatement } from "@/entities/IProfile";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";

const CID_V1 = "bafybeigdyrztobg3tv6zj5n6xvztf4k5p3xf7r6xkqfq5jz3o5quftdjum";

jest.mock("@/components/waves/memes/traits/schema", () => ({
  getInitialTraitsValues: () => ({
    title: "",
    description: "",
    artist: "",
    seizeArtistProfile: "",
  }),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock(
  "@/components/waves/memes/submission/actions/validateInteractivePreview",
  () => ({
    validateInteractivePreview: jest.fn(),
  })
);
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const { useAuth } = require("@/components/auth/Auth");
const {
  validateInteractivePreview,
} = require("@/components/waves/memes/submission/actions/validateInteractivePreview");
const { commonApiFetch } = require("@/services/api/common-api");

const createBioStatement = (statementValue: string): CicStatement => ({
  id: "bio-statement",
  profile_id: "alice-profile",
  statement_group: STATEMENT_GROUP.GENERAL,
  statement_type: STATEMENT_TYPE.BIO,
  statement_comment: null,
  statement_value: statementValue,
  crated_at: new Date("2024-01-01T00:00:00.000Z"),
  updated_at: null,
});

const createDraftWithExistingMedia = (
  existingMedia: NonNullable<MemesSubmissionInitialDraft["existingMedia"]>
): MemesSubmissionInitialDraft =>
  ({
    traits: {
      title: "Draft title",
      description: "Draft description",
      artist: "draft-artist",
      seizeArtistProfile: "draft-profile",
    },
    operationalData: {
      airdrop_config: [],
      payment_info: {
        payment_address: "0xdraft",
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
    existingMedia,
  }) as MemesSubmissionInitialDraft;

const createQueryWrapper = (profileStatements?: CicStatement[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  if (profileStatements) {
    queryClient.setQueryData(
      [QueryKey.PROFILE_CIC_STATEMENTS, "alice"],
      profileStatements
    );
  }

  return function QueryWrapper({ children }: { readonly children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

const renderArtworkSubmissionForm = (
  initialDraft?: Parameters<typeof useArtworkSubmissionForm>[0],
  profileStatements?: CicStatement[]
) =>
  renderHook(() => useArtworkSubmissionForm(initialDraft), {
    wrapper: createQueryWrapper(profileStatements),
  });

describe("useArtworkSubmissionForm", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "alice", primary_wallet: "0xalice" },
    });
    (validateInteractivePreview as jest.Mock).mockResolvedValue({
      ok: true,
      contentType: "text/html",
    });
    (commonApiFetch as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes traits from profile and updates fields", () => {
    const { result } = renderArtworkSubmissionForm();
    expect(result.current.currentStep).toBe("agreement");
    expect(result.current.traits.artist).toBe("alice");
    expect(result.current.traits.seizeArtistProfile).toBe("alice");
    expect(result.current.isAdditionalActionPromised).toBe(false);
    expect(result.current.operationalData.payment_info.payment_address).toBe(
      "0xalice"
    );
    expect(result.current.operationalData.airdrop_config).toEqual([
      expect.objectContaining({ address: "0xalice" }),
    ]);
    act(() => {
      result.current.setTraits({ title: "t" });
    });
    expect(result.current.traits.title).toBe("t");
    act(() => {
      result.current.updateTraitField("description", "d");
    });
    expect(result.current.traits.description).toBe("d");
    act(() => {
      result.current.setAdditionalActionPromised(true);
    });
    expect(result.current.isAdditionalActionPromised).toBe(true);
  });

  it("initializes from a draft without profile defaults or bio fetch", () => {
    const operationalData = {
      airdrop_config: [{ id: "draft-airdrop", address: "0xdraft", count: 20 }],
      payment_info: {
        payment_address: "0xdraft",
        has_designated_payee: true,
        designated_payee_name: "Payee",
      },
      allowlist_batches: [],
      additional_media: {
        artist_profile_media: [],
        artwork_commentary_media: [],
        preview_image: "https://example.com/preview.png",
        promo_video: "",
      },
      commentary: "Draft commentary",
      about_artist: "Draft bio",
    };
    const initialDraft = {
      traits: {
        title: "Draft title",
        description: "Draft description",
        artist: "draft-artist",
        seizeArtistProfile: "draft-profile",
      },
      operationalData,
      existingMedia: {
        url: "https://example.com/art.png",
        mimeType: "image/png",
      },
      isAdditionalActionPromised: true,
    } as MemesSubmissionInitialDraft;

    const { result } = renderArtworkSubmissionForm(initialDraft);

    expect(result.current.artworkUploaded).toBe(true);
    expect(result.current.artworkUrl).toBe("https://example.com/art.png");
    expect(result.current.existingMedia).toEqual(initialDraft.existingMedia);
    expect(result.current.traits.artist).toBe("draft-artist");
    expect(result.current.traits.seizeArtistProfile).toBe("draft-profile");
    expect(result.current.operationalData).toBe(operationalData);
    expect(result.current.isAdditionalActionPromised).toBe(true);
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  it("clears existing resubmission media to allow first replacement selection", () => {
    const existingMedia = {
      url: "https://example.com/original.png",
      mimeType: "image/png",
    };
    const initialDraft = createDraftWithExistingMedia(existingMedia);

    const { result } = renderArtworkSubmissionForm(initialDraft);

    act(() => {
      result.current.setArtworkUploaded(false);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.existingMedia).toEqual(existingMedia);
    expect(result.current.artworkUrl).toBe("");
    expect(result.current.artworkUploaded).toBe(false);
  });

  it("restores existing resubmission media after clearing a replacement upload", () => {
    const existingMedia = {
      url: "https://example.com/original.png",
      mimeType: "image/png",
    };
    const initialDraft = createDraftWithExistingMedia(existingMedia);
    class MockFileReader {
      onloadend: (() => void) | null = null;
      result = "data-replacement";
      readAsDataURL() {
        this.onloadend?.();
      }
    }
    globalThis.FileReader = MockFileReader as any;

    const { result } = renderArtworkSubmissionForm(initialDraft);
    const replacementFile = new File(["replacement"], "replacement.png", {
      type: "image/png",
    });

    act(() => {
      result.current.handleFileSelect(replacementFile);
    });

    expect(result.current.selectedFile).toBe(replacementFile);
    expect(result.current.existingMedia).toEqual(existingMedia);
    expect(result.current.artworkUrl).toBe("data-replacement");

    act(() => {
      result.current.setArtworkUploaded(false);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.existingMedia).toEqual(existingMedia);
    expect(result.current.artworkUrl).toBe(existingMedia.url);
    expect(result.current.artworkUploaded).toBe(true);
  });

  it("clears stale preview media when replacing a video resubmission with a static image", () => {
    const existingMedia = {
      url: "https://example.com/original.mp4",
      mimeType: "video/mp4",
    };
    const draftWithExistingMedia = createDraftWithExistingMedia(existingMedia);
    const initialDraft = {
      ...draftWithExistingMedia,
      operationalData: {
        ...draftWithExistingMedia.operationalData,
        additional_media: {
          artist_profile_media: [],
          artwork_commentary_media: [],
          preview_image: "https://example.com/stale-preview.png",
          promo_video: "https://example.com/stale-promo.mp4",
        },
      },
    };
    class MockFileReader {
      onloadend: (() => void) | null = null;
      result = "data-replacement-image";
      readAsDataURL() {
        this.onloadend?.();
      }
    }
    globalThis.FileReader = MockFileReader as any;

    const { result } = renderArtworkSubmissionForm(initialDraft);

    act(() => {
      result.current.handleFileSelect(
        new File(["replacement"], "replacement.png", { type: "image/png" })
      );
    });

    expect(result.current.artworkUrl).toBe("data-replacement-image");
    expect(result.current.operationalData.additional_media.preview_image).toBe(
      ""
    );
    expect(result.current.operationalData.additional_media.promo_video).toBe(
      ""
    );
  });

  it("preserves existing resubmission media after a replacement read error", () => {
    const existingMedia = {
      url: "https://example.com/original.png",
      mimeType: "image/png",
    };
    const initialDraft = createDraftWithExistingMedia(existingMedia);
    class MockFileReader {
      onerror: (() => void) | null = null;
      onloadend: (() => void) | null = null;
      result = "stale-replacement";

      readAsDataURL() {
        this.onerror?.();
        this.onloadend?.();
      }
    }
    globalThis.FileReader = MockFileReader as any;

    const { result } = renderArtworkSubmissionForm(initialDraft);

    act(() => {
      result.current.handleFileSelect(
        new File(["replacement"], "replacement.png", { type: "image/png" })
      );
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.existingMedia).toEqual(existingMedia);
    expect(result.current.artworkUrl).toBe(existingMedia.url);
    expect(result.current.artworkUploaded).toBe(true);
    expect(result.current.mediaSource).toBe("upload");
    expect(result.current.uploadError).toBe(
      "Unable to read the selected file. Please try again."
    );
  });

  it("applies fetched bio when continuing to additional info", () => {
    const { result } = renderArtworkSubmissionForm(undefined, [
      createBioStatement("Alice bio"),
    ]);

    expect(result.current.operationalData.about_artist).toBe("");

    act(() => {
      result.current.handleContinueFromArtwork();
    });

    expect(result.current.currentStep).toBe("additional_info");
    expect(result.current.operationalData.about_artist).toBe("Alice bio");
  });

  it("does not overwrite a manually entered artist bio", () => {
    const { result } = renderArtworkSubmissionForm(undefined, [
      createBioStatement("Alice bio"),
    ]);

    act(() => {
      result.current.setAboutArtist("Manual bio");
    });
    act(() => {
      result.current.handleContinueFromArtwork();
    });

    expect(result.current.operationalData.about_artist).toBe("Manual bio");
  });

  it("handles continue and file select", () => {
    const { result } = renderArtworkSubmissionForm();
    act(() => {
      result.current.handleContinueFromTerms();
    });
    expect(result.current.currentStep).toBe("artwork");
    class MockFileReader {
      onloadend: any;
      readAsDataURL() {
        this.onloadend();
      }
      result = "url";
    }
    globalThis.FileReader = MockFileReader as any;
    act(() => {
      result.current.handleFileSelect(new File(["x"], "a.png"));
    });
    expect(result.current.artworkUploaded).toBe(true);
    expect(result.current.artworkUrl).toBe("url");
  });

  it("surfaces FileReader errors and clears stale upload state", () => {
    class MockFileReader {
      static shouldFail = false;
      onabort: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onloadend: (() => void) | null = null;
      result: string | null = null;

      readAsDataURL() {
        if (MockFileReader.shouldFail) {
          this.result = "stale-url";
          this.onerror?.();
          this.onloadend?.();
          return;
        }

        this.result = "fresh-url";
        this.onloadend?.();
      }
    }
    globalThis.FileReader = MockFileReader as any;

    const { result } = renderArtworkSubmissionForm();
    const firstFile = new File(["x"], "first.png", { type: "image/png" });

    act(() => {
      result.current.handleFileSelect(firstFile);
    });

    expect(result.current.selectedFile).toBe(firstFile);
    expect(result.current.artworkUploaded).toBe(true);
    expect(result.current.artworkUrl).toBe("fresh-url");
    expect(result.current.uploadError).toBeNull();

    MockFileReader.shouldFail = true;
    act(() => {
      result.current.handleFileSelect(
        new File(["x"], "second.png", { type: "image/png" })
      );
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.artworkUploaded).toBe(false);
    expect(result.current.artworkUrl).toBe("");
    expect(result.current.uploadError).toBe(
      "Unable to read the selected file. Please try again."
    );
  });

  it("surfaces FileReader aborts and ignores loadend after abort", () => {
    class MockFileReader {
      onabort: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onloadend: (() => void) | null = null;
      result = "stale-url";

      readAsDataURL() {
        this.onabort?.();
        this.onloadend?.();
      }
    }
    globalThis.FileReader = MockFileReader as any;

    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.handleFileSelect(
        new File(["x"], "aborted.png", { type: "image/png" })
      );
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.artworkUploaded).toBe(false);
    expect(result.current.artworkUrl).toBe("");
    expect(result.current.uploadError).toBe(
      "File reading was cancelled. Select the artwork again."
    );
  });

  it("clears external media errors when the hash is empty", () => {
    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash("bad cid");
    });
    act(() => {
      result.current.clearExternalMedia();
    });

    expect(result.current.externalMediaHashInput).toBe("");
    expect(result.current.isExternalMediaValid).toBe(false);
    expect(result.current.externalMediaError).toBeNull();
    expect(result.current.externalMediaPreviewUrl).toBe("");
    expect(result.current.externalMediaValidationStatus).toBe("idle");
    expect(validateInteractivePreview).not.toHaveBeenCalled();
  });

  it("rejects external previews that are not HTML files", () => {
    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash("bafyBad/binary.exe");
    });

    expect(result.current.isExternalMediaValid).toBe(false);
    expect(result.current.externalMediaError).toBe(
      "IPFS embeds must reference the root CID without subpaths."
    );
    expect(result.current.externalMediaPreviewUrl).toBe("");
    expect(result.current.externalMediaValidationStatus).toBe("invalid");
    expect(validateInteractivePreview).not.toHaveBeenCalled();
  });

  it("rejects external media hashes with query strings", () => {
    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash(`${CID_V1}?filename=index.html`);
    });

    expect(result.current.isExternalMediaValid).toBe(false);
    expect(result.current.externalMediaError).toBe(
      "Remove query strings or fragments from the hash."
    );
    expect(result.current.externalMediaPreviewUrl).toBe("");
    expect(result.current.externalMediaValidationStatus).toBe("invalid");
    expect(validateInteractivePreview).not.toHaveBeenCalled();
  });

  it("accepts external previews that resolve to HTML documents", async () => {
    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash(CID_V1);
    });

    await waitFor(() => {
      expect(result.current.isExternalMediaValid).toBe(true);
    });

    expect(validateInteractivePreview).toHaveBeenCalledWith({
      provider: "ipfs",
      path: CID_V1,
    });
    expect(result.current.externalMediaError).toBeNull();
    expect(result.current.externalMediaPreviewUrl).toBe(
      `https://media.6529.io/ipfs/${CID_V1}`
    );
    expect(result.current.externalMediaValidationStatus).toBe("valid");
  });

  it("normalizes parsed IPFS URLs with subpaths to the root CID", async () => {
    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash(`ipfs://${CID_V1}/index.html`);
    });

    await waitFor(() => {
      expect(result.current.isExternalMediaValid).toBe(true);
    });

    expect(validateInteractivePreview).toHaveBeenCalledWith({
      provider: "ipfs",
      path: CID_V1,
    });
    expect(result.current.externalMediaHashInput).toBe(
      `ipfs://${CID_V1}/index.html`
    );
    expect(result.current.externalMediaPreviewUrl).toBe(
      `https://media.6529.io/ipfs/${CID_V1}`
    );
  });

  it("surfaces gateway validation errors from server action", async () => {
    (validateInteractivePreview as jest.Mock).mockResolvedValue({
      ok: false,
      reason: "Gateway returned 404.",
    });

    const { result } = renderArtworkSubmissionForm();

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash(CID_V1);
    });

    await waitFor(() => {
      expect(result.current.externalMediaError).toBe("Gateway returned 404.");
    });

    expect(result.current.isExternalMediaValid).toBe(false);
    expect(result.current.externalMediaPreviewUrl).toBe("");
    expect(result.current.externalMediaValidationStatus).toBe("invalid");
  });

  it("restores uploaded artwork URL when switching back from external media", async () => {
    const { result } = renderArtworkSubmissionForm();
    class MockFileReader {
      onloadend: (() => void) | null = null;
      result = "data-upload";
      readAsDataURL() {
        this.onloadend?.();
      }
    }
    globalThis.FileReader = MockFileReader as any;

    act(() => {
      result.current.handleFileSelect(new File(["x"], "a.png"));
    });

    expect(result.current.mediaSource).toBe("upload");
    expect(result.current.artworkUrl).toBe("data-upload");

    act(() => {
      result.current.setMediaSource("url");
    });
    act(() => {
      result.current.setExternalMediaHash(CID_V1);
    });

    await waitFor(() => {
      expect(result.current.isExternalMediaValid).toBe(true);
    });
    expect(result.current.artworkUrl).toContain("ipfs://");

    act(() => {
      result.current.setMediaSource("upload");
    });

    expect(result.current.artworkUrl).toBe("data-upload");
    expect(result.current.artworkUploaded).toBe(true);
  });
});
