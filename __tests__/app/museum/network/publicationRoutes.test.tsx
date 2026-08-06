jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { render, screen } from "@testing-library/react";
import MuseumAboutPage from "@/app/museum/network/about/page";
import MuseumNetworkPage from "@/app/museum/network/page";
import MuseumProjectPage from "@/app/museum/network/projects/[slug]/page";
import MuseumGenerativeSystemPage from "@/app/museum/network/projects/[slug]/system/page";
import MuseumSourceAndChronologyPage from "@/app/museum/network/stories/source-and-chronology/page";
import { MuseumGiftPage } from "@/components/museum/MuseumGiftPage";
import type { CaseyArtwork } from "@/lib/museum/casey";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { MUSEUM_SAFE_ETHERSCAN_URL } from "@/lib/museum/types";
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
        "# Casey Reas: Sources and chronology\n\n- **Status:** internal metadata\n\n## 1. How all writing lanes should use this file\n\nInternal instruction.\n\n## 2. Canonical accession facts\n\n| Fact | Source |\n| --- | --- |\n| Artist | Governed record |\n\n## 11. Required omissions to acknowledge in the monograph and collection essay\n\nKnown limits.\n\n## 12. Notes style shared across lanes\n\nInternal style instruction.",
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
        "The 6529 Network Museum is the public art museum of the 6529 Network: a permanent collection of digital art, governed through TDH, held by the Network on Ethereum, and open to anyone."
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

      expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
        'unique "key"'
      );
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
    expect(
      screen.getByRole("region", { name: "Scrollable research table" })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "Research with a public source",
      })
    ).not.toBeInTheDocument();
  });

  it("presents the Network Museum proposition with honest present-state boundaries", async () => {
    const { container } = render(await MuseumAboutPage());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A public museum for a network state",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The 6529 Network is building a decentralized network state. The Museum is one of its first public institutions: a permanent collection of digital art held by the Network on Ethereum, governed through TDH, and open online to anyone in the world."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "The Museum of the Network",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "The Museum today" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "It is meaningfully network-governed, but not yet fully decentralized. Governance outcomes are not yet canonical on-chain institutional records. Repository maintainers publish the current record, and Museum Safe signers execute Ethereum transactions."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Decision-constrained custody",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Permanence" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Permanence requires more than token ownership/u)
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
