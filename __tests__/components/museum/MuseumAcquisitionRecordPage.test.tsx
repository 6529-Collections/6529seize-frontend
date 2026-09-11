import { render, screen } from "@testing-library/react";
import { MuseumAcquisitionRecordPage } from "@/components/museum/MuseumAcquisitionRecordPage";
import { MuseumAcquisitionRecordContext } from "@/components/museum/acquisition/MuseumAcquisitionRecordHeader";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import type {
  MuseumArtist,
  MuseumExternalProposalPresentationMedia,
  MuseumMediaMetadata,
  MuseumPublication,
  MuseumPublicDocument,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia, MuseumView } from "@/lib/museum/types";

const WAVE_ID = "5f207393-5418-4a75-8738-e40edb44a94d";
const WAVE_CONTEXT_HREF = `https://6529.io/waves/${WAVE_ID}?drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0`;

function metadata(
  id: string,
  artworkId: string,
  creditLine: string,
  altText: string,
  context?: MuseumMediaMetadata["context"]
): MuseumMediaMetadata {
  return {
    id,
    artworkId,
    role: "historical_wave_proposal_presentation",
    mediaType: "image/jpeg",
    width: 2400,
    height: 1600,
    altText,
    credit: {
      creditLine,
      licenseLabel: "All Rights Reserved",
      licenseUrl: null,
      rightsExpressionId: null,
      sourcePath: `records/entities/${id}.json`,
    },
    sourcePath: `records/entities/${id}.json`,
    ...(context === undefined ? {} : { context }),
  };
}

function artist(id: string, preferredName: string): MuseumArtist {
  return {
    id,
    slug: preferredName.toLocaleLowerCase().replaceAll(" ", "-"),
    preferredName,
    projectIds: [],
    artworkIds: [],
    workIds: [],
    documentIds: [],
    sourcePaths: [],
  };
}

function work(
  id: string,
  title: string,
  artistId: string,
  status: MuseumPublicWork["status"],
  mediaMetadata: MuseumMediaMetadata,
  options: {
    readonly programIds?: readonly string[];
    readonly sourceRecordIds?: readonly string[];
  } = {}
): MuseumPublicWork {
  return {
    kind: "work",
    id,
    slug: title.toLocaleLowerCase().replaceAll(" ", "-"),
    title,
    medium: "Photographic work",
    artistId,
    projectId: null,
    status,
    statusAsOf: "2026-08-09",
    acquisitionIds: [],
    programIds: options.programIds ?? [],
    media: [],
    mediaMetadata: [mediaMetadata],
    documentIds: [],
    qualifiers: [],
    sourcePaths: [],
    ...(options.sourceRecordIds === undefined
      ? {}
      : { sourceRecordIds: options.sourceRecordIds }),
  };
}

function acquisition(
  id: string,
  slug: string,
  title: string,
  status: MuseumAcquisitionViewModel["status"],
  workId: string,
  options: {
    readonly programId?: string | null;
    readonly sourceDocumentIds?: readonly string[];
    readonly workIds?: readonly string[];
  } = {}
): MuseumAcquisitionViewModel {
  return {
    kind: "curated_acquisition",
    id,
    label: title,
    canonicalHref: `/museum/network/acquisitions/${slug}`,
    breadcrumbs: [],
    status,
    statusAsOf: "2026-08-09",
    statusTone: "warning",
    primaryRelations: [],
    secondaryRelations: [],
    sourcePath: null,
    sourceCommit: null,
    acquisitionId: id,
    slug,
    title,
    thesis: `A documented group of works: ${title}.`,
    acquisitionMethod: "other_authorized_method",
    programId: options.programId ?? null,
    pathway: null,
    artistIds: [],
    organizationIds: [],
    projectIds: [],
    workIds: options.workIds ?? [workId],
    accessionLotIds: [],
    sourceDocumentIds: options.sourceDocumentIds ?? [],
    sourcePaths: [],
    presentationMedia: [],
  };
}

function publicDocument(
  id: string,
  kind: MuseumPublicDocument["kind"],
  title: string,
  markdown: string
): MuseumPublicDocument {
  return {
    id,
    kind,
    title,
    markdown,
    sha256: null,
    sourcePath: `records/documents/${id}.md`,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
    sourceRecordIds: [],
  };
}

function programMedia(sourceUrl: string, altText: string): MuseumProgramMedia {
  return {
    sourceUrl,
    sourceMimeType: "image/webp",
    sourceSha256: null,
    sourceByteSize: 900_000,
    sourceWidth: 2400,
    sourceHeight: 1600,
    altText,
    altTextStatus: "governed_artwork_description",
    variants: [
      {
        url: sourceUrl,
        width: 640,
        height: 427,
        mimeType: "image/webp",
        sha256:
          "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        byteSize: 120_000,
      },
    ],
  };
}

function programMediaWithoutDerivatives(
  sourceUrl: string,
  altText: string
): MuseumProgramMedia {
  return {
    ...programMedia(sourceUrl, altText),
    variants: [],
  };
}

function museumView(
  selectedWorkId: string,
  media: MuseumProgramMedia,
  programId = "program-keys"
): MuseumView {
  return {
    sourceState: {} as MuseumView["sourceState"],
    release: null,
    mission: null,
    policies: [],
    methodology: [],
    governance: [],
    approvedCollections: [],
    programs: [
      {
        programId,
        title: "Keys and Gates",
        subtitle: "A photographic acquisition program",
        status: "selection_complete",
        statusAsOf: "2026-08-09",
        curatorialFrame: "A program frame.",
        rules: [],
        nonClaims: [],
        selectedWorks: [
          {
            recordId: selectedWorkId,
            outcomePath: `records/programs/${programId}/outcomes/${selectedWorkId}.json`,
            status: "selection_complete",
            artist: "Anni Artist",
            title: "A Door Opens",
            submissionDropId: null,
            winnerPlace: 1,
            voteTotal: null,
            voterCount: null,
            media,
          },
        ],
        sourcePath: `records/programs/${programId}/program.json`,
        selectedWorksPath: `records/programs/${programId}/selected-works.json`,
      },
    ],
    accessions: [],
    objects: [],
  };
}

function presentationMedia(): MuseumExternalProposalPresentationMedia {
  return {
    id: "media-wave-proposal",
    kind: "external_proposal_presentation",
    mediaUrl:
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/002bfa4f-8416-48bf-b35e-38f354e9a9f0/photograph.jpg",
    mediaMimeType: "image/jpeg",
    sourceByteSize: 16_500_000,
    width: 2400,
    height: 1600,
    altText: "A governed presentation photograph.",
    source: {
      kind: "signed_wave_storm",
      waveId: WAVE_ID,
      dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
      partId: 1,
      serial: 1,
      publicationRecordId: "publication-wave-selection",
      contextEntityId: "acquisition-wave-selection",
      sourcePath: "records/proposed-gifts/wave-media-join.json",
      mediaRecordPath: "records/entities/media-wave-proposal.json",
      sourceCommit: "b".repeat(40),
    },
    credit: {
      creditLine: "© artist / Magnum Photos.",
      sourcePath: "records/entities/media-wave-proposal.json",
    },
    rights: {
      status: "presentation_only",
      licenseLabel: "All Rights Reserved",
      licenseUrl: null,
    },
    download: "not_permitted",
    preservation: "not_retained",
    affordances: [
      "view",
      "thumbnail",
      "hero",
      "alt",
      "open_upstream_presentation",
    ],
  };
}

function publication(
  artists: readonly MuseumArtist[],
  works: readonly MuseumPublicWork[],
  documents: readonly MuseumPublicDocument[] = []
): MuseumPublication {
  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: "main",
      commit: "a".repeat(40),
      manifestPath: "release-artifacts/manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: 0,
      assembledAt: "2026-08-09T00:00:00Z",
    },
    declaredSourcePaths: [],
    artists,
    projects: [],
    gifts: [],
    artworks: [],
    works,
    documents,
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  };
}

function expectEditorialOrder(workTitle: string, artistName: string): void {
  const figure = screen.getByText(artistName).closest("figure");
  expect(figure).not.toBeNull();
  const text = figure?.textContent ?? "";
  expect(text.indexOf(workTitle)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(artistName)).toBeGreaterThan(text.indexOf(workTitle));
}

describe("MuseumAcquisitionRecordPage exhibition presentation", () => {
  it("links an art-first acquisition to its immutable source record", () => {
    const sourceCommit = "d".repeat(40);
    const sourcePath =
      "records/accessions/6529NM.2026.003/accession-statement.json";
    const base = acquisition(
      "acquisition-vera-molnar",
      "a-gift-of-themes-and-variations-210",
      "A Gift of Themes and Variations #210",
      "accessioned_into_permanent_collection",
      "6529NM-W-0029"
    );

    render(
      <MuseumAcquisitionRecordContext
        context={{ ...base, sourceCommit, sourcePath }}
        artFirst={true}
        curatorialDocumentCount={1}
        workCount={1}
      />
    );

    expect(
      screen.getByRole("link", { name: "Open source record" })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529networkmuseum/blob/${sourceCommit}/${sourcePath}`
    );
  });

  it("joins Keys and Gates Work IDs to selected program media and tiers the record", () => {
    const workTitle = "A Door Opens";
    const artistName = "Anni Artist";
    const lifecycle = "Selected through an acquisition program; unminted";
    const workId = "6529NM-W-0008";
    const media = programMedia(
      "https://museum.test/keys-and-gates/0008.webp",
      "A photographic work from the Keys and Gates program."
    );

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-keys-and-gates",
          "keys-and-gates",
          "Keys and Gates",
          "selected_through_acquisition_program_acquisition_pending",
          workId,
          {
            programId: "program-keys",
            sourceDocumentIds: ["keys-essay", "keys-record"],
          }
        )}
        publication={publication(
          [artist("artist-anni", artistName)],
          [
            work(
              workId,
              workTitle,
              "artist-anni",
              "selected_through_acquisition_program_acquisition_pending",
              metadata(
                "media-keys-and-gates",
                workId,
                "© participating artists / Keys and Gates.",
                "A photographic work from the Keys and Gates program."
              ),
              {
                programIds: ["program-keys"],
                sourceRecordIds: [`records/entities/${workId}.json`],
              }
            ),
          ],
          [
            publicDocument(
              "keys-essay",
              "acquisition_essay",
              "A photographic program",
              "## A photographic program\n\nA curatorial reading."
            ),
            publicDocument(
              "keys-record",
              "technical_condition_review",
              "Technical and provenance record",
              "## Record\n\nA technical record."
            ),
          ]
        )}
        view={museumView(workId, media)}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Keys and Gates" })
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: media.altText })).toHaveAttribute(
      "src",
      media.sourceUrl
    );
    expect(
      screen.getByRole("link", { name: workTitle }).closest("figure")
    ).toHaveClass("tw-min-w-0", "tw-mx-auto", "tw-w-full", "tw-max-w-5xl");
    expect(
      screen.queryByText("No public image is available for this record.")
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(lifecycle, { exact: true }).length
    ).toBeGreaterThan(0);
    const curatorialHeading = screen.getByRole("heading", {
      name: "Curatorial reading",
    });
    expect(curatorialHeading).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Works in this acquisition" })
    ).toHaveAttribute("href", "#acquisition-works");
    expect(
      screen.getByRole("link", { name: "Curatorial reading" })
    ).toHaveAttribute("href", "#acquisition-curatorial-reading");
    const record = document.querySelector("details#acquisition-record");
    expect(record).not.toBeNull();
    expect(record).not.toHaveAttribute("open");
    expectEditorialOrder(workTitle, artistName);

    const worksSection = document.querySelector("#acquisition-works");
    const recordSection = document.querySelector("#acquisition-record");
    expect(
      Boolean(
        worksSection !== null &&
        (worksSection.compareDocumentPosition(curatorialHeading) &
          Node.DOCUMENT_POSITION_FOLLOWING) !==
          0
      )
    ).toBe(true);
    expect(
      Boolean(
        recordSection !== null &&
        (curatorialHeading.compareDocumentPosition(recordSection) &
          Node.DOCUMENT_POSITION_FOLLOWING) !==
          0
      )
    ).toBe(true);
  });

  it("omits the works anchor when the acquisition has no work records", () => {
    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-empty",
          "empty-acquisition",
          "Empty acquisition",
          "selected_through_acquisition_program_acquisition_pending",
          "unused-work-id",
          { workIds: [] }
        )}
        publication={publication([], [])}
        view={null}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(
      screen.queryByRole("link", { name: "Works in this acquisition" })
    ).not.toBeInTheDocument();
  });

  it("renders Conflict at Its Edges as a visual Wave-selected acquisition", () => {
    const workTitle = "Conflict at Its Edges";
    const artistName = "M. Artist";
    const lifecycle =
      "Selected by Museum Wave; accession processing in progress";
    const workId = "6529NM-W-0024";
    const presentation = presentationMedia();

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-wave-selection",
          "conflict-at-its-edges",
          workTitle,
          "selected_by_museum_wave_acquisition_review_in_progress",
          workId
        )}
        publication={publication(
          [artist("artist-m", artistName)],
          [
            {
              ...work(
                workId,
                workTitle,
                "artist-m",
                "selected_by_museum_wave_acquisition_review_in_progress",
                metadata(
                  "media-wave-proposal",
                  workId,
                  "© artist / Magnum Photos.",
                  presentation.altText
                )
              ),
              presentationMedia: [presentation],
            },
          ]
        )}
        view={null}
        sourceCommit={"b".repeat(40)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Conflict at Its Edges" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View image · loads 16.5 MB" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: presentation.altText })
    ).toHaveAttribute("src", presentation.mediaUrl);
    expect(
      screen.getByRole("link", { name: "View Wave publication" })
    ).toHaveAttribute("href", WAVE_CONTEXT_HREF);
    expect(
      screen.getAllByText(lifecycle, { exact: true }).length
    ).toBeGreaterThan(0);
    expectEditorialOrder(workTitle, artistName);
    expect(document.body.textContent).not.toContain(
      "selected_by_museum_wave_acquisition_review_in_progress"
    );
  });

  it("leads an exhibition with an immediately viewable work while preserving the accession order", () => {
    const gated = presentationMedia();
    const immediatelyViewable: MuseumExternalProposalPresentationMedia = {
      ...presentationMedia(),
      id: "media-wave-proposal-viewable",
      mediaUrl: "https://museum.test/conflict/border.jpg",
      sourceByteSize: 800_000,
      altText: "A patrol moves through a desert border landscape.",
      source: {
        ...presentationMedia().source,
        partId: 2,
        mediaRecordPath: "records/entities/media-wave-proposal-viewable.json",
      },
    };
    const gatedWorkId = "6529NM-W-0028";
    const viewableWorkId = "6529NM-W-0024";

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-wave-selection",
          "conflict-at-its-edges",
          "Conflict at Its Edges",
          "selected_by_museum_wave_acquisition_review_in_progress",
          gatedWorkId,
          { workIds: [gatedWorkId, viewableWorkId] }
        )}
        publication={publication(
          [artist("artist-m", "M. Artist")],
          [
            {
              ...work(
                gatedWorkId,
                "Palmyra, Syria",
                "artist-m",
                "selected_by_museum_wave_acquisition_review_in_progress",
                metadata(
                  "media-palmyra",
                  gatedWorkId,
                  "© artist / Magnum Photos.",
                  gated.altText
                )
              ),
              presentationMedia: [gated],
            },
            {
              ...work(
                viewableWorkId,
                "Patrolling the border",
                "artist-m",
                "selected_by_museum_wave_acquisition_review_in_progress",
                metadata(
                  "media-border",
                  viewableWorkId,
                  "© artist / Magnum Photos.",
                  immediatelyViewable.altText
                )
              ),
              presentationMedia: [immediatelyViewable],
            },
          ]
        )}
        view={null}
        sourceCommit={"b".repeat(40)}
      />
    );

    const figures = document.querySelectorAll("#acquisition-works figure");
    expect(figures).toHaveLength(2);
    expect(figures[0]).toHaveTextContent("Patrolling the border");
    expect(figures[1]).toHaveTextContent("Palmyra, Syria");
    expect(
      screen.getByRole("img", { name: immediatelyViewable.altText })
    ).toHaveAttribute("src", immediatelyViewable.mediaUrl);
    expect(
      screen.queryByRole("button", { name: "View image · loads 16.5 MB" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: gated.altText })).toHaveAttribute(
      "src",
      gated.mediaUrl
    );
  });

  it("fails closed when selected program media has no reviewed derivatives", () => {
    const workId = "6529NM-W-0008";
    const media = programMediaWithoutDerivatives(
      "https://museum.test/keys-and-gates/0008.webp",
      "A photographic work from the Keys and Gates program."
    );

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-keys-and-gates",
          "keys-and-gates",
          "Keys and Gates",
          "selected_through_acquisition_program_acquisition_pending",
          workId,
          { programId: "program-keys" }
        )}
        publication={publication(
          [artist("artist-anni", "Anni Artist")],
          [
            work(
              workId,
              "A Door Opens",
              "artist-anni",
              "selected_through_acquisition_program_acquisition_pending",
              metadata(
                "media-keys-and-gates",
                workId,
                "© participating artists / Keys and Gates.",
                media.altText
              ),
              { programIds: ["program-keys"] }
            ),
          ]
        )}
        view={museumView(workId, media)}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(
      screen.queryByRole("img", { name: media.altText })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("No public image is available for this record.")
    ).toBeInTheDocument();
  });

  it("keeps Casey's completed accession on the established record layout", () => {
    const workId = "6529NM-W-0001";

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-casey",
          "the-system-in-seven-states",
          "The System in Seven States",
          "accessioned_into_permanent_collection",
          workId
        )}
        publication={publication(
          [artist("artist-casey", "Casey Reas")],
          [
            work(
              workId,
              "The System in Seven States",
              "artist-casey",
              "accessioned_into_permanent_collection",
              metadata(
                "media-casey",
                workId,
                "© Casey Reas.",
                "A Casey Reas work."
              )
            ),
          ]
        )}
        view={null}
        sourceCommit={"c".repeat(40)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "The System in Seven States" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Curatorial reading" })
    ).not.toBeInTheDocument();
    const record = document.querySelector("details#acquisition-record");
    expect(record).not.toBeNull();
    expect(record).not.toHaveAttribute("open");
    expect(
      screen.getAllByText("Accessioned into the permanent Collection", {
        exact: true,
      }).length
    ).toBeGreaterThan(0);
  });
});
