import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import DocumentationUpload from "@/components/artwork-documentation/DocumentationUpload";
import DocumentationAssetDetails from "@/components/artwork-documentation/DocumentationAssetDetails";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { canPublishDocumentationAsset } from "@/lib/artwork-documentation/asset-roles";
import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import type { ApiArtworkDocumentationAssetLink } from "@/generated/models/ApiArtworkDocumentationAssetLink";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import { ApiArtworkDocumentationAssetTermsKindEnum } from "@/generated/models/ApiArtworkDocumentationAssetTerms";
import {
  cancelDocumentationUpload,
  getDocumentationUpload,
  linkDocumentationAsset,
  patchDocumentationAssetLink,
  startDocumentationUpload,
} from "@/services/api/artwork-documentation-assets-api";
import { transferDocumentationFile } from "@/lib/artwork-documentation/upload";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/artwork-documentation-assets-api");
jest.mock("@/lib/artwork-documentation/upload", () => ({
  DocumentationFileChangedError: class extends Error {},
  transferDocumentationFile: jest.fn(),
}));
jest.mock("@/lib/artwork-documentation/poll-processing", () => ({
  pollDocumentationProcessing: jest.fn(() => jest.fn()),
}));

const controllers: DocumentationDraftController[] = [];
function uploadSession(
  overrides: Partial<ApiArtworkDocumentationAsset> = {}
): ApiArtworkDocumentationUploadSession {
  return {
    asset: {
      id: "asset-1",
      filename: "final.png",
      size_bytes: 5,
      role: "artwork_final",
      intended_visibility: "public_record",
      state: "uploading",
      ...overrides,
    },
    upload_id: "asset-1",
    expires_at: Date.now() + 60_000,
    received_parts: [],
    policy: {},
  };
}
function assetLink(
  asset: ApiArtworkDocumentationAsset,
  overrides: Partial<ApiArtworkDocumentationAssetLink> = {}
): ApiArtworkDocumentationAssetLink {
  return {
    id: "link-1",
    asset_id: asset.id,
    role: asset.role,
    label: "Original label",
    description: "",
    intended_visibility: asset.intended_visibility,
    source_of_asset: "unknown",
    source_credit: "",
    derived_from_asset_ids: [],
    deposit_note: "",
    intended_terms: {
      kind: ApiArtworkDocumentationAssetTermsKindEnum.Unspecified,
    },
    manifest: asset,
    ...overrides,
  };
}
function selectFile() {
  fireEvent.change(screen.getByLabelText("Select file"), {
    target: {
      files: [new File(["image"], "final.png", { type: "image/png" })],
    },
  });
}
function setup(publicationOnly = true) {
  const context = documentationFixture();
  if (publicationOnly)
    Object.assign(context.profile, {
      intake_mode: "publication_only",
      version: 2,
    });
  const controller = new DocumentationDraftController(
    context,
    {
      save: jest.fn(async () => context),
      read: jest.fn(async () => context),
    },
    jest.fn()
  );
  controllers.push(controller);
  jest.mocked(linkDocumentationAsset).mockResolvedValue(context);
  return { context, controller };
}
afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  jest.clearAllMocks();
});
beforeEach(() => {
  jest.mocked(startDocumentationUpload).mockReset();
  jest.mocked(getDocumentationUpload).mockReset();
  jest.mocked(cancelDocumentationUpload).mockReset();
  jest.mocked(transferDocumentationFile).mockReset();
});

describe("publication-only artwork uploads", () => {
  it("shows the final artwork first and omits private upload roles and visibility controls", () => {
    render(<DocumentationUpload {...setup()} />);
    expect(
      screen.getByRole("heading", {
        name: "Add the final artwork or public supporting material",
      })
    ).toBeInTheDocument();
    const roles = screen.getByRole("combobox", {
      name: "What is this file for?",
    });
    expect(roles).toHaveValue("artwork_final");
    expect(
      Array.from((roles as HTMLSelectElement).options, (option) => option.value)
    ).toEqual([
      "artwork_final",
      "preservation_master",
      "process_evidence",
      "display_derivative",
      "interview_recording",
      "interview_transcript",
      "other_supporting",
    ]);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });
  it("preserves legacy upload visibility and private-source role choices", () => {
    render(<DocumentationUpload {...setup(false)} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(
      screen.getByRole("option", { name: "Camera original / RAW" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Consent document" })
    ).toBeInTheDocument();
  });
  it("starts the exact final file with public-record intention without granting a license", async () => {
    const { context, controller } = setup();
    const asset = {
      id: "asset-1",
      filename: "final.png",
      size_bytes: 5,
      role: "artwork_final",
      intended_visibility: "public_record",
      state: "uploading",
    };
    jest.mocked(startDocumentationUpload).mockResolvedValue({
      asset,
      upload_id: asset.id,
      expires_at: Date.now() + 60_000,
      received_parts: [],
      policy: {},
    } as Awaited<ReturnType<typeof startDocumentationUpload>>);
    jest.mocked(transferDocumentationFile).mockResolvedValue({ asset });
    render(<DocumentationUpload context={context} controller={controller} />);
    fireEvent.change(screen.getByLabelText("Select file"), {
      target: {
        files: [new File(["image"], "final.png", { type: "image/png" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
    await waitFor(() =>
      expect(startDocumentationUpload).toHaveBeenCalledWith(
        context.id,
        {
          filename: "final.png",
          size_bytes: 5,
          declared_mime: "image/png",
          role: "artwork_final",
          intended_visibility: "public_record",
        },
        expect.any(String),
        expect.any(AbortSignal)
      )
    );
    expect(linkDocumentationAsset).not.toHaveBeenCalled();
  });
  it("requires the matching interview publication permission before transfer", () => {
    const { context, controller } = setup();
    render(<DocumentationUpload context={context} controller={controller} />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "What is this file for?" }),
      { target: { value: "interview_recording" } }
    );
    fireEvent.change(screen.getByLabelText("Select file"), {
      target: {
        files: [new File(["audio"], "interview.wav", { type: "audio/wav" })],
      },
    });
    expect(screen.getByRole("button", { name: "Upload file" })).toBeDisabled();
    expect(
      screen.getByText(/Before uploading this interview material/)
    ).toBeInTheDocument();
    context.modules["interview"]!.answers["recording_permission"] = {
      status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
      value: "intended_public_record",
    };
    expect(canPublishDocumentationAsset(context, "interview_recording")).toBe(
      true
    );
    expect(canPublishDocumentationAsset(context, "interview_transcript")).toBe(
      false
    );
    expect(startDocumentationUpload).not.toHaveBeenCalled();
  });
  it("adds a public preservation role without private-deposit terms or an automatic license", async () => {
    const { context, controller } = setup();
    context.assets = [
      {
        id: "asset-1",
        filename: "final.png",
        size_bytes: 5,
        state: "ready",
        role: "artwork_final",
        intended_visibility: "public_record",
      },
    ];
    render(
      <DocumentationAssetDetails
        context={context}
        controller={controller}
        assetId="asset-1"
      />
    );
    fireEvent.click(screen.getByText("File details and integrity"));
    fireEvent.click(screen.getByRole("button", { name: "Add entry" }));
    await waitFor(() =>
      expect(linkDocumentationAsset).toHaveBeenCalledWith(
        context,
        expect.objectContaining({
          asset_id: "asset-1",
          role: "preservation_master",
          intended_visibility: "public_record",
          intended_terms: { kind: "unspecified" },
        }),
        expect.any(AbortSignal)
      )
    );
  });
  it("resumes an existing artwork upload independently of the new-file interview role", async () => {
    const { context, controller } = setup();
    const session = uploadSession();
    context.assets = [session.asset];
    jest.mocked(getDocumentationUpload).mockResolvedValue(session);
    jest
      .mocked(transferDocumentationFile)
      .mockResolvedValue({ asset: session.asset });
    render(<DocumentationUpload context={context} controller={controller} />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "What is this file for?" }),
      {
        target: { value: "interview_recording" },
      }
    );
    selectFile();
    expect(screen.getByRole("button", { name: "Upload file" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(transferDocumentationFile).toHaveBeenCalledWith(
        expect.objectContaining({ session, contextId: context.id })
      )
    );
    expect(startDocumentationUpload).not.toHaveBeenCalled();
    expect(cancelDocumentationUpload).not.toHaveBeenCalled();
  });
  it("retries its retained session even after an unrelated form role is selected", async () => {
    const props = setup();
    const session = uploadSession();
    jest.mocked(startDocumentationUpload).mockResolvedValue(session);
    jest.mocked(getDocumentationUpload).mockResolvedValue(session);
    jest
      .mocked(transferDocumentationFile)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ asset: session.asset });
    render(<DocumentationUpload {...props} />);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled()
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "What is this file for?" }),
      {
        target: { value: "interview_recording" },
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(transferDocumentationFile).toHaveBeenCalledTimes(2)
    );
    expect(getDocumentationUpload).toHaveBeenCalledWith(
      props.context.id,
      session.upload_id,
      expect.any(AbortSignal)
    );
    expect(startDocumentationUpload).toHaveBeenCalledTimes(1);
    expect(cancelDocumentationUpload).not.toHaveBeenCalled();
  });
  it.each([
    { role: "consent_instrument" },
    { intended_visibility: "restricted" },
  ])(
    "cancels a newly returned incompatible session and renews its start key: %j",
    async (overrides) => {
      const props = setup();
      const rejected = uploadSession(overrides);
      const accepted = uploadSession();
      jest
        .mocked(startDocumentationUpload)
        .mockResolvedValueOnce(rejected)
        .mockResolvedValueOnce(accepted);
      jest.mocked(cancelDocumentationUpload).mockResolvedValue(undefined);
      jest
        .mocked(transferDocumentationFile)
        .mockResolvedValue({ asset: accepted.asset });
      render(<DocumentationUpload {...props} />);
      selectFile();
      fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Upload file" })
        ).toBeEnabled()
      );
      expect(cancelDocumentationUpload).toHaveBeenCalledWith(
        props.context.id,
        rejected.upload_id,
        expect.any(AbortSignal)
      );
      expect(transferDocumentationFile).not.toHaveBeenCalled();
      const firstKey = jest.mocked(startDocumentationUpload).mock.calls[0]![2];
      fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
      await waitFor(() =>
        expect(transferDocumentationFile).toHaveBeenCalledTimes(1)
      );
      expect(jest.mocked(startDocumentationUpload).mock.calls[1]![2]).not.toBe(
        firstKey
      );
    }
  );
  it("retains a rejected reservation when automatic or explicit cancellation fails", async () => {
    const props = setup();
    const rejected = uploadSession({ role: "rights_instrument" });
    jest.mocked(startDocumentationUpload).mockResolvedValue(rejected);
    jest
      .mocked(cancelDocumentationUpload)
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);
    render(<DocumentationUpload {...props} />);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Cancel upload" })
      ).toBeEnabled()
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeDisabled();
    expect(
      screen.getByText(/This upload is still pending/)
    ).toHaveTextContent("Cancel upload to release it");
    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    await waitFor(() =>
      expect(cancelDocumentationUpload).toHaveBeenCalledTimes(2)
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Cancel upload" })
      ).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Upload file" })).toBeEnabled()
    );
    expect(cancelDocumentationUpload).toHaveBeenCalledTimes(3);
    expect(cancelDocumentationUpload).toHaveBeenLastCalledWith(
      props.context.id,
      rejected.upload_id,
      expect.any(AbortSignal)
    );
    expect(transferDocumentationFile).not.toHaveBeenCalled();
  });
  it("preserves a resumed interview session if publication permission changes while loading it", async () => {
    const props = setup();
    const session = uploadSession({ role: "interview_recording" });
    props.context.assets = [session.asset];
    props.context.modules["interview"]!.answers["recording_permission"] = {
      status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
      value: "intended_public_record",
    };
    jest.mocked(getDocumentationUpload).mockImplementation(async () => {
      delete props.context.modules["interview"]!.answers[
        "recording_permission"
      ];
      return session;
    });
    render(<DocumentationUpload {...props} />);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Cancel upload" })
      ).toBeEnabled()
    );
    expect(transferDocumentationFile).not.toHaveBeenCalled();
    expect(cancelDocumentationUpload).not.toHaveBeenCalled();
    expect(startDocumentationUpload).not.toHaveBeenCalled();
  });
  it("aborts cancellation on unmount without starting a replacement upload", async () => {
    const props = setup();
    const session = uploadSession();
    jest.mocked(startDocumentationUpload).mockResolvedValue(session);
    jest
      .mocked(transferDocumentationFile)
      .mockRejectedValue(new Error("network"));
    let finishCancel: (() => void) | undefined;
    jest.mocked(cancelDocumentationUpload).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishCancel = resolve;
        })
    );
    const view = render(<DocumentationUpload {...props} />);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    const signal = jest.mocked(cancelDocumentationUpload).mock.calls[0]![2];
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      finishCancel?.();
    });
    expect(startDocumentationUpload).toHaveBeenCalledTimes(1);
  });
  it.each([
    { role: "consent_instrument" },
    { role: "rights_instrument" },
    { intended_visibility: "restricted" },
  ])(
    "blocks incompatible existing links instead of republishing their metadata: %j",
    (overrides) => {
      const props = setup();
      const asset = uploadSession({ state: "ready" }).asset;
      props.context.assets = [asset];
      props.context.asset_links = [assetLink(asset, overrides)];
      render(<DocumentationAssetDetails {...props} assetId={asset.id} />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Add entry" })
      ).not.toBeInTheDocument();
      expect(props.controller.snapshot().contentEdits).toHaveLength(0);
      expect(patchDocumentationAssetLink).not.toHaveBeenCalled();
      expect(linkDocumentationAsset).not.toHaveBeenCalled();
    }
  );
  it("rechecks the stored asset when a role addition reaches the mutation queue", async () => {
    const props = setup();
    const asset = uploadSession({ state: "ready" }).asset;
    props.context.assets = [asset];
    render(<DocumentationAssetDetails {...props} assetId={asset.id} />);
    fireEvent.click(screen.getByText("File details and integrity"));
    asset.intended_visibility = "restricted";
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add entry" }));
    });
    expect(linkDocumentationAsset).not.toHaveBeenCalled();
  });
  it("keeps legacy consent metadata restricted when editing a label", async () => {
    const props = setup(false);
    const asset = uploadSession({
      state: "ready",
      role: "consent_instrument",
      intended_visibility: "restricted",
    }).asset;
    props.context.assets = [asset];
    props.context.asset_links = [assetLink(asset)];
    jest.mocked(patchDocumentationAssetLink).mockResolvedValue(props.context);
    render(<DocumentationAssetDetails {...props} assetId={asset.id} />);
    fireEvent.click(
      screen.getByText("File details and integrity", { selector: "summary" })
    );
    fireEvent.change(screen.getByDisplayValue("Original label"), {
      target: { value: "Updated label" },
    });
    await act(async () => {
      await props.controller.flush();
    });
    expect(patchDocumentationAssetLink).toHaveBeenCalledWith(
      props.context,
      "link-1",
      expect.objectContaining({
        label: "Updated label",
        intended_visibility: "restricted",
      }),
      expect.any(AbortSignal),
      expect.any(String)
    );
  });
});
