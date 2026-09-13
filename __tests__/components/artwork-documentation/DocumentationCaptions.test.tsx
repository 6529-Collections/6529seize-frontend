import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationMediaPlayer from "@/components/artwork-documentation/DocumentationMediaPlayer";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { fetchDocumentationCaptions } from "@/lib/artwork-documentation/media-alternatives";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
let mockActor = "artist";
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: mockActor,
    connectedProfile: { id: mockActor },
  }),
}));
jest.mock("@/services/api/artwork-documentation-assets-api", () => ({
  downloadDocumentationAsset: jest.fn(),
}));
jest.mock("@/lib/artwork-documentation/media-alternatives", () => ({
  ...jest.requireActual("@/lib/artwork-documentation/media-alternatives"),
  fetchDocumentationCaptions: jest.fn(),
}));
beforeEach(() => {
  mockActor = "artist";
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:caption"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
  jest
    .mocked(downloadDocumentationAsset)
    .mockImplementation(async (_context, _id, variant) => ({
      url: `https://storage.invalid/${variant}`,
      expires_at: Date.now() + 60000,
    }));
  jest
    .mocked(fetchDocumentationCaptions)
    .mockResolvedValue(new Blob(["WEBVTT\n"], { type: "text/vtt" }));
});
afterEach(() => jest.clearAllMocks());
function fixture() {
  const context = documentationFixture();
  const video = {
    id: "video",
    state: "ready",
    filename: "Received video",
    has_media_preview: true,
    detected_mime: "video/mp4",
  } as ApiArtworkDocumentationAsset;
  const caption = {
    id: "caption",
    state: "ready",
    filename: "supplied.vtt",
    detected_mime: "text/vtt",
  } as ApiArtworkDocumentationAsset;
  context.assets = [video, caption];
  context.asset_links = [
    {
      asset_id: caption.id,
      role: "captions",
      derived_from_asset_ids: [video.id],
    },
  ] as never;
  context.modules["interview"]!.answers["sessions"] = {
    status: "provided",
    value: [
      {
        id: "session",
        recording_asset_ids: [video.id],
        transcript_text:
          "<script>Supplied transcript, displayed as text.</script>",
        language: "en",
      },
    ],
  } as never;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = () => (
    <QueryClientProvider client={client}>
      <DocumentationMediaPlayer context={context} asset={video} />
    </QueryClientProvider>
  );
  return { context, client, view };
}
it("attaches authorized caption bytes after opening and revokes them on actor change", async () => {
  const props = fixture(),
    user = userEvent.setup();
  const result = render(props.view());
  expect(downloadDocumentationAsset).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Open the player" }));
  await waitFor(() =>
    expect(result.container.querySelector("track")).toHaveAttribute(
      "src",
      "blob:caption"
    )
  );
  expect(downloadDocumentationAsset).toHaveBeenCalledWith(
    props.context.id,
    "caption",
    "original",
    expect.any(AbortSignal)
  );
  await user.click(screen.getByText("Read the transcript"));
  expect(
    screen.getByRole("region", { name: "Read the transcript" }).textContent
  ).toContain("<script>");
  expect(result.container.querySelector("script")).toBeNull();
  mockActor = "other";
  result.rerender(props.view());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:caption");
  expect(result.container.querySelector("track")).toBeNull();
  result.unmount();
  props.client.clear();
});
it("does not fetch storage bytes after denied caption authorization and supports retry", async () => {
  const props = fixture(),
    user = userEvent.setup();
  let denied = true;
  jest
    .mocked(downloadDocumentationAsset)
    .mockImplementation(async (_context, _id, variant) => {
      if (variant === "original" && denied) throw new Error("Forbidden");
      return {
        url: `https://storage.invalid/${variant}`,
        expires_at: Date.now() + 60000,
      };
    });
  const result = render(props.view());
  await user.click(screen.getByRole("button", { name: "Open the player" }));
  expect(
    await screen.findByText(/caption file could not be loaded/)
  ).toBeVisible();
  expect(fetchDocumentationCaptions).not.toHaveBeenCalled();
  denied = false;
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() =>
    expect(result.container.querySelector("track")).toHaveAttribute(
      "src",
      "blob:caption"
    )
  );
  result.unmount();
  props.client.clear();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:caption");
});

it("announces a native track failure and retries without marking the video codec failed", async () => {
  const props = fixture();
  const user = userEvent.setup();
  const result = render(props.view());
  await user.click(screen.getByRole("button", { name: "Open the player" }));
  await waitFor(() =>
    expect(result.container.querySelector("track")).not.toBeNull()
  );
  const captionStatus = screen.getAllByRole("status")[1]!;
  fireEvent.error(result.container.querySelector("track")!);
  await waitFor(() =>
    expect(captionStatus).toHaveTextContent(/caption file could not be loaded/)
  );
  expect(result.container.querySelector("video")).not.toBeNull();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() =>
    expect(fetchDocumentationCaptions).toHaveBeenCalledTimes(2)
  );
  expect(captionStatus).toBeEmptyDOMElement();
  result.unmount();
  props.client.clear();
});
