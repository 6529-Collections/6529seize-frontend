import { render, screen } from "@testing-library/react";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";

const SOURCE_PATH =
  "records/accessions/6529NM.2026.001/public/curatorial-accession-review.md";
const SOURCE_COMMIT = "b".repeat(40);

function renderMarkdown(
  markdown: string,
  sourcePath = SOURCE_PATH,
  workHrefs: Readonly<Record<string, string>> = {
    "6529NM.2026.001.01": "/museum/network/works/6529NM-W-0001",
  }
) {
  return render(
    <MuseumMarkdown
      sourceCommit={SOURCE_COMMIT}
      sourcePath={sourcePath}
      workHrefs={workHrefs}
    >
      {markdown}
    </MuseumMarkdown>
  );
}

describe("MuseumMarkdown public links", () => {
  it("routes a relative Casey object document to its public object page", () => {
    renderMarkdown("[Object](6529NM.2026.001.01.md)");

    expect(screen.getByRole("link", { name: "Object" })).toHaveAttribute(
      "href",
      "/museum/network/works/6529NM-W-0001"
    );
  });

  it("routes a program work manuscript to its canonical Work page", () => {
    renderMarkdown(
      "[Next work](sina-beizavi-in-brazil.md)",
      "records/programs/6529NM-AP-01/public/works/take-the-key.md",
      {
        "records/programs/6529NM-AP-01/public/works/sina-beizavi-in-brazil.md":
          "/museum/network/works/6529NM-W-0009",
      }
    );

    expect(screen.getByRole("link", { name: "Next work" })).toHaveAttribute(
      "href",
      "/museum/network/works/6529NM-W-0009"
    );
  });

  it("does not manufacture a Work route when the canonical join is absent", () => {
    renderMarkdown("[Object](6529NM.2026.001.01.md)", SOURCE_PATH, {});

    expect(screen.getByRole("link", { name: "Object" })).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md`
    );
  });

  it("routes the collection essay to the gift essay section", () => {
    renderMarkdown("[Gift essay](casey-reas-collection-essay.md)");

    expect(screen.getByRole("link", { name: "Gift essay" })).toHaveAttribute(
      "href",
      "/museum/network/acquisitions/the-system-in-seven-states#casey-reas-collection-essay"
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
      "/museum/network/acquisitions/the-system-in-seven-states#gift-narrative-title"
    );
    expect(screen.getByRole("link", { name: "Project" })).toHaveAttribute(
      "href",
      "/museum/network/projects/century#project-essay-title"
    );
    expect(screen.getByRole("link", { name: "Matrix" })).toHaveAttribute(
      "href",
      "/museum/network/research/sources-and-chronology"
    );
  });

  it("uses the shared Casey dossier anchor for institutional documents", () => {
    renderMarkdown("[Certificate](accession-certificate.md)");

    expect(screen.getByRole("link", { name: "Certificate" })).toHaveAttribute(
      "href",
      "/museum/network/acquisitions/the-system-in-seven-states#accession-certificate"
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
    expect(screen.getByRole("table")).toHaveClass("tw-table-fixed");
    expect(screen.getAllByText("Fact")[1]).toHaveClass("lg:tw-hidden");
  });

  it("stacks table cells with their source headers on narrow screens", () => {
    renderMarkdown(
      "| Field | Value | Note |\n| --- | --- | --- |\n| Status | Selected | No token yet |"
    );

    expect(screen.getByRole("table")).toHaveClass("tw-block");
    expect(screen.getAllByText("Field")).toHaveLength(2);
    expect(screen.getAllByText("Value")).toHaveLength(2);
    expect(screen.getAllByText("Note")).toHaveLength(2);
  });

  it("wraps long inline identifiers only at safe mobile break points", () => {
    const exactIdentifier =
      "eip155:1/erc721:0x1234567890abcdef1234567890abcdef12345678/1234567890";
    renderMarkdown(`\`${exactIdentifier}\`\n\n\`\`\`text\nexact line\n\`\`\``);

    const codeNodes = screen.getAllByText(/eip155|exact line/u);
    const inlineCode = codeNodes[0]!;
    const blockCode = codeNodes[1]!;
    expect(inlineCode).toHaveClass(
      "tw-inline-block",
      "tw-max-w-full",
      "tw-whitespace-normal",
      "sm:tw-overflow-x-auto",
      "sm:tw-whitespace-nowrap"
    );
    expect(inlineCode).not.toHaveClass("tw-break-all");
    expect(inlineCode).toHaveTextContent(exactIdentifier);
    expect(inlineCode.querySelectorAll("wbr").length).toBeGreaterThan(5);
    expect(blockCode).not.toHaveClass("tw-break-all");
  });

  it("preserves uppercase hexadecimal prefixes byte for byte", () => {
    const exactIdentifier = `0X${"ABCDEF12".repeat(4)}`;
    const { container } = renderMarkdown(`\`${exactIdentifier}\``);

    expect(container.querySelector("code")?.textContent).toBe(exactIdentifier);
  });

  it("presents an unusually long research manuscript as open editorial text", () => {
    const longRecord = `# Long record\n\n${"Complete source paragraph. ".repeat(1_400)}`;

    renderMarkdown(longRecord);

    expect(
      screen.queryByText("Read the complete research manuscript")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Complete source paragraph\./u)
    ).toBeInTheDocument();
  });

  it("does not add a disclosure to ordinary-length Markdown", () => {
    renderMarkdown("# Short record\n\nA concise source record.");

    expect(
      screen.queryByText("Read the complete research manuscript")
    ).not.toBeInTheDocument();
  });

  it("renders protocol-relative URLs as inert text", () => {
    renderMarkdown("[Protocol relative](//example.com/source)");

    expect(screen.getByText("Protocol relative")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Protocol relative" })
    ).not.toBeInTheDocument();
  });

  it("keeps arbitrary Markdown images inert", () => {
    renderMarkdown("![Unapproved source](https://example.com/source.jpg)");

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText("Media omitted from the record view: Unapproved source.")
    ).toBeInTheDocument();
  });

  it("routes the closed institutional-practice package onsite", () => {
    renderMarkdown(
      [
        "[Met](profiles/met.md)",
        "[HEK](profiles/hek-basel.md)",
        "[Adjacent](adjacent-chain-native-practice.md)",
        "[Sources](source-register.md)",
        "[Inventory](../../docs/institutional-source-inventory.json)",
        "[Standard](../../docs/curatorial-publication-standard.md)",
      ].join("\n\n"),
      "records/institutional-practice/a-field-of-practice.md"
    );

    expect(screen.getByRole("link", { name: "Met" })).toHaveAttribute(
      "href",
      "/museum/network/research/institutional-practice/met"
    );
    expect(screen.getByRole("link", { name: "Sources" })).toHaveAttribute(
      "href",
      "/museum/network/research/institutional-practice/sources"
    );
    expect(screen.getByRole("link", { name: "HEK" })).toHaveAttribute(
      "href",
      "/museum/network/research/institutional-practice/hek-basel"
    );
    expect(screen.getByRole("link", { name: "Adjacent" })).toHaveAttribute(
      "href",
      "/museum/network/research/institutional-practice/adjacent-practice"
    );
    expect(screen.getByRole("link", { name: "Standard" })).toHaveAttribute(
      "href",
      "/museum/network/research/scholarship-and-writing"
    );
    expect(screen.getByRole("link", { name: "Inventory" })).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/docs/institutional-source-inventory.json`
    );
  });

  it("keeps the public editorial standard connected to its study and contribution source", () => {
    renderMarkdown(
      "[Study](../records/institutional-practice/a-field-of-practice.md)\n\n[Contribute](../CONTRIBUTING.md)",
      "docs/curatorial-publication-standard.md"
    );

    expect(screen.getByRole("link", { name: "Study" })).toHaveAttribute(
      "href",
      "/museum/network/research/institutional-practice"
    );
    expect(screen.getByRole("link", { name: "Contribute" })).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/CONTRIBUTING.md`
    );
  });

  it("does not route an institutional filename collision onsite", () => {
    renderMarkdown(
      "[Collision](profiles/archive/century.md)",
      "records/institutional-practice/a-field-of-practice.md"
    );

    expect(screen.getByRole("link", { name: "Collision" })).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${SOURCE_COMMIT}/records/institutional-practice/profiles/archive/century.md`
    );
  });

  it("retains source heading levels for a standalone manuscript", () => {
    render(
      <MuseumMarkdown
        documentHeadings
        sourceCommit={SOURCE_COMMIT}
        sourcePath="records/institutional-practice/profiles/met.md"
      >
        {"## Demonstrated practices\n\n### Object records"}
      </MuseumMarkdown>
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Demonstrated practices" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Object records" })
    ).toBeInTheDocument();
  });

  it("demotes a manuscript body level-one heading", () => {
    render(
      <MuseumMarkdown
        documentHeadings
        sourceCommit={SOURCE_COMMIT}
        sourcePath="records/institutional-practice/profiles/met.md"
      >
        {"# Body title"}
      </MuseumMarkdown>
    );

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Body title" })
    ).toBeInTheDocument();
  });

  it("nests manuscript headings beneath an editorial section heading", () => {
    render(
      <MuseumMarkdown
        documentHeadings
        nestedDocumentHeadings
        sourceCommit={SOURCE_COMMIT}
        sourcePath="records/institutional-practice/profiles/met.md"
      >
        {"## Demonstrated practices\n\n### Object records"}
      </MuseumMarkdown>
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Demonstrated practices" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: "Object records" })
    ).toBeInTheDocument();
  });
});
