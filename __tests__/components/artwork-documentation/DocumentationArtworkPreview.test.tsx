import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentationArtworkPreview from "@/components/artwork-documentation/DocumentationArtworkPreview";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";
import type { ApiArtworkDocumentationPublicPreview } from "@/generated/models/ApiArtworkDocumentationPublicPreview";

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
  downloadDocumentationAsset: jest
    .fn()
    .mockResolvedValue({ url: "https://example.invalid/artwork.png" }),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropsV2ByIds: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

it("never falls back to a draft image or submission inside the publication projection", () => {
  const context = documentationFixture();
  context.modules["artwork"]!.answers["canonical_asset_id"] = {
    status: "provided",
    value: "draft-only-file",
  } as never;
  context.source_links = [{ drop_id: "source" }] as never;
  const publication: ApiArtworkDocumentationPublicPreview = {
    context_id: context.id,
    draft_version: 1,
    modules: {},
    asset_links: [],
  };
  render(
    <DocumentationArtworkPreview
      context={context}
      publication={publication}
      allowSubmissionReference
    />
  );
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(downloadDocumentationAsset).not.toHaveBeenCalled();
  expect(fetchDropsV2ByIds).not.toHaveBeenCalled();
});

it("uses the image and title selected by the publication projection", async () => {
  const context = documentationFixture();
  context.modules["artwork"]!.answers["canonical_asset_id"] = {
    status: "provided",
    value: "draft-only-file",
  } as never;
  context.modules["artwork"]!.answers["title"] = {
    status: "provided",
    value: "Draft-only title",
  } as never;
  context.assets = [
    { id: "public-file", state: "ready", filename: "artwork.png" },
  ] as never;
  const publication: ApiArtworkDocumentationPublicPreview = {
    context_id: context.id,
    draft_version: 1,
    asset_links: [],
    modules: {
      artwork: {
        schema_version: 1,
        answers: {
          canonical_asset_id: { status: "provided", value: "public-file" },
          title: { status: "provided", value: "The published title" },
        } as never,
      },
    },
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <DocumentationArtworkPreview
        context={context}
        publication={publication}
      />
    </QueryClientProvider>
  );
  await waitFor(() =>
    expect(downloadDocumentationAsset).toHaveBeenCalledWith(
      context.id,
      "public-file",
      "preview",
      expect.any(AbortSignal)
    )
  );
  expect(
    await screen.findByRole("img", { name: "The published title" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("img", { name: "Draft-only title" })
  ).not.toBeInTheDocument();
  result.unmount();
  client.clear();
});
