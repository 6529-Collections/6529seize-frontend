import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import DocumentationArtworkPreview, {
  ArtworkImage,
} from "@/components/artwork-documentation/DocumentationArtworkPreview";
import DocumentationListRecord from "@/components/artwork-documentation/DocumentationListRecord";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import type { ApiArtworkDocumentationContextSummary } from "@/generated/models/ApiArtworkDocumentationContextSummary";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { documentationSourcePreviewUrl } from "@/lib/artwork-documentation/source-preview";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/artwork-documentation/DocumentationAuthGate", () => ({
  useDocumentationActor: () => ({
    actorKey: "artist",
    connectedProfile: { id: "artist-a" },
  }),
}));
jest.mock("@/services/api/artwork-documentation-assets-api", () => ({
  downloadDocumentationAsset: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropsV2ByIds: jest.fn(),
}));

const folder = "https://d3lqz0a4bldqgf.cloudfront.net/drops/artist/work";
const original = `${folder}/artwork.jpg`;
const compactUrl = `${folder}/AUTOx450/artwork.jpg`;
const expandedUrl = `${folder}/AUTOx1080/artwork.jpg`;
const noPreview = "Preview unavailable for this format";

function sourceDrop(): ApiDrop {
  return {
    id: "source",
    title: "Submitted artwork",
    wave: { id: "wave" },
    author: { id: "artist-a" },
    moderation: { can_view: true },
    parts: [
      {
        media: [
          {
            mime_type: "image/jpeg",
            url: original,
            media_status: ApiDropMediaStatus.Ready,
          },
        ],
      },
    ],
  } as ApiDrop;
}

function contextWithSource() {
  const context = documentationFixture();
  context.source_links = [
    {
      drop_id: "source",
      wave_id: "wave",
      author_profile_id: "artist-a",
      source_receipt_id: "receipt",
      work_id: context.work_id,
      context_id: context.id,
    },
  ];
  return context;
}

function catalogueRecord(): ApiArtworkDocumentationContextSummary {
  return {
    id: "context",
    work_id: "work",
    program_id: "6529NM-AP-01",
    owner_profile_id: "artist-a",
    artist_display_name: "Example artist",
    artist_preferred_credit: null,
    source_submission: {
      drop_id: "source",
      wave_id: "wave",
      source_receipt_id: "receipt",
      title: "Submitted artwork",
    },
    title: "Artwork",
    draft_version: 1,
    confirmation_status: "unconfirmed",
    latest_revision_id: null,
    lifecycle: "active",
    updated_at: 1,
    profile_id: "profile",
    profile_version: 1,
    reviews: [],
  };
}

function renderQuery(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>
  );
  return {
    client,
    dispose: () => {
      result.unmount();
      client.clear();
    },
  };
}

beforeEach(() => jest.resetAllMocks());

it.each([
  [true, compactUrl, "lazy"],
  [false, expandedUrl, "eager"],
] as const)(
  "uses the display derivative for compact=%s source previews",
  async (compact, expected, loading) => {
    jest.mocked(fetchDropsV2ByIds).mockResolvedValue([sourceDrop()]);
    const { dispose } = renderQuery(
      <DocumentationArtworkPreview
        context={contextWithSource()}
        compact={compact}
        allowSubmissionReference
      />
    );
    const image = await screen.findByRole("img", { name: "Submitted artwork" });
    expect(image).toHaveAttribute("src", expected);
    expect(image).toHaveAttribute("loading", loading);
    expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(image).not.toHaveAttribute("srcset");
    expect(downloadDocumentationAsset).not.toHaveBeenCalled();
    dispose();
  }
);

it("uses the compact derivative in the catalogue and retries the original only once", () => {
  const { dispose } = renderQuery(
    <DocumentationListRecord
      record={catalogueRecord()}
      sourceDrop={sourceDrop()}
    />
  );
  const image = screen.getByRole("img", { name: "Submitted artwork" });
  expect(image).toHaveAttribute("src", compactUrl);
  fireEvent.error(image);
  expect(screen.getByRole("img")).toHaveAttribute("src", original);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getAllByText(noPreview)).toHaveLength(1);
  dispose();
});

it("keeps the original's intrinsic ratio after a successful fallback", async () => {
  render(
    <ArtworkImage
      url={compactUrl}
      fallbackUrl={original}
      title="Artwork"
      compact
    />
  );
  fireEvent.error(screen.getByRole("img"));
  const image = screen.getByRole("img");
  Object.defineProperties(image, {
    naturalWidth: { value: 2400, configurable: true },
    naturalHeight: { value: 3600, configurable: true },
  });
  fireEvent.load(image);
  await waitFor(() => expect(image).toHaveAttribute("width", "2400"));
  expect(image).toHaveAttribute("height", "3600");
  expect(image).toHaveAttribute("src", original);
  expect(screen.queryByText(noPreview)).not.toBeInTheDocument();
});

it("does not retry an identical URL and resets failed state when the source changes", () => {
  const { rerender } = render(
    <ArtworkImage
      key={original}
      url={original}
      fallbackUrl={original}
      title="Artwork"
      compact
    />
  );
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getAllByText(noPreview)).toHaveLength(1);
  rerender(
    <ArtworkImage
      key={compactUrl}
      url={compactUrl}
      fallbackUrl={original}
      title="Artwork"
      compact
    />
  );
  expect(screen.getByRole("img")).toHaveAttribute("src", compactUrl);
  expect(screen.queryByText(noPreview)).not.toBeInTheDocument();
});

it.each(["current", "publication"] as const)(
  "keeps the exact authorized canonical URL in a %s record",
  async (mode) => {
    const context = contextWithSource();
    context.modules["artwork"]!.answers["canonical_asset_id"] = {
      status: "provided",
      value: "final",
    } as never;
    context.assets = [
      { id: "final", state: "ready", filename: "artwork.jpg" },
    ] as never;
    const authorizedUrl = `${original}?Policy=fixture&Signature=fixture`;
    jest
      .mocked(downloadDocumentationAsset)
      .mockResolvedValue({ url: authorizedUrl } as never);
    const { dispose } = renderQuery(
      <DocumentationArtworkPreview
        context={context}
        allowSubmissionReference
        publication={
          mode === "publication"
            ? {
                context_id: context.id,
                draft_version: 1,
                modules: context.modules,
                asset_links: [],
              }
            : undefined
        }
      />
    );
    const image = await screen.findByRole("img");
    expect(image).toHaveAttribute("src", authorizedUrl);
    expect(image).not.toHaveAttribute("srcset");
    expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(fetchDropsV2ByIds).not.toHaveBeenCalled();
    fireEvent.error(image);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getAllByText(noPreview)).toHaveLength(1);
    dispose();
  }
);

it.each(["drop", "wave", "author", "moderation"] as const)(
  "retains the source %s boundary",
  async (boundary) => {
    const drop = sourceDrop();
    if (boundary === "drop") drop.id = "other";
    if (boundary === "wave") drop.wave.id = "other";
    if (boundary === "author") drop.author.id = "other";
    if (boundary === "moderation") drop.moderation!.can_view = false;
    jest.mocked(fetchDropsV2ByIds).mockResolvedValue([drop]);
    const { client, dispose } = renderQuery(
      <DocumentationArtworkPreview
        context={contextWithSource()}
        allowSubmissionReference
      />
    );
    await waitFor(() => expect(fetchDropsV2ByIds).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    dispose();
  }
);

it.each([
  `${original}?Signature=fixture`,
  `${original}#fragment`,
  `${folder}/artwork.svg`,
  "https://other.example/drops/artwork.jpg",
  "https://d3lqz0a4bldqgf.cloudfront.net.other.example/drops/artwork.jpg",
])("leaves non-derivable or parameterized source URL unchanged: %s", (url) => {
  expect(documentationSourcePreviewUrl(url, true)).toBe(url);
  expect(documentationSourcePreviewUrl(url, false)).toBe(url);
});

it.each(["jpg", "jpeg", "png"])(
  "uses existing official CDN variants for %s files",
  (extension) => {
    expect(
      documentationSourcePreviewUrl(`${folder}/artwork.${extension}`, true)
    ).toBe(`${folder}/AUTOx450/artwork.${extension}`);
    expect(
      documentationSourcePreviewUrl(`${folder}/artwork.${extension}`, false)
    ).toBe(`${folder}/AUTOx1080/artwork.${extension}`);
  }
);
