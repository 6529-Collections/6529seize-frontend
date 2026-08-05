import { render, screen } from "@testing-library/react";
import {
  MuseumRightsDirectory,
  MuseumRightsExpressionPage,
  MuseumRightsGuideCards,
} from "@/components/museum/MuseumRightsReadingRoom";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { createCaseyFixture } from "../../lib/museum/publication/fixture";

async function buildPublication(): Promise<MuseumPublication> {
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: createCaseyFixture().fetch,
  }).load();
  if (state.status !== "current") {
    throw new Error("test_publication_missing");
  }
  return state.publication;
}

describe("Museum rights reading room", () => {
  let publication: MuseumPublication;

  beforeAll(async () => {
    publication = await buildPublication();
  });

  it("presents both audience guides and the complete closed directory", () => {
    const { rerender } = render(
      <MuseumRightsGuideCards handbook={publication.rightsHandbook} />
    );
    const guideLinks = screen.getAllByRole("link", { name: "Read the guide" });
    expect(guideLinks).toHaveLength(2);
    expect(guideLinks[0]).toHaveAttribute(
      "href",
      "/museum/network/rights/artists"
    );

    rerender(<MuseumRightsDirectory handbook={publication.rightsHandbook} />);
    expect(
      screen.getAllByRole("link", { name: "Read this rights entry" })
    ).toHaveLength(22);
    expect(
      screen.getByRole("heading", { name: "Creative Commons licenses" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Cultural-heritage rights statements",
      })
    ).toBeVisible();
  });

  it("separates the practical reading from the exact retained legal code", () => {
    const expression = publication.rightsHandbook.expressions.find(
      ({ id }) => id === "cc-by-nc-4.0"
    );
    if (expression === undefined) {
      throw new Error("test_rights_expression_missing");
    }

    const { container } = render(
      <MuseumRightsExpressionPage
        expression={expression}
        handbook={publication.rightsHandbook}
        sourceCommit={publication.identity.commit}
      />
    );
    expect(
      screen.getByRole("heading", { level: 1, name: expression.label })
    ).toBeVisible();
    expect(screen.getByText("Uses at a glance")).toBeVisible();
    expect(
      screen.getByText("Make preservation copies", { exact: true })
    ).toBeVisible();
    expect(container.querySelectorAll("dl > div")).toHaveLength(6);
    expect(
      screen.getByText("Exact English legal code", { exact: true })
    ).toBeVisible();
    const legalCode = container.querySelector("details pre");
    expect(legalCode).toHaveTextContent("Exact official fixture text");
    expect(legalCode).not.toHaveClass("tw-overflow-auto");
    expect(
      screen.getByRole("link", { name: "Open the pinned source snapshot" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/docs/rights/legal-texts/cc-by-nc-4.0.txt")
    );
  });
});
