import { render, screen } from "@testing-library/react";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";

const SOURCE_PATH =
  "records/accessions/6529NM.2026.001/public/curatorial-accession-review.md";
const SOURCE_COMMIT = "b".repeat(40);

function renderMarkdown(markdown: string, sourcePath = SOURCE_PATH) {
  return render(
    <MuseumMarkdown sourceCommit={SOURCE_COMMIT} sourcePath={sourcePath}>
      {markdown}
    </MuseumMarkdown>
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
      "/museum/network/gifts/6529NM.2026.001#casey-reas-collection-essay"
    );
  });

  it("routes finished gift, project, and source manuscripts onsite", () => {
    renderMarkdown(
      [
        "[Gift](gift-into-public-trust.md)",
        "[Project](projects/century.md)",
        "[Matrix](source-and-chronology-matrix.md)",
      ].join("\n\n")
    );

    expect(screen.getByRole("link", { name: "Gift" })).toHaveAttribute(
      "href",
      "/museum/network/gifts/6529NM.2026.001#gift-narrative-title"
    );
    expect(screen.getByRole("link", { name: "Project" })).toHaveAttribute(
      "href",
      "/museum/network/projects/century#project-essay-title"
    );
    expect(screen.getByRole("link", { name: "Matrix" })).toHaveAttribute(
      "href",
      "/museum/network/stories/source-and-chronology"
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

  it("keeps safe accession-relative citations on the immutable source commit", () => {
    renderMarkdown("[Object record](../objects/6529NM.2026.001.01.json)");

    expect(screen.getByRole("link", { name: "Object record" })).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json`
    );
  });

  it("renders repository citations as inert text for an invalid source commit", () => {
    render(
      <MuseumMarkdown sourceCommit={null} sourcePath={SOURCE_PATH}>
        [Object record](../objects/6529NM.2026.001.01.json)
      </MuseumMarkdown>
    );

    expect(screen.getByText("Object record")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Object record" })
    ).not.toBeInTheDocument();
  });

  it("contains wide tables in a keyboard-focusable region", () => {
    renderMarkdown("| Fact | Source |\n| --- | --- |\n| Date | Record |");

    const region = screen.getByRole("region", {
      name: "Scrollable research table",
    });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Fact" })).toHaveAttribute(
      "scope",
      "col"
    );
  });

  it("renders protocol-relative URLs as inert text", () => {
    renderMarkdown("[Protocol relative](//example.com/source)");

    expect(screen.getByText("Protocol relative")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Protocol relative" })
    ).not.toBeInTheDocument();
  });
});
