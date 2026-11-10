import { renderToStaticMarkup } from "react-dom/server";

import {
  CmsInspectableArtwork,
  type CmsArtInspectionItem,
  type CmsArtInspectorLabels,
} from "@/components/profile-cms/CmsArtLightbox";

const labels: CmsArtInspectorLabels = {
  inspect: "Inspect",
  close: "Close",
  previous: "Previous",
  next: "Next",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetZoom: "Reset zoom",
  fullscreen: "Full screen",
  showMetadata: "Show details",
  hideMetadata: "Hide details",
  metadataTitle: "Details",
};

const renderWithBackground = (background: string) => {
  const item: CmsArtInspectionItem = {
    id: "art",
    title: "Artwork",
    src: "https://media.6529.io/ipfs/bafy/art.png",
    alt: "Artwork",
    background,
    metadata: [],
  };
  return renderToStaticMarkup(
    <CmsInspectableArtwork item={item} labels={labels} />
  );
};

describe("CMS artwork matte colour", () => {
  it("applies a plain colour from the site content", () => {
    expect(renderWithBackground("#f2eacb")).toContain("background:#f2eacb");
  });

  it.each([
    "#f2eacb;position:fixed;inset:0",
    "url(https://tracker.example/pixel.png)",
    "var(--cms-colorway-paper)",
  ])("ignores %s", (background) => {
    const markup = renderWithBackground(background);
    expect(markup).not.toContain("background:");
    expect(markup).not.toContain("position:fixed");
    expect(markup).not.toContain("tracker.example");
  });
});
