import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumObjectPage } from "@/components/museum/MuseumObjectPage";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMedia,
  MuseumMediaMetadata,
  MuseumPublication,
  MuseumPublicWork,
  MuseumRightsCredit,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia, MuseumView } from "@/lib/museum/types";
import { MUSEUM_MAGNUM_ACQUISITION_ID } from "@/lib/museum/publication/collectionSemantics";

const SOURCE_COMMIT = "a".repeat(40);

function rightsCredit(licenseUrl: string | null): MuseumRightsCredit {
  return {
    creditLine: "Artist name, Work title.",
    licenseLabel: "CC BY 4.0",
    licenseUrl,
    rightsExpressionId: "cc-by-4.0",
    sourcePath: "records/entities/6529NM-W-0001.json",
  };
}

function work(
  media: readonly MuseumMedia[],
  mediaMetadata?: readonly MuseumMediaMetadata[]
): MuseumPublicWork {
  return {
    kind: "work",
    id: "6529NM-W-0001",
    slug: "work-one",
    title: "Work One",
    medium: "Generative work",
    artistId: "6529NM-ART-0001",
    projectId: null,
    status: "accessioned_into_permanent_collection",
    statusAsOf: "2026-08-09",
    acquisitionIds: [],
    programIds: [],
    media,
    ...(mediaMetadata === undefined ? {} : { mediaMetadata }),
    documentIds: [],
    qualifiers: [],
    sourcePaths: ["records/entities/6529NM-W-0001.json"],
  };
}

function publication(publicWork: MuseumPublicWork): MuseumPublication {
  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: "main",
      commit: SOURCE_COMMIT,
      manifestPath: "release-artifacts/manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: 0,
      assembledAt: "2026-08-09T00:00:00Z",
    },
    declaredSourcePaths: [],
    artists: [
      {
        id: "6529NM-ART-0001",
        slug: "artist-one",
        preferredName: "Artist One",
        projectIds: [],
        artworkIds: [],
        workIds: [publicWork.id],
        documentIds: [],
        sourcePaths: [],
      },
    ],
    projects: [],
    gifts: [],
    artworks: [],
    works: [publicWork],
    curatedAcquisitions: [],
    documents: [],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  };
}

function retainedMedia(credit: MuseumRightsCredit): MuseumMedia {
  return {
    id: "6529NM-MED-0001",
    artworkId: "6529NM-W-0001",
    kind: "still",
    role: "source",
    mediaType: "image/png",
    width: 1200,
    height: 1200,
    altText: "A governed artwork image.",
    credit,
    sourcePath: "records/entities/6529NM-MED-0001.json",
    custody: "retained",
    url: "https://media.6529.io/governed/work-one.png",
    preservationStatus: "retained_verified",
    sha256: null,
    upstreamProvider: null,
  };
}

function liveMedia(credit: MuseumRightsCredit): MuseumMedia {
  return {
    ...retainedMedia(credit),
    id: "6529NM-MED-LIVE-0001",
    kind: "live",
    mediaType: "text/html",
    width: null,
    height: null,
    url: "https://generator.artblocks.io/1/0xabc/1",
  };
}

function magnumPresentationMedia(): MuseumExternalProposalPresentationMedia {
  return {
    id: "6529NM-MED-0044",
    kind: "external_proposal_presentation",
    mediaUrl:
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/002bfa4f-8416-48bf-b35e-38f354e9a9f0/photograph.jpg",
    mediaMimeType: "image/jpeg",
    sourceByteSize: 16_871_807,
    width: 2400,
    height: 1600,
    altText: "A governed Magnum accession photograph.",
    source: {
      kind: "signed_wave_storm",
      waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
      dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
      partId: 6,
      serial: 1,
      publicationRecordId: "6529NM-WAVE-PUB-OBS-2026-08-08-001",
      contextEntityId: MUSEUM_MAGNUM_ACQUISITION_ID,
      sourcePath: "records/acquisitions/magnum-75/wave-publication.json",
      mediaRecordPath: "records/entities/6529NM-MED-0044.json",
      sourceCommit: "b".repeat(40),
    },
    credit: {
      creditLine: "© Artist / Magnum Photos.",
      sourcePath: "records/entities/6529NM-MED-0044.json",
    },
    rights: {
      status: "presentation_only",
      licenseLabel: "All Rights Reserved",
      licenseUrl: null,
    },
    download: "not_permitted",
    preservation: "not_retained",
    affordances: ["view", "alt", "open_upstream_presentation"],
  };
}

function metadata(
  credit: MuseumRightsCredit,
  sourceRecordIds = ["6529NM-W-0001"]
): MuseumMediaMetadata {
  return {
    id: "6529NM-MED-0002",
    artworkId: "6529NM-W-0001",
    role: "token_linked_source_media",
    mediaType: "image/png",
    width: 1200,
    height: 1200,
    altText: "A governed metadata-only artwork image.",
    credit,
    sourcePath: "records/entities/6529NM-MED-0002.json",
    sourceRecordIds,
  };
}

const reviewedProgramMedia: MuseumProgramMedia = {
  sourceUrl:
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/keys-and-gates-source.jpg",
  sourceMimeType: "image/jpeg",
  sourceSha256: "sha256:" + "b".repeat(64),
  sourceByteSize: 12000000,
  sourceWidth: 6000,
  sourceHeight: 4000,
  altText: "A selected photographic work from Keys and Gates.",
  altTextStatus: "reviewed_visual_description",
  variants: [
    {
      url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/640.webp",
      width: 640,
      height: 427,
      mimeType: "image/webp",
      sha256: "sha256:" + "c".repeat(64),
      byteSize: 32000,
    },
  ],
};

function viewWithReviewedProgramMedia(objectId: string): MuseumView {
  return {
    sourceState: "fresh",
    release: null,
    mission: null,
    policies: [],
    methodology: [],
    governance: [],
    approvedCollections: [],
    programs: [],
    accessions: [],
    objects: [
      {
        objectId,
        accessionLotId: null,
        title: "Selected work",
        artist: "Artist name",
        artistStatement: null,
        classification: "Photography",
        status: "selected_unminted",
        statusAsOf: "2026-08-09",
        programId: "6529NM-AP-01",
        media: reviewedProgramMedia,
        selectionPlace: 1,
        selectionDate: "2026-07-09",
        selectionSourceUrl: null,
        rightsStatus: "reviewed for contextual presentation",
        scope: "Selected work",
        sourcePath: "records/programs/6529NM-AP-01/outcomes/OUT-001.json",
        record: {},
      },
    ],
  };
}

describe("MuseumObjectPage canonical typed Work rights", () => {
  it("renders the governed still and never decodes a preceding live locator as an image", async () => {
    const credit = rightsCredit("https://creativecommons.org/licenses/by/4.0/");
    const still = retainedMedia(credit);
    render(
      await MuseumObjectPage({
        objectId: "6529NM-W-0001",
        publication: publication(work([liveMedia(credit), still])),
        view: null,
      })
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", still.url);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByText("Aug 9, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open source record" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Institutional record" })
    ).not.toBeInTheDocument();
  });

  it("links a visual Work license through MuseumRightsLink", async () => {
    const licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
    render(
      await MuseumObjectPage({
        objectId: "6529NM-W-0001",
        publication: publication(
          work([retainedMedia(rightsCredit(licenseUrl))])
        ),
        view: null,
      })
    );

    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toHaveAttribute(
      "href",
      licenseUrl
    );
  });

  it("gives a single Work image the full frame and avoids repeating its license", async () => {
    const credit: MuseumRightsCredit = {
      ...rightsCredit("https://creativecommons.org/licenses/by-nc/4.0/"),
      creditLine:
        "Casey Reas, Work One; 6529 Network Museum. Licensed CC BY-NC 4.0.",
      licenseLabel: "CC BY-NC 4.0",
    };
    render(
      await MuseumObjectPage({
        objectId: "6529NM-W-0001",
        publication: publication(work([retainedMedia(credit)])),
        view: null,
      })
    );

    const figure = screen.getByRole("img").closest("figure");
    expect(figure).not.toBeNull();
    expect(figure).toHaveClass("tw-w-full");
    expect(figure).toHaveTextContent(
      "Casey Reas, Work One; 6529 Network Museum."
    );
    expect(figure).not.toHaveTextContent("Licensed CC BY-NC 4.0.");
    expect(screen.getAllByText("CC BY-NC 4.0")).toHaveLength(1);
  });

  it("shows Magnum's typed institutional-display statement and fails closed for a selected work", async () => {
    const magnumCredit: MuseumRightsCredit = {
      ...rightsCredit(null),
      licenseLabel: "All Rights Reserved",
      sourcePath: "records/acquisitions/magnum-75/media/med-001.json",
    };
    const magnumWork = {
      ...work([retainedMedia(magnumCredit)]),
      acquisitionIds: [MUSEUM_MAGNUM_ACQUISITION_ID],
      collectionMembership: true,
    };

    const renderedMagnum = render(
      await MuseumObjectPage({
        objectId: magnumWork.id,
        publication: publication(magnumWork),
        view: null,
      })
    );
    expect(
      screen.getByText(/ordinary, credited institutional display/u)
    ).toBeInTheDocument();

    renderedMagnum.unmount();
    const selectedWork = {
      ...magnumWork,
      status:
        "selected_through_acquisition_program_acquisition_pending" as const,
      acquisitionIds: [],
      programIds: ["6529NM-AP-ENT-0002"],
    };
    render(
      await MuseumObjectPage({
        objectId: selectedWork.id,
        publication: publication(selectedWork),
        view: null,
      })
    );
    expect(
      screen.queryByText(/ordinary, credited institutional display/u)
    ).not.toBeInTheDocument();
  });

  it("gates a large proposal original until the visitor asks to load it", async () => {
    const proposedWork: MuseumPublicWork = {
      ...work([]),
      status: "proposed_in_museum_wave",
      acquisitionIds: [],
      collectionMembership: false,
      presentationMedia: [magnumPresentationMedia()],
    };

    render(
      await MuseumObjectPage({
        objectId: proposedWork.id,
        publication: publication(proposedWork),
        view: null,
      })
    );

    const loadButton = screen.getByRole("button", {
      name: "View image · loads 16.9 MB",
    });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    fireEvent.click(loadButton);
    const image = await screen.findByRole("img", {
      name: "A governed Magnum accession photograph.",
    });
    expect(image).toHaveAttribute("src", magnumPresentationMedia().mediaUrl);
    expect(
      screen.queryByRole("button", { name: /historical proposal image/u })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /download/u })
    ).not.toBeInTheDocument();
  });

  it("uses an aliased reviewed derivative before a large Magnum original", async () => {
    const magnumWork: MuseumPublicWork = {
      ...work([]),
      acquisitionIds: [MUSEUM_MAGNUM_ACQUISITION_ID],
      collectionMembership: true,
      presentationMedia: [magnumPresentationMedia()],
    };
    const magnumPublication: MuseumPublication = {
      ...publication(magnumWork),
      workAliases: [
        {
          kind: "work_source_alias",
          sourceObjectId: "6529NM-PG-2026-001.OBJ-005",
          workId: magnumWork.id,
          sourcePath: "records/entities/6529NM-W-0001.json",
        },
      ],
    };

    render(
      await MuseumObjectPage({
        objectId: magnumWork.id,
        publication: magnumPublication,
        view: viewWithReviewedProgramMedia("6529NM-PG-2026-001.OBJ-005"),
      })
    );

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute(
      "src",
      "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/640.webp"
    );
    expect(image).toHaveAttribute("srcset");
    expect(
      screen.queryByRole("button", { name: /loads 16\.9 MB/u })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Wave publication" })
    ).toHaveAttribute(
      "href",
      "https://6529.io/waves/5f207393-5418-4a75-8738-e40edb44a94d?drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0"
    );
  });

  it("links a metadata-only Work license through MuseumRightsLink", async () => {
    const licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
    render(
      await MuseumObjectPage({
        objectId: "6529NM-W-0001",
        publication: publication(
          work([], [metadata(rightsCredit(licenseUrl))])
        ),
        view: null,
      })
    );

    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toHaveAttribute(
      "href",
      licenseUrl
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps a governed metadata-only license label unlinked when no URL is published", async () => {
    render(
      await MuseumObjectPage({
        objectId: "6529NM-W-0001",
        publication: publication(work([], [metadata(rightsCredit(null))])),
        view: null,
      })
    );

    expect(screen.getByText("CC BY 4.0")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "CC BY 4.0" })
    ).not.toBeInTheDocument();
  });

  it("keeps selected Keys and Gates Work media fail-closed without reviewed program media", async () => {
    const selectedWork: MuseumPublicWork = {
      ...work([], [metadata(rightsCredit(null))]),
      status: "selected_through_acquisition_program_acquisition_pending",
      programIds: ["6529NM-AP-ENT-0002"],
      sourceRecordIds: ["6529NM-AP-01-OUT-001"],
    };
    const selectedPublication = {
      ...publication(selectedWork),
      acquisitionPrograms: [
        {
          kind: "acquisition_program",
          id: "6529NM-AP-ENT-0002",
          slug: "keys-and-gates",
          title: "Keys and Gates",
          status: "selection_complete",
          statusAsOf: "2026-08-09",
          acquisitionMethod: "other_authorized_method",
          acquisitionIds: [],
          sourceDocumentIds: [],
          sourcePaths: ["records/entities/6529NM-AP-ENT-0002.json"],
        },
      ],
    } as unknown as MuseumPublication;

    render(
      await MuseumObjectPage({
        objectId: selectedWork.id,
        publication: selectedPublication,
        view: null,
      })
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText("No public image is available for this record.")
    ).toBeInTheDocument();
  });

  it("uses reviewed responsive program media when a selected Work is metadata-only", async () => {
    const selectedWork: MuseumPublicWork = {
      ...work(
        [],
        [
          metadata(
            {
              ...rightsCredit(null),
              creditLine: "Wrong metadata entry.",
            },
            ["unrelated-source-record"]
          ),
          metadata(rightsCredit(null), ["6529NM-AP-01-OUT-001"]),
        ]
      ),
      status: "selected_through_acquisition_program_acquisition_pending",
      programIds: ["6529NM-AP-ENT-0002"],
      qualifiers: [
        {
          kind: "mint",
          status: "pending",
          sourcePath: "records/entities/6529NM-W-0001.json",
        },
      ],
      sourceRecordIds: ["6529NM-AP-01-OUT-001"],
    };

    render(
      await MuseumObjectPage({
        objectId: selectedWork.id,
        publication: publication(selectedWork),
        view: viewWithReviewedProgramMedia("6529NM-AP-01-OUT-001"),
      })
    );

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute(
      "src",
      "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/640.webp"
    );
    expect(image).toHaveAttribute("srcset");
    expect(
      screen.getByText("Selected through an acquisition program; unminted")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Selected and unminted. Acquisition and accession remain pending."
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Artist name, Work title.").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Wrong metadata entry.")).not.toBeInTheDocument();
    expect(screen.getByText("CC BY 4.0")).toBeInTheDocument();
  });

  it("omits an unrelated metadata credit for reviewed program media", async () => {
    const selectedWork: MuseumPublicWork = {
      ...work(
        [],
        [
          metadata(
            {
              ...rightsCredit(null),
              creditLine: "Unrelated metadata credit.",
            },
            ["unrelated-source-record"]
          ),
        ]
      ),
      status: "selected_through_acquisition_program_acquisition_pending",
      programIds: ["6529NM-AP-ENT-0002"],
      sourceRecordIds: ["6529NM-AP-01-OUT-001"],
    };

    render(
      await MuseumObjectPage({
        objectId: selectedWork.id,
        publication: publication(selectedWork),
        view: viewWithReviewedProgramMedia("6529NM-AP-01-OUT-001"),
      })
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(
      screen.queryByText("Unrelated metadata credit.")
    ).not.toBeInTheDocument();
  });

  it("restores Keys and Gates Work media after accession", async () => {
    const accessionedWork: MuseumPublicWork = {
      ...work([retainedMedia(rightsCredit(null))]),
      programIds: ["6529NM-AP-ENT-0002"],
    };
    const accessionedPublication = {
      ...publication(accessionedWork),
      acquisitionPrograms: [
        {
          kind: "acquisition_program",
          id: "6529NM-AP-ENT-0002",
          slug: "keys-and-gates",
          title: "Keys and Gates",
          status: "completed",
          statusAsOf: "2026-08-09",
          acquisitionMethod: "other_authorized_method",
          acquisitionIds: [],
          sourceDocumentIds: [],
          sourcePaths: ["records/entities/6529NM-AP-ENT-0002.json"],
        },
      ],
    } as unknown as MuseumPublication;

    render(
      await MuseumObjectPage({
        objectId: accessionedWork.id,
        publication: accessionedPublication,
        view: null,
      })
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://media.6529.io/governed/work-one.png"
    );
  });
});
