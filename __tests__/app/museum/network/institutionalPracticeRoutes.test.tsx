import { render, screen, within } from "@testing-library/react";
import { notFound, permanentRedirect } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import MuseumInstitutionProfilePage, {
  generateMetadata,
} from "@/app/museum/network/research/institutional-practice/[slug]/page";
import MuseumAdjacentPracticePage from "@/app/museum/network/research/institutional-practice/adjacent-practice/page";
import MuseumInstitutionalPracticePage from "@/app/museum/network/research/institutional-practice/page";
import MuseumInstitutionalPracticeSourcesPage from "@/app/museum/network/research/institutional-practice/sources/page";
import MuseumScholarshipAndWritingPage from "@/app/museum/network/research/scholarship-and-writing/page";
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
  permanentRedirect: jest.fn(() => {
    throw new Error("permanent_redirect");
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly children: ReactNode;
    readonly prefetch?: boolean;
  }) => (
    <a {...props} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
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
const mockedPermanentRedirect = jest.mocked(permanentRedirect);

function expectNextLinkWithoutPrefetch(href: string) {
  const link = screen
    .getAllByRole("link")
    .find(
      (candidate) =>
        candidate.getAttribute("href") === href &&
        candidate.getAttribute("data-prefetch") === "false"
    );
  expect(link).toBeDefined();
}

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

## Overview

The study compares public museum practice across media and institutions.

## Thematic pathways

The pathways follow artworks, records, and the work of care.

## 1. Work, interface, and access

Access begins with the conditions through which a work can be encountered.

## 2. Preservation, reconstruction, and technical care

Digital preservation includes dependencies, documentation, and reconstruction.

## 3. Records, archives, and public data

Public records connect interpretation to evidence.

## Working lessons

### Describe the encounter before the interpretation

Begin with what a visitor can see, hear, or do.

### Publish loss and missingness

State what cannot be recovered.

### Connect the object to its research paths

Keep the work linked to the evidence used to understand it.

### Keep revisions visible

Corrections remain part of the public history.

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

function adjacentPracticeMarkdown(): string {
  return `# Adjacent practice: platforms, archives, festivals, and chain-native systems

- **Status:** public scholarship
- **Institutional author:** 6529 Network Museum
- **Version:** 1.0.0
- **Publication date:** 2026-08-04
- **Research cutoff:** 2026-08-04

The study classifies each precedent by the functions its public record demonstrates.

## Platforms and chain-native systems

Feral File joins exhibition, object, and protocol records.`;
}

function editorialStandardMarkdown(): string {
  return `# Writing the 6529 Network Museum

- **Status:** active editorial and implementation standard
- **Institutional author:** 6529 Network Museum
- **Subtitle:** Scholarship and editorial standard
- **Version:** 1.1.0
- **Publication date:** 2026-08-04
- **Research cutoff:** 2026-08-04

This standard describes how the Museum studies, describes, and publishes art.

## The Museum publishes arguments about art

Each text should make a specific work newly intelligible.

## 1. The Museum publishes arguments about art

Research begins with a claim that close looking and evidence can test.

## 2. What substantive scholarship must achieve

Scholarship places a work in artistic, technical, and historical context.

## 3. Evidence supports the argument

Sources remain close to the claims they support.

### 3.1 Publish in layers

Readers can move from a concise account to the complete record.

### 3.2 State the condition of knowledge

Each publication states what is known, inferred, and unresolved.

## 6. Close looking for born-digital and tokenized art

Close looking includes code, behavior, interface, and change over time.

## 8. Medium must be described at the level of the artwork

Medium names the actual conditions through which a work exists.

### 12.1 Begin with the subject, not the institution

Open with the artist, work, or question under study.

### 12.3 Prefer verbs that identify action

Verbs should say what a work, artist, or system does.

### 12.8 Finish without a slogan

Conclusions return to the evidence and argument.

### 12.9 Edit for the audible sentence

Read prose aloud and revise its rhythm.

## 15. Acceptance test

Publication requires accurate evidence, clear argument, and finished prose.`;
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
  const adjacentPractice: MuseumPublicDocument = {
    ...practice.adjacentPractice,
    markdown: adjacentPracticeMarkdown(),
  };
  const editorialStandard: MuseumPublicDocument = {
    ...practice.editorialStandard,
    markdown: editorialStandardMarkdown(),
  };
  const replacements = new Map(
    [
      introduction,
      ...profiles.map((profile) => profile.document),
      adjacentPractice,
      editorialStandard,
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
      adjacentPractice,
      editorialStandard,
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

  it("permanently redirects the legacy Stories entry point to Research", async () => {
    await expect(MuseumStoriesPage()).rejects.toThrow("permanent_redirect");
    expect(mockedPermanentRedirect).toHaveBeenCalledWith(
      "/museum/network/research"
    );
  });

  it("renders the adjacent-practice classification as governed scholarship", async () => {
    render(await MuseumAdjacentPracticePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Adjacent practice: platforms, archives, festivals, and chain-native systems",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Platforms and chain-native systems",
      })
    ).toBeInTheDocument();
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice"
    );
  });

  it("publishes the Museum scholarship and editorial standard onsite", async () => {
    render(await MuseumScholarshipAndWritingPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Writing the 6529 Network Museum",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Scholarship and editorial standard")
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        level: 3,
        name: "1. The Museum publishes arguments about art",
      })
    ).toHaveLength(2);
    expectNextLinkWithoutPrefetch("/museum/network/research");
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice"
    );
  });

  it("renders the comparative study as one governed document hierarchy", async () => {
    render(await MuseumInstitutionalPracticePage());

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Museums to learn from" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 3, name: "Overview" })
    ).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Selected thematic pathways",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Selected working lessons",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Institutions the 6529 Network Museum studies")
    ).toBeInTheDocument();
    expect(screen.getByText("Published August 4, 2026")).toBeInTheDocument();
    const directory = screen.getByRole("region", {
      name: "Museums and practices we study",
    });
    for (const profile of publication.institutionalPractice.profiles) {
      expect(
        within(directory).getByRole("link", { name: profile.document.title })
      ).toHaveAttribute(
        "href",
        `/museum/network/research/institutional-practice/${profile.slug}`
      );
    }
    for (const link of screen.getAllByRole("link", {
      name: "curatorial publication standard",
    })) {
      expect(link).toHaveAttribute(
        "href",
        "/museum/network/research/scholarship-and-writing"
      );
    }
    expectNextLinkWithoutPrefetch("/museum/network/research");
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice/sources"
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
      "/museum/network/research/institutional-practice/sources"
    );
    expect(
      screen.getByRole("link", { name: "Next profile Getty" })
    ).toHaveAttribute(
      "href",
      "/museum/network/research/institutional-practice/getty"
    );
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice"
    );
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice/sources"
    );
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice/getty"
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
    expectNextLinkWithoutPrefetch(
      "/museum/network/research/institutional-practice"
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
          profiles: publication.institutionalPractice.profiles.slice(0, 26),
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

  it("rejects a manuscript with no research date", () => {
    const undated = profileMarkdown("Tate").replace(
      "- **Research cutoff:** 2026-08-04\n",
      ""
    );

    expect(projectInstitutionalPracticeManuscript(undated)).toBeNull();
  });

  it.each(["2026-13-40", "2026-02-30"])(
    "rejects the calendar-invalid publication date %s",
    (date) => {
      const invalid = profileMarkdown("Tate").replace(
        "- **Publication date:** 2026-08-04",
        `- **Publication date:** ${date}`
      );

      expect(projectInstitutionalPracticeManuscript(invalid)).toBeNull();
    }
  );
});
