import { render, screen } from "@testing-library/react";
import { MuseumArtworkFigure } from "@/components/museum/MuseumArtworkFigure";
import type { CaseyArtwork } from "@/lib/museum/casey";

const artwork: CaseyArtwork = {
  objectId: "6529NM.2026.001.01",
  title: "Work One",
  project: "Project One",
  projectSlug: "project-one",
  year: 2026,
  medium: "Generative work",
  caip19: "eip155:1/erc721:0xabc/1",
  imageUrl: "https://media.6529.io/work-one.png",
  generatorUrl: "https://generator.6529.io/work-one",
  visualDescription: "A governed artwork image.",
  observedImageSha256: "sha256:test",
  creditLine: "Artist name, Work One.",
  rightsLabel: "CC BY 4.0",
  rightsExpressionId: "cc-by-4.0",
  rightsUrl: "/museum/network/research/rights/cc-by-4.0",
  status: "accessioned",
  mediaRetention: "upstream_not_retained",
};

describe("MuseumArtworkFigure", () => {
  it("gives the Work link a WCAG-sized interactive target", () => {
    render(
      <MuseumArtworkFigure
        artwork={artwork}
        href="/museum/network/works/6529NM-W-0001"
      />
    );

    const link = screen.getByRole("link", { name: "View work: Work One" });
    expect(link).toHaveClass("tw-min-h-11");
    expect(link).not.toHaveClass("tw-min-h-6");
  });
});
