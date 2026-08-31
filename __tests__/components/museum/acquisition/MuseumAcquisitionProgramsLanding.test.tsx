import { render, screen } from "@testing-library/react";
import { ENTITY_ID_PATTERNS } from "@/lib/museum/publication/publicEntityGraphSchema";
import {
  buildMuseumAcquisitionProgramLandingRecords,
  MuseumAcquisitionProgramsLandingPage,
} from "@/components/museum/acquisition/MuseumAcquisitionProgramsLanding";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import type {
  MuseumAcquisitionProgram,
  MuseumPublication,
} from "@/lib/museum/publication/types";

const publication = {
  identity: {
    repository: "6529-Collections/6529networkmuseum",
    requestedRef: "main",
    commit: "a".repeat(40),
    manifestPath: "release-artifacts/manifest.json",
    manifestSha256: null,
    manifestCommitment: null,
    inventoryCount: 2,
    assembledAt: "2026-08-12T00:00:00Z",
  },
  artists: [],
  projects: [],
  gifts: [],
  artworks: [],
  works: [
    {
      kind: "work",
      id: "casey-work",
      slug: "century-31",
      title: "CENTURY #31",
      medium: "Digital work",
      artistId: "casey",
      projectId: null,
      status: "accessioned_into_permanent_collection",
      statusAsOf: "2026-08-12",
      collectionMembership: true,
      acquisitionIds: ["casey-acquisition"],
      programIds: ["AP-GIFT-01"],
      media: [],
      mediaMetadata: [
        {
          id: "casey-media",
          artworkId: "casey-work",
          role: "museum_authored_public_graphic",
          mediaType: "image/png",
          width: 1200,
          height: 1200,
          altText: "CENTURY #31 by Casey Reas",
          credit: {
            creditLine: "Gift of punk6529.",
            licenseLabel: "CC BY-NC 4.0",
            licenseUrl: null,
            rightsExpressionId: null,
            sourcePath: "records/media.json",
          },
          sourcePath: "records/media.json",
        },
      ],
      documentIds: [],
      qualifiers: [],
      sourcePaths: ["records/entities/casey-work.json"],
    },
    {
      kind: "work",
      id: "keys-work",
      slug: "take-the-key",
      title: "Take the Key!",
      medium: "Photograph",
      artistId: "keys-artist",
      projectId: null,
      status: "selected_through_acquisition_program_acquisition_pending",
      statusAsOf: "2026-08-12",
      collectionMembership: false,
      acquisitionIds: ["keys-acquisition"],
      programIds: ["6529NM-AP-01"],
      media: [],
      documentIds: [],
      qualifiers: [],
      sourcePaths: ["records/entities/keys-work.json"],
    },
  ],
  curatedAcquisitions: [],
  acquisitionPrograms: [],
  documents: [],
  institutionalPractice: {},
  dataArchitecture: {},
  rightsHandbook: {},
} as unknown as MuseumPublication;

function acquisition(
  id: string,
  slug: string,
  title: string,
  workId: string,
  programId: string,
  status: MuseumAcquisitionViewModel["status"]
): MuseumAcquisitionViewModel {
  return {
    kind: "curated_acquisition",
    id,
    label: title,
    canonicalHref: `/museum/network/acquisitions/${slug}`,
    breadcrumbs: [],
    status,
    statusAsOf: "2026-08-12",
    statusTone:
      status === "accessioned_into_permanent_collection"
        ? "success"
        : "warning",
    primaryRelations: [],
    secondaryRelations: [],
    sourcePath: `records/entities/${id}.json`,
    sourceCommit: "a".repeat(40),
    acquisitionId: id,
    slug,
    title,
    thesis: title,
    acquisitionMethod: programId === "AP-GIFT-01" ? "donation" : "purchase",
    programId,
    pathway: title,
    artistIds: [],
    organizationIds: [],
    projectIds: [],
    workIds: [workId],
    accessionLotIds: [],
    sourceDocumentIds: [],
    sourcePaths: [`records/entities/${id}.json`],
    presentationMedia: [],
  };
}

function program(
  id: string,
  slug: string,
  title: string,
  acquisitionId: string,
  method: MuseumAcquisitionProgram["acquisitionMethod"]
): MuseumAcquisitionProgram {
  return {
    kind: "acquisition_program",
    id,
    slug,
    title,
    status: id === "AP-GIFT-01" ? "completed" : "selection_complete",
    statusAsOf: "2026-08-12",
    acquisitionMethod: method,
    acquisitionIds: [acquisitionId],
    sourceDocumentIds: [],
    sourcePaths: [`records/entities/${id}.json`],
  };
}

describe("Museum acquisition programs landing", () => {
  it("renders a valid but unclassified program in a neutral fallback section", () => {
    const unknownProgramId = "6529NM-AP-ENT-0099";
    const unknown = program(
      unknownProgramId,
      "unknown-program",
      "Unknown program",
      "unknown-acquisition",
      "purchase"
    );

    expect(ENTITY_ID_PATTERNS.ACQUISITION_PROGRAM?.test(unknown.id)).toBe(true);
    render(
      <MuseumAcquisitionProgramsLandingPage
        records={[
          {
            program: unknown,
            acquisitions: [],
            acquisitionArtistNames: {},
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Other published programs" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unknown program", { exact: true })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "These published programs have not been assigned to one of the Museum's standing collecting frameworks."
      )
    ).toBeInTheDocument();
  });

  it("classifies the canonical Gift Acquisitions entity", () => {
    const canonicalGiftProgram = program(
      "6529NM-AP-ENT-0001",
      "gift-acquisitions",
      "Gift Acquisitions",
      "6529NM-CA-2026-001",
      "donation"
    );
    expect(() =>
      render(
        <MuseumAcquisitionProgramsLandingPage
          records={[
            {
              program: canonicalGiftProgram,
              acquisitions: [],
              acquisitionArtistNames: {},
            },
          ]}
        />
      )
    ).not.toThrow();
    expect(screen.getByText("Gifts", { exact: true })).toBeInTheDocument();
  });

  it("presents pathways separately from the acquisitions they produce", () => {
    const casey = acquisition(
      "casey-acquisition",
      "the-system-in-seven-states",
      "The System in Seven States",
      "casey-work",
      "AP-GIFT-01",
      "accessioned_into_permanent_collection"
    );
    const keys = acquisition(
      "keys-acquisition",
      "keys-and-gates",
      "Keys and Gates",
      "keys-work",
      "6529NM-AP-01",
      "selected_through_acquisition_program_acquisition_pending"
    );
    const records = buildMuseumAcquisitionProgramLandingRecords(
      publication,
      [
        program(
          "AP-GIFT-01",
          "gift-acquisitions",
          "Gift Acquisitions",
          casey.id,
          "donation"
        ),
        program(
          "6529NM-AP-01",
          "keys-and-gates",
          "Keys and Gates",
          keys.id,
          "purchase"
        ),
      ],
      [casey, keys],
      null
    );

    expect(records).toHaveLength(2);
    expect(records.map((record) => record.acquisitions)).toEqual([
      [
        expect.objectContaining({
          acquisition: expect.objectContaining({ acquisitionId: casey.id }),
        }),
      ],
      [
        expect.objectContaining({
          acquisition: expect.objectContaining({ acquisitionId: keys.id }),
        }),
      ],
    ]);

    render(<MuseumAcquisitionProgramsLandingPage records={records} />);
    expect(
      screen.getByRole("heading", { name: "Acquisition programs" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gifts" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Meme Card-funded acquisition programs",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Completed gifts")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Museum has accepted and accessioned gifts of work by Casey Reas, five Magnum photographers, and Vera Molnár, in collaboration with Martin Grasser. Each gift has its own curatorial and accession record."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Keys and Gates" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Keys and Gates is the first Meme Card-funded acquisition program. Selected photographic works are being prepared for acquisition and accession."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acquisition methods" })
    ).toBeInTheDocument();
    expect(screen.getByText("Gift", { selector: "dt" })).toBeInTheDocument();
    expect(
      screen.getByText("Purchase", { selector: "dt" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Commission or primary mint", { selector: "dt" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bequest, exchange, or transfer", { selector: "dt" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /An offer, selection, mint, or wallet transfer is not an accession\./u
      )
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Accession in progress/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Program, acquisition, and accession",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/registry|database|connected work/u)
    ).not.toBeInTheDocument();
  });
});
