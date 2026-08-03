import { render, screen } from "@testing-library/react";
import MuseumProjectPage from "@/app/museum/network/projects/[slug]/page";
import MuseumSourceAndChronologyPage from "@/app/museum/network/stories/source-and-chronology/page";
import { MuseumGiftPage } from "@/components/museum/MuseumGiftPage";
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

async function buildPublication(): Promise<MuseumPublication> {
  const fixture = createCaseyFixture({
    documentOverrides: {
      "records/accessions/6529NM.2026.001/public/gift-into-public-trust.md":
        "# Gift into Public Trust\n\nThe gift enters a public obligation.",
      "records/accessions/6529NM.2026.001/public/projects/century.md":
        "# CENTURY: The Cut That Keeps Happening\n\nThe cut is an operation, not a motif.",
      "records/accessions/6529NM.2026.001/public/source-and-chronology-matrix.md":
        "# Casey Reas: shared source, chronology, and factual-boundary matrix\n\n| Fact | Source |\n| --- | --- |\n| Artist | Governed record |",
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
  });

  it("renders the source matrix onsite with an accessible table region", async () => {
    render(await MuseumSourceAndChronologyPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Casey Reas: shared source, chronology, and factual-boundary matrix",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Scrollable research table" })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
