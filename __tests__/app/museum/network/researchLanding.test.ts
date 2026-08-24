import { buildMuseumResearchLandingCards } from "@/app/museum/network/research/cards";
import {
  MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS,
  MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS,
  MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS,
  MUSEUM_RESEARCH_WORK_ASSIGNMENTS,
  type MuseumResearchIndexEntry,
} from "@/app/museum/network/research/catalog";
import type { MuseumPublication } from "@/lib/museum/publication/types";
import { VERA_MOLNAR_PUBLIC_PATHS } from "@/lib/museum/publication/veraMolnarPublication";

function landingFixture(): MuseumPublication {
  const artistAssignments = MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS.map(
    (assignment) => ({
      id: assignment.artistId,
      slug: assignment.artistId.toLowerCase(),
      preferredName: assignment.artistId,
      workIds: [assignment.workId],
    })
  );
  const workAssignments = [
    ...MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS.map((assignment) => ({
      id: assignment.workId,
      slug: assignment.workId.toLowerCase(),
      title: assignment.workId,
      artistId: assignment.artistId,
    })),
    ...MUSEUM_RESEARCH_WORK_ASSIGNMENTS.map((assignment) => ({
      id: assignment.workId,
      slug: assignment.workId.toLowerCase(),
      title: assignment.workId,
      artistId: MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS[0]!.artistId,
    })),
  ];
  return {
    artists: artistAssignments,
    works: workAssignments,
    artworks: [],
    organizations: [
      {
        id: MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS.magnumOrganizationId,
        slug: "magnum-photos",
        preferredName: "Magnum Photos",
      },
    ],
    acquisitionPrograms: [
      {
        id: MUSEUM_RESEARCH_CONTEXT_ENTITY_IDS.keysAndGatesProgramId,
        slug: "keys-and-gates",
        title: "Keys and Gates",
      },
    ],
  } as unknown as MuseumPublication;
}

const researchEntries: readonly MuseumResearchIndexEntry[] = [
  ...Object.values(MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS).map(
    (assignment) => ({
      id: assignment.researchId,
      slug: assignment.researchId.toLowerCase(),
      title: assignment.researchId,
      group: "collection" as const,
      sourcePath: `records/${assignment.researchId}.json`,
      typed: true,
    })
  ),
  {
    id: "vera-gift-essay",
    slug: "a-gift-of-themes-and-variations-210",
    title: "A Gift of Themes and Variations #210",
    group: "collection",
    sourcePath: VERA_MOLNAR_PUBLIC_PATHS.acquisitionEssay,
    typed: false,
  },
];

describe("Museum research landing inventory", () => {
  it("keys artist studies to public artist profiles rather than agent records", () => {
    expect(
      MUSEUM_RESEARCH_ARTIST_ASSIGNMENTS.map((assignment) => [
        assignment.workId,
        assignment.artistId,
      ])
    ).toEqual([
      ["6529NM-W-0029", "6529NM-ART-0022"],
      ["6529NM-W-0029", "6529NM-ART-0023"],
      ["6529NM-W-0007", "6529NM-ART-0001"],
      ["6529NM-W-0025", "6529NM-ART-0018"],
      ["6529NM-W-0027", "6529NM-ART-0020"],
      ["6529NM-W-0009", "6529NM-ART-0003"],
      ["6529NM-W-0010", "6529NM-ART-0004"],
      ["6529NM-W-0022", "6529NM-ART-0015"],
    ]);
  });

  it("keeps the authoritative 29-card section inventory", () => {
    const cards = buildMuseumResearchLandingCards(
      landingFixture(),
      researchEntries
    );

    expect(cards).toBeDefined();
    expect(
      cards && {
        acquisition: cards.acquisitionCards.length,
        artists: cards.artistCards.length,
        works: cards.workCards.length,
        contexts: cards.contextCards.length,
        stewardship: cards.stewardshipCards.length,
        practice: cards.practiceCards.length,
      }
    ).toEqual({
      acquisition: 4,
      artists: 8,
      works: 7,
      contexts: 2,
      stewardship: 4,
      practice: 4,
    });
    expect(cards?.practiceCards.map((card) => card.id)).toEqual([
      "research-practice:museums-to-learn",
      "research-practice:scholarship-writing",
      "research-practice:open-museum",
      "research-practice:repository-to-chain",
    ]);
    expect(
      cards?.acquisitionCards.find(
        (card) => card.title === "Conflict at Its Edges"
      )
    ).toEqual(
      expect.objectContaining({
        mediaQualifier:
          "All Rights Reserved. Accession 6529NM.2026.002.",
      })
    );
  });
});
