jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { render, screen } from "@testing-library/react";
import MuseumAboutPage from "@/app/museum/network/about/page";
import MuseumNetworkPage from "@/app/museum/network/page";
import MuseumProjectPage from "@/app/museum/network/projects/[slug]/page";
import MuseumGenerativeSystemPage from "@/app/museum/network/projects/[slug]/system/page";
import { renderMuseumRightsPage } from "@/app/museum/network/rights/page";
import MuseumSourceAndChronologyPage from "@/app/museum/network/research/sources-and-chronology/page";
import { MuseumGiftPage } from "@/components/museum/MuseumGiftPage";
import type { CaseyArtwork } from "@/lib/museum/casey";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";
import { MUSEUM_SAFE_ETHERSCAN_URL } from "@/lib/museum/types";
import { createCaseyFixture } from "../../../lib/museum/publication/fixture";

jest.mock("@/lib/museum/publication/runtime", () => ({
  getMuseumPublicationState: jest.fn(),
}));

jest.mock("@/lib/museum/publication/runtimeBundle", () => ({
  getMuseumPublicationBundle: jest.fn(),
}));

const mockedPublicationState = jest.mocked(getMuseumPublicationState);
const mockedBundle = jest.mocked(getMuseumPublicationBundle);

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
        "# Casey Reas: Sources and chronology\n\n- **Status:** internal metadata\n\n## 1. How all writing lanes should use this file\n\nInternal instruction.\n\n## 2. Canonical accession facts\n\n| Fact | Source |\n| --- | --- |\n| Artist | Governed record |\n\n## 6. Chronology of life, practice, tools, and institutions\n\nThe chronology records dates and published evidence.\n\n## 9. Conflicts, naming problems, and distinctions to preserve\n\n### 9.1 Phototaxis date\n\nThe project date follows the accession record.\n\n### 9.2 923 versus 924\n\nThe Museum distinguishes the project title from its edition count.\n\n### 9.7 Artist name typography\n\nThe artist's preferred styling is preserved.\n\n### 9.9 Token, artwork, image, code\n\nThese terms identify different parts of the work.\n\n## 11. Required omissions to acknowledge in the monograph and collection essay\n\nKnown limits.\n\n## 12. Notes style shared across lanes\n\nInternal style instruction.",
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
    const publicationState = {
      status: "current",
      publication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    } as const;
    mockedPublicationState.mockResolvedValue(publicationState);
    mockedBundle.mockResolvedValue({ publicationState, view: null });
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
    ).toHaveAttribute(
      "href",
      "/museum/network/research/sources-and-chronology"
    );
    expect(
      screen.getByRole("link", { name: "Enter the system" })
    ).toHaveAttribute("href", "/museum/network/projects/century/system");
  });

  it("publishes a project-owned system study with a complete map", async () => {
    render(
      await MuseumGenerativeSystemPage({
        params: Promise.resolve({ slug: "pre-process" }),
      })
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Pre-Process" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Complete 120-position lattice",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("grid", {
        name: /Complete Surface by Origin by Growth lattice/u,
      })
    ).toHaveAttribute("aria-rowcount", "8");
    expect(
      screen.getByRole("heading", { level: 3, name: "Pre-Process #63" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Museum model · held conditions").length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "How the system makes the work",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Scope and open questions",
      })
    ).toBeInTheDocument();
  });

  it("presents one Network Museum proposition before the art-led homepage", async () => {
    render(await MuseumNetworkPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A public museum for a network state",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The 6529 Network Museum is the public art museum of the 6529 Network. Its permanent Collection brings together digital art and photography held by the Network on Ethereum."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Held by the 6529 Network")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Seven works by Casey Reas",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Explore the collection",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "How the Network Museum works" })
    ).toHaveAttribute("href", "/museum/network/about");
    expect(screen.getByRole("link", { name: "Museum Safe" })).toHaveAttribute(
      "href",
      MUSEUM_SAFE_ETHERSCAN_URL
    );
    expect(screen.getAllByTestId("museum-artwork-figure")).toHaveLength(7);
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
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Five projects, seven works",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /CENTURY.*Explore the system/su })
    ).toHaveAttribute("href", "/museum/network/projects/century/system");
  });

  it("renders the gift dossier slots without React list-key warnings", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      render(await MuseumGiftPage({ accessionId: "6529NM.2026.001" }));

      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
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
    expect(
      screen.getAllByText(
        "The chronology records dates and published evidence."
      )
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("heading", { level: 4, name: "9.1 Phototaxis date" })
    ).toHaveLength(2);
    expect(
      screen.getAllByText("The project date follows the accession record.")
    ).toHaveLength(2);
    expect(
      screen.getAllByText("These terms identify different parts of the work.")
    ).toHaveLength(2);
    expect(screen.queryByText("internal metadata")).not.toBeInTheDocument();
    expect(
      screen.queryByText("How all writing lanes should use this file")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Internal style instruction.")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Read the complete research manuscript",
      })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/`)
    );
    const tableRegions = screen.getAllByRole("region", {
      name: "Scrollable research table",
    });
    expect(tableRegions).toHaveLength(2);
    for (const region of tableRegions) {
      expect(region).toHaveAttribute("tabindex", "0");
    }
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Research with a public source",
      })
    ).not.toBeInTheDocument();
  });

  it("opens the complete source record when a selected heading drifts", async () => {
    const driftedPublication: MuseumPublication = {
      ...publication,
      documents: publication.documents.map((document) =>
        document.kind === "source_chronology_matrix"
          ? {
              ...document,
              markdown: document.markdown.replace(
                "## 9. Conflicts, naming problems, and distinctions to preserve",
                "## 9. A heading retained only in the source record"
              ),
            }
          : document
      ),
    };
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication: driftedPublication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });

    render(await MuseumSourceAndChronologyPage());

    expect(screen.getByText("Known limits.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Open the complete source and chronology record",
      })
    ).toBeInTheDocument();
    expect(document.getElementById("complete-research-record")).toHaveAttribute(
      "open"
    );
    expect(
      screen.queryByText("The project date follows the accession record.")
    ).toBeInTheDocument();
  });

  it("opens the complete rights guide when its selected headings drift", async () => {
    const driftedPublication: MuseumPublication = {
      ...publication,
      rightsHandbook: {
        ...publication.rightsHandbook,
        introduction: {
          ...publication.rightsHandbook.introduction,
          markdown: publication.rightsHandbook.introduction.markdown.replace(
            "## Buying the artwork usually does not buy its copyright",
            "## Copyright heading retained only in the source"
          ),
        },
      },
    };
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication: driftedPublication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });

    render(await renderMuseumRightsPage());

    expect(screen.getByText("Governed public guide.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Read the complete guide",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Browse rights and license terms",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "The Museum publication is temporarily unavailable",
      })
    ).not.toBeInTheDocument();
  });

  it("presents the Network Museum proposition with honest present-state boundaries", async () => {
    const { container } = render(await MuseumAboutPage());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The 6529 Network Museum",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The 6529 Network Museum is a permanent collection of digital art held for the benefit of the 6529 Network and the public. It collects, preserves, studies, and shares art from the history of internet-native culture."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Collection and acquisition",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Scholarship and interpretation",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The 6529 Network holds the Collection for the public commons. Museum governance, rights, provenance, and preservation records explain how that responsibility is carried out."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "A museum open to the public",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "How the Museum works" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Long-term care joins Ethereum state/u)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Founding record" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/policies/`)
    );
    expect(
      screen.getByRole("link", { name: "Open Museum statement" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/docs/`)
    );
    expect(
      screen.getByRole("link", { name: "On-chain transition" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/docs/`)
    );
    expect(screen.queryByText(/The Fall 2026 goal/u)).not.toBeInTheDocument();
    const proseParagraphs = Array.from(container.querySelectorAll("p")).filter(
      (paragraph) => !paragraph.classList.contains("tw-uppercase")
    );
    expect(proseParagraphs).not.toHaveLength(0);
    for (const paragraph of proseParagraphs) {
      expect(paragraph).not.toHaveClass("tw-font-semibold");
      expect(paragraph.querySelector("strong, b")).toBeNull();
    }
  });
});
