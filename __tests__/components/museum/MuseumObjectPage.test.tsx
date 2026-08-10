import { render, screen } from "@testing-library/react";
import { MuseumObjectPage } from "@/components/museum/MuseumObjectPage";
import type {
  MuseumMedia,
  MuseumMediaMetadata,
  MuseumPublication,
  MuseumPublicWork,
  MuseumRightsCredit,
} from "@/lib/museum/publication/types";

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

describe("MuseumObjectPage canonical typed Work rights", () => {
  it("renders the governed still and never decodes a preceding live locator as an image", async () => {
    const credit = rightsCredit(
      "https://creativecommons.org/licenses/by/4.0/"
    );
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
});
