import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationArtworkPreview from "@/components/artwork-documentation/DocumentationArtworkPreview";
import DocumentationAssetTechnical from "@/components/artwork-documentation/DocumentationAssetTechnical";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import {
  downloadDocumentationAsset,
  getDocumentationUpload,
} from "@/services/api/artwork-documentation-assets-api";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "artist",
    connectedProfile: { id: "artist" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-assets-api", () => ({
  getDocumentationUpload: jest.fn(),
  downloadDocumentationAsset: jest
    .fn()
    .mockResolvedValue({ url: "https://assets.invalid/scanned-original.mp4" }),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropsV2ByIds: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(downloadDocumentationAsset)
    .mockReset()
    .mockResolvedValue({
      url: "https://assets.invalid/scanned-original.mp4",
      expires_at: Date.now() + 60000,
    });
});
function QueryWrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

function setup(mime: string, playable: boolean) {
  const context = documentationFixture();
  const asset = {
    id: "final",
    filename: "The work",
    state: "ready",
    detected_mime: mime,
    has_preview: false,
    has_media_preview: playable,
  } as ApiArtworkDocumentationAsset;
  context.assets = [asset];
  context.modules["artwork"]!.answers["canonical_asset_id"] = {
    status: "provided",
    value: asset.id,
  } as never;
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DocumentationArtworkPreview context={context} />
    </QueryClientProvider>
  );
}

it.each(["audio/flac", "video/mp4"])(
  "plays %s only through the server media endpoint after a deliberate action",
  async (mime) => {
    const user = userEvent.setup();
    const result = setup(mime, true);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    expect(downloadDocumentationAsset).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Open the player" }));
    await waitFor(() =>
      expect(downloadDocumentationAsset).toHaveBeenCalledWith(
        expect.any(String),
        "final",
        "media",
        expect.any(AbortSignal)
      )
    );
    const player = await screen.findByLabelText("The work");
    expect(player.tagName).toBe(mime.startsWith("audio") ? "AUDIO" : "VIDEO");
    expect(player).toHaveAttribute("controls");
    expect(player).not.toHaveAttribute("autoplay");
    fireEvent.error(player);
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/download|display/i);
    expect(result.container.querySelector("audio,video")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("The work")).toBeInTheDocument();
    expect(downloadDocumentationAsset).toHaveBeenCalledTimes(2);
  }
);

it.each(["text/html", "image/svg+xml", "application/wasm"])(
  "never executes %s even if a media flag is inconsistent",
  (mime) => {
    const result = setup(mime, true);
    expect(downloadDocumentationAsset).not.toHaveBeenCalled();
    expect(
      result.container.querySelector("iframe,object,embed,audio,video")
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Open the player" })
    ).not.toBeInTheDocument();
  }
);

it("keeps a failed player unmounted until a deferred retry returns a fresh grant", async () => {
  const user = userEvent.setup();
  let resolveGrant:
    | ((grant: Awaited<ReturnType<typeof downloadDocumentationAsset>>) => void)
    | undefined;
  jest
    .mocked(downloadDocumentationAsset)
    .mockResolvedValueOnce({
      url: "https://assets.invalid/expired.mp4",
      expires_at: 1,
    })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGrant = resolve;
        })
    );
  const result = setup("video/mp4", true);
  await user.click(screen.getByRole("button", { name: "Open the player" }));
  const expiredPlayer = await screen.findByLabelText("The work");
  expect(expiredPlayer).toHaveAttribute(
    "src",
    "https://assets.invalid/expired.mp4"
  );
  fireEvent.error(expiredPlayer);
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() =>
    expect(downloadDocumentationAsset).toHaveBeenCalledTimes(2)
  );
  expect(result.container.querySelector("video")).toBeNull();
  expect(screen.getByRole("button", { name: "Try again" })).toBeDisabled();
  // A late event from the failed, detached element cannot poison the fresh grant.
  fireEvent.error(expiredPlayer);
  await act(async () =>
    resolveGrant?.({
      url: "https://assets.invalid/fresh.mp4",
      expires_at: Date.now() + 60000,
    })
  );
  expect(await screen.findByLabelText("The work")).toHaveAttribute(
    "src",
    "https://assets.invalid/fresh.mp4"
  );
  expect(screen.queryByText(/browser cannot play/)).toBeNull();
});

it("distinguishes checked manifest integrity from unassessed claims and restricts report download", () => {
  const asset = {
    id: "asset",
    sha256: "original-hash",
    has_validation_report: true,
    technical_metadata: {
      characterization: "partial",
      detected_format: "TIFF",
      measured_at: 1789200000000,
      properties: { width: 14202, height: 9468 },
      warnings: [],
      method: "signature and metadata",
      format_registry: {
        status: "signature_match",
        authority: "PRONOM",
        identifier: "fmt/353",
      },
      c2pa: {
        status: "report_available",
        integrity: "valid",
        trust: "not_assessed",
      },
    },
  } as unknown as ApiArtworkDocumentationAsset;
  const onReport = jest.fn();
  const result = render(
    <DocumentationAssetTechnical
      contextId="context"
      asset={asset}
      canReadReport={false}
      onReport={onReport}
    />,
    { wrapper: QueryWrapper }
  );
  expect(screen.getByText(/Trust in its signer/)).toBeInTheDocument();
  expect(screen.getByText(/passed its integrity checks/)).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  result.rerender(
    <DocumentationAssetTechnical
      contextId="context"
      asset={asset}
      canReadReport
      onReport={onReport}
    />
  );
  fireEvent.click(screen.getByText("File integrity"));
  fireEvent.click(
    screen.getByRole("button", { name: "Download credential report" })
  );
  expect(onReport).toHaveBeenCalledTimes(1);
});

it("loads bounded file evidence only when its disclosure is opened, without granting report access", async () => {
  const user = userEvent.setup();
  const asset = {
    id: "original",
    sha256: "checked-sha",
    technical_metadata: null,
    has_validation_report: true,
  } as unknown as ApiArtworkDocumentationAsset;
  jest.mocked(getDocumentationUpload).mockResolvedValue({
    asset: {
      ...asset,
      technical_metadata: {
        characterization: "partial",
        detected_format: "TIFF",
        measured_at: 1789200000000,
        properties: {},
        warnings: [],
        format_registry: { status: "unidentified" },
        c2pa: { status: "no_manifest" },
      },
    },
  } as never);
  render(
    <DocumentationAssetTechnical
      contextId="record"
      asset={asset}
      canReadReport={false}
      onReport={jest.fn()}
    />,
    { wrapper: QueryWrapper }
  );
  expect(getDocumentationUpload).not.toHaveBeenCalled();
  await user.click(screen.getByText("File integrity"));
  expect(await screen.findByText("TIFF", { exact: false })).toBeInTheDocument();
  expect(getDocumentationUpload).toHaveBeenCalledWith(
    "record",
    "original",
    expect.any(AbortSignal)
  );
  expect(
    screen.queryByRole("button", { name: "Download credential report" })
  ).toBeNull();
  expect(downloadDocumentationAsset).not.toHaveBeenCalled();
});

it("keeps the checksum visible and retries an unavailable evidence read", async () => {
  const user = userEvent.setup();
  const asset = {
    id: "original",
    sha256: "kept-checksum",
    technical_metadata: null,
  } as unknown as ApiArtworkDocumentationAsset;
  jest
    .mocked(getDocumentationUpload)
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValueOnce({ asset } as never);
  render(
    <DocumentationAssetTechnical
      contextId="record"
      asset={asset}
      canReadReport={false}
      onReport={jest.fn()}
    />,
    { wrapper: QueryWrapper }
  );
  const status = screen.getByRole("status", { hidden: true });
  expect(status).toBeEmptyDOMElement();
  await user.click(screen.getByText("File integrity"));
  await screen.findByText(/measurements could not be loaded/);
  expect(screen.getByRole("status")).toBe(status);
  expect(status).toHaveTextContent(/measurements could not be loaded/);
  expect(screen.getByText(/kept-checksum/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(getDocumentationUpload).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByText(/measurements could not be loaded/)).toBeNull()
  );
});
