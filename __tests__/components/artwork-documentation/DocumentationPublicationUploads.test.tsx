import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DocumentationUpload from "@/components/artwork-documentation/DocumentationUpload";
import DocumentationAssetDetails from "@/components/artwork-documentation/DocumentationAssetDetails";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { canPublishDocumentationAsset } from "@/lib/artwork-documentation/asset-roles";
import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import {
  linkDocumentationAsset,
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
});
