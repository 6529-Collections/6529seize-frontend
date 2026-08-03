import { render, screen } from "@testing-library/react";
import MuseumAboutPage from "@/app/museum/network/about/page";
import MuseumProjectPage from "@/app/museum/network/projects/[slug]/page";
import MuseumSourceAndChronologyPage from "@/app/museum/network/stories/source-and-chronology/page";
import { MuseumGiftPage } from "@/components/museum/MuseumGiftPage";
import type { CaseyArtwork } from "@/lib/museum/casey";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { createCaseyFixture } from "../../../lib/museum/publication/fixture";

jest.mock("@/lib/museum/publication/runtime", () => ({
  getMuseumPublicationState: jest.fn(),
}));

const mockedPublicationState = jest.mocked(getMuseumPublicationState);

jest.mock("@/components/museum/MuseumArtworkFigure", () => ({
  MuseumArtworkFigure: ({
    artwork,
    eager = false,
  }: {
    readonly artwork: CaseyArtwork;
    readonly eager?: boolean;
  }) => (
    <div
      data-eager={String(eager)}
      data-object-id={artwork.objectId}
      data-testid="museum-artwork-figure"
    >
      {artwork.title}
    </div>
  ),
}));

async function buildPublication(): Promise<MuseumPublication> {
  const fixture = createCaseyFixture({
    documentOverrides: {
      "records/accessions/6529NM.2026.001/public/gift-into-public-trust.md":
        "# Gift into Public Trust\n\nThe gift enters a public obligation.",
      "records/accessions/6529NM.2026.001/public/projects/century.md":
        "# CENTURY: The Cut That Keeps Happening\n\nThe cut is an operation, not a motif.",
      "records/accessions/6529NM.2026.001/public/source-and-chronology-matrix.md":
        "# Casey Reas: shared source, chronology, and factual-boundary matrix\n\n- **Status:** internal metadata\n\n## 1. How all writing lanes should use this file\n\nInternal instruction.\n\n## 2. Canonical accession facts\n\n| Fact | Source |\n| --- | --- |\n| Artist | Governed record |\n\n## 11. Required omissions to acknowledge in the monograph and collection essay\n\nKnown limits.\n\n## 12. Notes style shared across lanes\n\nInternal style instruction.",
      "docs/open-museum.md":
        "# The record outlives the interface\n\nStatus: working public operating statement; not an adopted governance policy\n\n## An open museum, built in public\n\nThe public record can be inspected, forked, and improved through reviewed contributions.",
      "docs/onchain-transition.md":
        "# From public repository to on-chain Museum record\n\nStatus: working public migration statement; not deployment or activation\nevidence\n\n## The goal\n\nLarge writing and media remain content-addressed while commitments preserve institutional history.",
      "CONTRIBUTING.md":
        "# Contributing\n\nOpen a focused pull request against the canonical Museum repository.",
    },
  });
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
  }).load();
  if (state.status !== "current") {
    throw new Error("test_publication_missing");
  }
  return state.publication;
}

describe("Museum finished publication routes", () => {
  let publication: MuseumPublication;

  beforeAll(async () => {
    publication = await buildPublication();
  });

  beforeEach(() => {
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the governed project essay after its artworks", async () => {
    render(
      await MuseumProjectPage({
        params: Promise.resolve({ slug: "century" }),
      })
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "CENTURY: The Cut That Keeps Happening",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("The cut is an operation, not a motif.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Read the source and chronology matrix",
      })
    ).toHaveAttribute("href", "/museum/network/stories/source-and-chronology");
  });

  it("uses the governed gift narrative as the gift-page publication", async () => {
    render(await MuseumGiftPage({ accessionId: "6529NM.2026.001" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Gift into Public Trust" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("The gift enters a public obligation.")
    ).toBeInTheDocument();
    expect(
      document.getElementById("casey-reas-collection-essay")
    ).toHaveProperty("tagName", "DETAILS");
    const artworkFigures = screen.getAllByTestId("museum-artwork-figure");
    expect(artworkFigures).toHaveLength(7);
    for (const figure of artworkFigures.slice(0, 3)) {
      expect(figure).toHaveAttribute("data-eager", "true");
    }
    for (const figure of artworkFigures.slice(3)) {
      expect(figure).toHaveAttribute("data-eager", "false");
    }
  });

  it("renders the source matrix onsite with an accessible table region", async () => {
    render(await MuseumSourceAndChronologyPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Casey Reas: Sources and chronology",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Known limits.")).toBeInTheDocument();
    expect(screen.queryByText("internal metadata")).not.toBeInTheDocument();
    expect(
      screen.queryByText("How all writing lanes should use this file")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Internal style instruction.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Read the complete canonical source manuscript on GitHub",
      })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/`)
    );
    expect(
      screen.getByRole("region", { name: "Scrollable research table" })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Research with a public source",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The contract is being designed; it has not yet been deployed or activated."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A commitment records identity, schema, hash, URI, authority, effective time, and lineage. Retrieving exact bytes does not establish availability or truth."
      )
    ).toBeInTheDocument();
  });

  it("renders the governed Open Museum statements without adding another H1", async () => {
    render(await MuseumAboutPage());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "The Museum is built in public",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The public record can be inspected, forked, and improved through reviewed contributions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Large writing and media remain content-addressed while commitments preserve institutional history."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The contract is being designed; it has not yet been deployed or activated."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The contract records authorized decisions and claims; it does not make curatorial or governance decisions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Working public operating statement/u)
    ).toHaveLength(1);
    expect(screen.getAllByText(/Working migration statement/u)).toHaveLength(1);
    expect(
      screen.queryByText(/Status: working public operating statement/u)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Status: working public migration statement/u)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "On-chain design" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/docs/onchain-design.md`)
    );
    expect(
      screen.getByRole("link", { name: "Rights and reuse boundary" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/RIGHTS.md`)
    );
  });
});
