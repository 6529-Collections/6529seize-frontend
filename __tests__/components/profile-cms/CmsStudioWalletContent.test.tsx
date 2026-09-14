import { fireEvent, render, screen } from "@testing-library/react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { CmsLink } from "@/components/profile-cms/site-renderer/links";
import { createRendererContext } from "@/components/profile-cms/site-renderer/data";
import { createMockWalletGallerySnapshot } from "@/lib/profile-cms/builder/gallery";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import { addCmsStudioWalletGallery } from "@/lib/profile-cms/studio/wallet-import";

const NOW = new Date("2026-09-11T00:00:00Z");

function fixture() {
  const base = instantiateCmsStudioTemplate("collection", "example6529", NOW);
  const snapshot = createMockWalletGallerySnapshot({
    handle: "example6529",
    sources: [],
    now: NOW,
  });
  const result = addCmsStudioWalletGallery(base, {
    expectedBaseHash: base.integrity.package_hash,
    snapshot,
    selectedAssetIds: snapshot.assets.map((asset) => asset.id),
    title: "Selected wallet works",
    description: "A reviewed snapshot",
    collectionsTitle: "Collections",
    noPreviewText: "Preview unavailable; details remain available.",
    now: NOW,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return {
    document: result.document,
    snapshot,
    originalPages: base.payload.pages.length,
  };
}

describe("studio imported wallet pages", () => {
  it("renders every selected work once and navigates to all detail pages locally", () => {
    const { document, snapshot, originalPages } = fixture();
    const navigate = jest.fn();
    render(
      <CmsSiteRenderer
        cmsPackage={document}
        page={document.payload.pages[originalPages]!}
        editing={{ onNavigatePage: navigate }}
      />
    );
    expect(screen.getAllByRole("img")).toHaveLength(2);
    for (const asset of snapshot.assets) {
      const page = document.payload.pages.find(
        (item) => item.metadata.title === asset.title
      )!;
      fireEvent.click(screen.getByRole("link", { name: asset.title }));
      expect(navigate).toHaveBeenLastCalledWith(page.id);
    }
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
  });

  it("preserves an authored adjacent gallery even when it repeats holding images", () => {
    const { document, originalPages } = fixture();
    const page = document.payload.pages[originalPages]!;
    const assetId = document.payload.nft_media_profiles![0]!.poster_asset_id!;
    const authoredGallery = {
      id: "authored-gallery",
      block_type: "gallery" as const,
      asset_ids: [assetId],
      layout: "masonry",
    };
    page.blocks.splice(2, 0, authoredGallery);
    const { container } = render(
      <CmsSiteRenderer cmsPackage={document} page={page} />
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(
      container.querySelector('[data-cms-block-id="authored-gallery"]')
    ).toBeInTheDocument();
  });

  it("renders linked collection index entries rather than an empty reference panel", () => {
    const { document } = fixture();
    const page = document.payload.pages.find((item) =>
      item.path.endsWith("/wallet-gallery/collections/index.html")
    )!;
    const collection = document.payload.pages.find((item) =>
      item.path.endsWith("/collections/the-memes/index.html")
    )!;
    const navigate = jest.fn();
    render(
      <CmsSiteRenderer
        cmsPackage={document}
        page={page}
        editing={{ onNavigatePage: navigate }}
      />
    );
    fireEvent.click(
      screen.getByRole("link", { name: collection.metadata.title })
    );
    expect(navigate).toHaveBeenCalledWith(collection.id);
  });

  it("retains full NFT snapshot, metadata and original inspection in the studio detail layout", () => {
    const { document, snapshot } = fixture();
    const page = document.payload.pages.find(
      (item) => item.type === "nft_detail"
    )!;
    const navigate = jest.fn();
    const { container } = render(
      <CmsSiteRenderer
        cmsPackage={document}
        page={page}
        editing={{ onNavigatePage: navigate }}
      />
    );
    expect(
      screen.getAllByText(snapshot.assets[0]!.owner).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(snapshot.assets[0]!.contract).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("22,000,000").length).toBeGreaterThan(0);
    expect(
      screen.getByText(snapshot.assets[0]!.metadataUri!)
    ).toBeInTheDocument();
    const artwork = screen.getAllByRole("img")[0]!;
    fireEvent.click(artwork.closest("button")!);
    expect(container.querySelector("dialog img")).toBeInTheDocument();
    expect(container.querySelector("dialog img")).toHaveAttribute(
      "src",
      expect.stringContaining("bafyfixturegallery/memes-1.png")
    );
  });

  it("keeps a detail page readable when its preview is unavailable", () => {
    const { document, snapshot } = fixture();
    const asset = snapshot.assets[2]!;
    const page = document.payload.pages.find(
      (item) => item.metadata.title === asset.title
    )!;
    render(<CmsSiteRenderer cmsPackage={document} page={page} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      asset.title
    );
    expect(screen.getAllByText(asset.tokenId).length).toBeGreaterThan(0);
    expect(screen.getAllByText(asset.owner).length).toBeGreaterThan(0);
  });

  it("resolves only this document's exact safe page URLs for preview navigation", () => {
    const { document } = fixture();
    const navigate = jest.fn();
    const context = createRendererContext(document, "en-US", navigate);
    render(
      <>
        <CmsLink context={context} href="https://6529.io/example6529/studio">
          Local page
        </CmsLink>
        <CmsLink
          context={context}
          href="https://example.com/example6529/studio"
        >
          External page
        </CmsLink>
        <CmsLink context={context} href="/another-profile/studio">
          Other profile
        </CmsLink>
        <CmsLink context={context} href="/example6529/studio#section">
          Section link
        </CmsLink>
      </>
    );
    const local = screen.getByRole("link", { name: "Local page" });
    fireEvent.click(local);
    expect(navigate).toHaveBeenCalledWith(document.payload.pages[0]!.id);
    navigate.mockClear();
    fireEvent.click(local, { ctrlKey: true });
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "External page" })).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(screen.getByRole("link", { name: "Other profile" })).toHaveAttribute(
      "href",
      "/another-profile/studio"
    );
    expect(screen.getByRole("link", { name: "Section link" })).toHaveAttribute(
      "href",
      "/example6529/studio#section"
    );
  });
});
