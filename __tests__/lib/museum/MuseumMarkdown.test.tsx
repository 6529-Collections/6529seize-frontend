import { render, screen } from "@testing-library/react";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";

const SOURCE_PATH =
  "records/accessions/6529NM.2026.001/public/curatorial-accession-review.md";

function renderMarkdown(markdown: string) {
  return render(
    <MuseumMarkdown sourcePath={SOURCE_PATH}>{markdown}</MuseumMarkdown>
  );
}

describe("MuseumMarkdown public links", () => {
  it("routes a relative Casey object document to its public object page", () => {
    renderMarkdown("[Object](6529NM.2026.001.01.md)");

    expect(screen.getByRole("link", { name: "Object" })).toHaveAttribute(
      "href",
      "/museum/network/collection/6529NM.2026.001.01"
    );
  });

  it("routes the collection essay to the gift essay section", () => {
    renderMarkdown("[Gift essay](casey-reas-collection-essay.md)");

    expect(screen.getByRole("link", { name: "Gift essay" })).toHaveAttribute(
      "href",
      "/museum/network/gifts/6529NM.2026.001#gift-essay-title"
    );
  });

  it("uses the shared Casey dossier anchor for institutional documents", () => {
    renderMarkdown("[Certificate](accession-certificate.md)");

    expect(screen.getByRole("link", { name: "Certificate" })).toHaveAttribute(
      "href",
      "/museum/network/gifts/6529NM.2026.001#accession-certificate"
    );
  });

  it("keeps an external HTTPS link isolated in a new browsing context", () => {
    renderMarkdown("[Source](https://example.com/source)");

    const link = screen.getByRole("link", { name: "Source" });
    expect(link).toHaveAttribute("href", "https://example.com/source");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders traversal links as inert text", () => {
    renderMarkdown("[Traversal](../../../../private/secret.md)");

    expect(screen.getByText("Traversal")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Traversal" })
    ).not.toBeInTheDocument();
  });

  it("renders protocol-relative URLs as inert text", () => {
    renderMarkdown("[Protocol relative](//example.com/source)");

    expect(screen.getByText("Protocol relative")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Protocol relative" })
    ).not.toBeInTheDocument();
  });
});
