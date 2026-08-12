import { render, screen } from "@testing-library/react";
import { MuseumObjectPage } from "@/components/museum/MuseumObjectPage";
import type {
  MuseumMedia,
  MuseumMediaMetadata,
  MuseumPublication,
  MuseumPublicWork,
  MuseumRightsCredit,
} from "@/lib/museum/publication/types";
import type { MuseumProgramMedia, MuseumView } from "@/lib/museum/types";

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

function metadata(credit: MuseumRightsCredit): MuseumMediaMetadata {
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
      ...work([], [metadata(rightsCredit(null))]),
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

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute(
      "src",
      "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/640.webp"
    );
    expect(image).toHaveAttribute("srcset");
    expect(
      screen.getAllByText("Artist name, Work title.").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("CC BY 4.0")).toBeInTheDocument();
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
