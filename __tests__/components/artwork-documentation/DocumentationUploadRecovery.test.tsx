import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationUpload from "@/components/artwork-documentation/DocumentationUpload";
import DocumentationModules from "@/components/artwork-documentation/DocumentationModules";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import {
  documentationFixture,
  titleOperation,
} from "@/__tests__/fixtures/artwork-documentation";
import museumProfile from "@/__tests__/fixtures/artwork-documentation-profile-v3.json";
import { ApiArtworkDocumentationProfileIntakeModeEnum } from "@/generated/models/ApiArtworkDocumentationProfile";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import { getDocumentationContext } from "@/services/api/artwork-documentation-api";
import {
  getDocumentationUpload,
  linkDocumentationAsset,
  startDocumentationUpload,
} from "@/services/api/artwork-documentation-assets-api";
import { transferDocumentationFile } from "@/lib/artwork-documentation/upload";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "artist-a",
    connectedProfile: { id: "artist-a" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  ...jest.requireActual("@/services/api/artwork-documentation-api"),
  getDocumentationContext: jest.fn(),
  patchDocumentationModule: jest.fn(),
}));
jest.mock("@/services/api/artwork-documentation-assets-api");
jest.mock("@/utils/monitoring/artworkDocumentationUploadMonitoring");
jest.mock("@/lib/artwork-documentation/upload", () => ({
  DocumentationFileChangedError: class extends Error {},
  transferDocumentationFile: jest.fn(),
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationMediaPlayer",
  () => ({ __esModule: true, default: () => null })
);

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
let server: ApiArtworkDocumentationContext;
let upload: ApiArtworkDocumentationUploadSession;
let client: QueryClient;
let pendingChange: jest.Mock;

function Editor({
  initial,
}: {
  readonly initial: ApiArtworkDocumentationContext;
}) {
  const draft = useDocumentationDraft(initial);
  return (
    <>
      <button
        type="button"
        onClick={() => draft.controller.edit("artwork", titleOperation(""))}
      >
        Leave an incomplete title
      </button>
      <output aria-label="Unsaved answer count">{draft.edits.length}</output>
      <DocumentationUpload
        context={draft.context}
        controller={draft.controller}
        onPendingChange={pendingChange}
      />
      <DocumentationModules
        context={draft.context}
        edits={draft.edits}
        inlineFields={["artwork.canonical_asset_id"]}
        onChange={(moduleId, operation) =>
          draft.controller.edit(moduleId, operation)
        }
        assets={draft.context.assets
          .filter((asset) => asset.state === "ready")
          .map((asset) => ({ id: asset.id, label: asset.filename }))}
      />
    </>
  );
}
function setup(version = 2, restored: false | "ready" | "processing" = false) {
  server = documentationFixture();
  if (version === 3) {
    server.profile = clone(museumProfile) as typeof server.profile;
    server.modules["artwork"]!.answers["media_profiles"] = {
      status: "provided",
      value: ["photography"],
      intended_visibility: "public_record",
    } as never;
  } else {
    server.profile.version = version;
    server.profile.intake_mode =
      ApiArtworkDocumentationProfileIntakeModeEnum.PublicationOnly;
    server.profile.modules
      .find((module) => module.id === "artwork")!
      .fields.push({
        id: "canonical_asset_id",
        value_schema: { type: "string", minLength: 1 },
        allowed_statuses: ["provided"],
        default_visibility: "public_record",
        locked_restricted: false,
      } as never);
  }
  upload = {
    can_mutate: true,
    upload_id: "asset-1",
    expires_at: Date.now() + 60_000,
    asset: {
      id: "asset-1",
      filename: "final.png",
      size_bytes: 5,
      role: "artwork_final",
      intended_visibility: "public_record",
      state: "uploading",
    },
    received_parts: [],
    policy: {},
  };
  jest
    .mocked(startDocumentationUpload)
    .mockImplementation(async () => clone(upload));
  jest
    .mocked(getDocumentationUpload)
    .mockImplementation(async () => clone(upload));
  jest
    .mocked(getDocumentationContext)
    .mockImplementation(async () => clone(server));
  jest
    .mocked(transferDocumentationFile)
    .mockImplementation(async ({ onProgress }) => {
      onProgress(5);
      upload.asset.state = "processing";
      server.assets = [clone(upload.asset)];
      return { asset: clone(upload.asset) };
    });
  jest
    .mocked(linkDocumentationAsset)
    .mockImplementation(async (_context, request) => {
      server.assets = [clone(upload.asset)];
      server.asset_links = [
        { ...request, id: "link-1", manifest: clone(upload.asset) } as never,
      ];
      server.draft_version += 1;
      return clone(server);
    });
  if (restored) {
    upload.asset.state = restored;
    server.assets = [clone(upload.asset)];
  }
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <Editor initial={clone(server)} />
    </QueryClientProvider>
  );
  return view;
}
async function selectAndUpload() {
  fireEvent.change(screen.getByLabelText("Select file"), {
    target: {
      files: [new File(["image"], "final.png", { type: "image/png" })],
    },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
  });
}
async function scanReady() {
  upload.asset.state = "ready";
  server.assets = [clone(upload.asset)];
  await act(async () => {
    await jest.advanceTimersByTimeAsync(3000);
  });
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  pendingChange = jest.fn();
});
afterEach(() => {
  client?.clear();
  jest.useRealTimers();
});

describe("upload, scan and final-file selection with the real draft controller", () => {
  it.each([2, 3])(
    "makes a checked file selectable without losing an incomplete answer in profile v%s",
    async (version) => {
      setup(version);
      expect(
        screen.getByText(
          /A file becomes available here after its checks finish/
        )
      ).toBeVisible();
      const link = screen.getByRole("link", { name: "Go to file upload" });
      fireEvent.click(link);
      expect(document.getElementById("documentation-upload")).toHaveFocus();
      fireEvent.click(
        screen.getByRole("button", { name: "Leave an incomplete title" })
      );
      await selectAndUpload();
      expect(startDocumentationUpload).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Transfer complete/)).toBeVisible();
      expect(
        screen.queryByRole("option", { name: "final.png" })
      ).not.toBeInTheDocument();
      await scanReady();
      expect(screen.getByText(/has been checked and added/)).toBeVisible();
      expect(
        screen.getByRole("option", { name: "final.png" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Unsaved answer count")).toHaveTextContent(
        "1"
      );
      expect(linkDocumentationAsset).toHaveBeenCalledTimes(1);
    }
  );

  it("warns before unloading and reports pending work only while a transfer or check is active", async () => {
    setup();
    expect(pendingChange).not.toHaveBeenCalled();
    await selectAndUpload();
    expect(pendingChange).toHaveBeenLastCalledWith(true);
    const during = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(during);
    expect(during.defaultPrevented).toBe(true);
    await scanReady();
    expect(pendingChange).toHaveBeenLastCalledWith(false);
    const after = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it("explains that a selected filename is not an uploaded file", () => {
    setup();
    fireEvent.change(screen.getByLabelText("Select file"), {
      target: {
        files: [new File(["image"], "final.png", { type: "image/png" })],
      },
    });
    expect(screen.getByText(/is selected on your device/)).toBeVisible();
    expect(startDocumentationUpload).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("option", { name: "final.png" })
    ).not.toBeInTheDocument();
  });

  it("retries only attachment after the original is checked", async () => {
    setup();
    jest
      .mocked(linkDocumentationAsset)
      .mockRejectedValueOnce(new Error("network"));
    await selectAndUpload();
    await scanReady();
    expect(screen.getByText(/do not need to upload it again/)).toBeVisible();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Add checked file to record" })
      );
    });
    expect(
      screen.getByRole("option", { name: "final.png" })
    ).toBeInTheDocument();
    expect(startDocumentationUpload).toHaveBeenCalledTimes(1);
    expect(transferDocumentationFile).toHaveBeenCalledTimes(1);
    expect(linkDocumentationAsset).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/has been checked and added/)).toBeVisible();
  });

  it("reads back a committed attachment after a lost response without linking twice", async () => {
    setup();
    const successfulLink = jest
      .mocked(linkDocumentationAsset)
      .getMockImplementation()!;
    jest
      .mocked(linkDocumentationAsset)
      .mockImplementationOnce(async (...args) => {
        await successfulLink(...args);
        throw new Error("response lost");
      });
    await selectAndUpload();
    await scanReady();
    upload.can_mutate = false;
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Add checked file to record" })
      );
    });
    expect(linkDocumentationAsset).toHaveBeenCalledTimes(1);
    expect(transferDocumentationFile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("option", { name: "final.png" })
    ).toBeInTheDocument();
  });

  it("resumes checking after a temporary polling error without uploading again", async () => {
    setup();
    await selectAndUpload();
    jest
      .mocked(getDocumentationUpload)
      .mockRejectedValueOnce(new Error("temporary network"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(transferDocumentationFile).toHaveBeenCalledTimes(1);
    await scanReady();
    expect(
      screen.getByRole("option", { name: "final.png" })
    ).toBeInTheDocument();
  });

  it("adds a restored checked original without asking for the local file", async () => {
    setup(2, "ready");
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(
      screen.queryByRole("option", { name: "final.png" })
    ).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Add checked file to record" })
      );
    });
    expect(
      screen.getByRole("option", { name: "final.png" })
    ).toBeInTheDocument();
    expect(startDocumentationUpload).not.toHaveBeenCalled();
    expect(transferDocumentationFile).not.toHaveBeenCalled();
    expect(linkDocumentationAsset).toHaveBeenCalledTimes(1);
  });

  it("refreshes a restored scan and lets the artist attach it while writing is incomplete", async () => {
    setup(2, "processing");
    fireEvent.click(
      screen.getByRole("button", { name: "Leave an incomplete title" })
    );
    await scanReady();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByLabelText("Unsaved answer count")).toHaveTextContent(
      "1"
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Add checked file to record" })
      );
    });
    expect(
      screen.getByRole("option", { name: "final.png" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Unsaved answer count")).toHaveTextContent(
      "1"
    );
    expect(transferDocumentationFile).not.toHaveBeenCalled();
  });

  it("never makes a quarantined original available for selection", async () => {
    setup();
    await selectAndUpload();
    upload.asset.state = "quarantined";
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByRole("alert")).toBeVisible();
    expect(linkDocumentationAsset).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("option", { name: "final.png" })
    ).not.toBeInTheDocument();
  });

  it("aborts the transfer on unmount and ignores its late completion", async () => {
    const view = setup();
    let resolveTransfer:
      | ((value: { asset: typeof upload.asset }) => void)
      | undefined;
    jest.mocked(transferDocumentationFile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTransfer = resolve;
        })
    );
    await selectAndUpload();
    const signal = jest.mocked(transferDocumentationFile).mock.calls[0]![0]
      .signal;
    view.unmount();
    expect(pendingChange).toHaveBeenLastCalledWith(false);
    const afterUnmount = new Event("beforeunload", { cancelable: true });
    globalThis.dispatchEvent(afterUnmount);
    expect(afterUnmount.defaultPrevented).toBe(false);
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolveTransfer?.({ asset: upload.asset });
    });
    expect(linkDocumentationAsset).not.toHaveBeenCalled();
  });
});
