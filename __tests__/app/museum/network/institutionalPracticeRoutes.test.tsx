import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import MuseumInstitutionProfilePage, {
  generateMetadata,
} from "@/app/museum/network/stories/a-field-of-practice/[slug]/page";
import MuseumInstitutionalPracticePage from "@/app/museum/network/stories/a-field-of-practice/page";
import MuseumInstitutionalPracticeSourcesPage from "@/app/museum/network/stories/a-field-of-practice/sources/page";
import MuseumStoriesPage from "@/app/museum/network/stories/page";
import { projectInstitutionalPracticeManuscript } from "@/components/museum/InstitutionalPracticeReadingRoom";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
  type MuseumPublicDocument,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { createCaseyFixture } from "../../../lib/museum/publication/fixture";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("not_found");
  }),
}));

jest.mock("@/lib/museum/publication/runtime", () => ({
  getMuseumPublicationState: jest.fn(),
}));

jest.mock("@/components/museum/MuseumArtworkFigure", () => ({
  MuseumArtworkFigure: ({
    artwork,
  }: {
    readonly artwork: { title: string };
  }) => <div data-testid="museum-artwork-figure">{artwork.title}</div>,
}));

const mockedPublicationState = jest.mocked(getMuseumPublicationState);
const mockedNotFound = jest.mocked(notFound);

function studyMarkdown(): string {
  return `# A field of practice

- **Subtitle:** Institutions the 6529 Network Museum studies
- **Status:** public scholarship
- **Institutional author:** 6529 Network Museum
- **Version:** 1.0.1
- **Publication date:** 2026-08-04
- **Research cutoff:** 2026-08-04

The study begins with the practical questions of collection research and care.

## What we looked for

Public records, archives, conservation studies, datasets, commissions, and tools.

## Institutions in this study

- [The Metropolitan Museum of Art](profiles/met.md)

The [source register](source-register.md) records the evidence. The [curatorial publication standard](../../docs/curatorial-publication-standard.md) governs Museum scholarship.`;
}

function profileMarkdown(title: string): string {
  return `# ${title}

- **Series:** A field of practice
- **Status:** public scholarship
- **Institutional author:** 6529 Network Museum
- **Version:** 1.0.1
- **Publication date:** 2026-08-04
- **Research cutoff:** 2026-08-04
- **Research apparatus:** [primary-source register](../source-register.md)

## Institutional profile

The public record joins scholarship to evidence.

## Demonstrated practices

### 1. The object record is a doorway

The catalogue connects object identity to research.

## What the 6529 Network Museum should adopt

Publish the evidence behind each institutional claim.

## Where the analogy ends

Scale, remit, and infrastructure determine what can be transferred.`;
}

function sourceRegisterMarkdown(): string {
  return `# Source register: A field of practice

- **Status:** public research register
- **Institutional author:** 6529 Network Museum
- **Version:** 1.0.1
- **Publication date:** 2026-08-04
- **Access date for all web sources:** 2026-08-04

This register binds the study to primary institutional evidence.

## The Metropolitan Museum of Art

| Exact source | Source type | Evidence used |
| --- | --- | --- |
| [Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) | Data policy | Public reuse terms. |`;
}

function withVisitorManuscripts(
  publication: MuseumPublication
): MuseumPublication {
  const practice = publication.institutionalPractice;
  const introduction: MuseumPublicDocument = {
    ...practice.introduction,
    markdown: studyMarkdown(),
  };
  const profiles = practice.profiles.map((profile) => ({
    ...profile,
    document: {
      ...profile.document,
      markdown: profileMarkdown(profile.document.title),
    },
  }));
  const sourceRegister: MuseumPublicDocument = {
    ...practice.sourceRegister,
    markdown: sourceRegisterMarkdown(),
  };
  const replacements = new Map(
    [
      introduction,
      ...profiles.map((profile) => profile.document),
      sourceRegister,
    ].map((document) => [document.id, document])
  );

  return {
    ...publication,
    documents: publication.documents.map(
      (document) => replacements.get(document.id) ?? document
    ),
    institutionalPractice: {
      ...practice,
      introduction,
      profiles,
      sourceRegister,
    },
  };
}

async function buildPublication(): Promise<MuseumPublication> {
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: createCaseyFixture().fetch,
  }).load();
  if (state.status !== "current") {
    throw new Error("test_publication_missing");
  }
  return withVisitorManuscripts(state.publication);
}

describe("Museum institutional-practice reading room", () => {
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

  it("keeps the Casey feature first and follows it with the numbered directory", async () => {
    render(await MuseumStoriesPage());

    const collectionEssayTitle = publication.documents.find(
      (document) => document.kind === "collection_essay"
    )?.title;
    if (collectionEssayTitle === undefined) {
      throw new Error("test_collection_essay_missing");
    }
    const caseyHeading = screen.getByRole("heading", {
      level: 2,
      name: collectionEssayTitle,
    });
    const studyHeading = screen.getByRole("heading", {
      level: 2,
      name: "A field of practice",
    });
    expect(
      caseyHeading.compareDocumentPosition(studyHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    const profileLinks = screen
      .getAllByRole("link")
      .filter((link) =>
        link
          .getAttribute("href")
          ?.startsWith("/museum/network/stories/a-field-of-practice/")
      )
      .filter(
        (link) =>
          link.getAttribute("href") !==
          "/museum/network/stories/a-field-of-practice/sources"
      );
    expect(profileLinks).toHaveLength(14);
    expect(profileLinks[0]).toHaveTextContent("01");
    expect(profileLinks[13]).toHaveTextContent("14");
  });

  it("renders the comparative study as one governed document hierarchy", async () => {
    render(await MuseumInstitutionalPracticePage());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "A field of practice" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "What we looked for" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Institutions the 6529 Network Museum studies")
    ).toBeInTheDocument();
    expect(screen.getByText("Published August 4, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "The Metropolitan Museum of Art" })
    ).toHaveAttribute(
      "href",
      "/museum/network/stories/a-field-of-practice/met"
    );
    expect(
      screen.getByRole("link", { name: "curatorial publication standard" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${"a".repeat(40)}/docs/curatorial-publication-standard.md`
    );
  });

  it("renders a profile with its analysis, metadata, and sequence", async () => {
    render(
      await MuseumInstitutionProfilePage({
        params: Promise.resolve({ slug: "met" }),
      })
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The Metropolitan Museum of Art",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Institutional profile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What the 6529 Network Museum should adopt",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Where the analogy ends" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("primary-source register")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read the primary-source register" })
    ).toHaveAttribute(
      "href",
      "/museum/network/stories/a-field-of-practice/sources"
    );
    expect(
      screen.getByRole("link", { name: "Next profile Getty" })
    ).toHaveAttribute(
      "href",
      "/museum/network/stories/a-field-of-practice/getty"
    );
  });

  it("uses the governed profile title in page metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "centre-pompidou" }),
    });

    expect(metadata.title).toBe("Centre Pompidou");
  });

  it("renders the source register with accessible wide-table containment", async () => {
    render(await MuseumInstitutionalPracticeSourcesPage());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Source register: A field of practice",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Scrollable research table" })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("link", { name: "Open Access" })).toHaveAttribute(
      "target",
      "_blank"
    );
  });

  it("returns a 404 for an unknown profile slug", async () => {
    await expect(
      MuseumInstitutionProfilePage({
        params: Promise.resolve({ slug: "not-a-profile" }),
      })
    ).rejects.toThrow("not_found");
    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the institutional aggregate is incomplete", async () => {
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication: {
        ...publication,
        institutionalPractice: {
          ...publication.institutionalPractice,
          profiles: publication.institutionalPractice.profiles.slice(0, 13),
        },
      },
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });

    render(await MuseumInstitutionalPracticePage());

    expect(
      screen.getByRole("heading", {
        name: "The Museum publication is temporarily unavailable",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "A field of practice" })
    ).not.toBeInTheDocument();
  });

  it("fails closed when a legacy publication lacks the institutional aggregate", async () => {
    mockedPublicationState.mockResolvedValue({
      status: "current",
      publication: {
        ...publication,
        institutionalPractice: undefined,
      } as unknown as MuseumPublication,
      errorCode: null,
      failedAt: null,
      lastValidAcceptedAt: null,
    });

    render(await MuseumInstitutionalPracticePage());

    expect(
      screen.getByRole("heading", {
        name: "The Museum publication is temporarily unavailable",
      })
    ).toBeInTheDocument();
  });

  it("rejects a manuscript with two competing research dates", () => {
    const ambiguous = profileMarkdown("Tate").replace(
      "- **Research cutoff:** 2026-08-04",
      "- **Research cutoff:** 2026-08-04\n- **Access date for all web sources:** 2026-08-04"
    );

    expect(projectInstitutionalPracticeManuscript(ambiguous)).toBeNull();
  });
});
