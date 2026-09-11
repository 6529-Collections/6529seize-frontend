import { render, screen } from "@testing-library/react";
import {
  buildMuseumAcquisitionLandingRecords,
  MuseumAcquisitionLandingPage,
} from "@/components/museum/acquisition/MuseumAcquisitionLanding";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import type {
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";

function work(
  id: string,
  title: string,
  status: MuseumPublicWork["status"],
  acquisitionId: string
): MuseumPublicWork {
  return {
    kind: "work",
    id,
    slug: title.toLocaleLowerCase().replaceAll(" ", "-"),
    title,
    medium: "Digital work",
    artistId: "artist-casey",
    projectId: null,
    status,
    statusAsOf: "2026-08-12",
    collectionMembership: status === "accessioned_into_permanent_collection",
    acquisitionIds: [acquisitionId],
    programIds: [],
    media: [
      {
        id: `${id}-media`,
        artworkId: id,
        kind: "still",
        role: "source",
        mediaType: "image/png",
        width: 1200,
        height: 1200,
        altText: `${title} by Casey Reas`,
        credit: {
          creditLine: "Gift of punk6529.",
          licenseLabel: "CC BY-NC 4.0",
          licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
          rightsExpressionId: null,
          sourcePath: `records/entities/${id}.json`,
        },
        sourcePath: `records/entities/${id}.json`,
        custody: "retained",
        url: `https://museum.test/${id}.png`,
        preservationStatus: "retained_verified",
        sha256: null,
        upstreamProvider: null,
      },
    ],
    documentIds: [],
    qualifiers: [],
    sourceRecordIds: [`records/entities/${id}.json`],
    sourcePaths: [`records/entities/${id}.json`],
  };
}

function acquisition(
  id: string,
  slug: string,
  title: string,
  status: MuseumAcquisitionViewModel["status"],
  workId: string,
  programId: string | null,
  acquisitionMethod: MuseumAcquisitionViewModel["acquisitionMethod"] = programId ===
  null
    ? "donation"
    : "purchase"
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
    thesis: `A coherent group of works: ${title}.`,
    acquisitionMethod,
    programId,
    pathway: programId === null ? "Gift Acquisitions" : "Keys and Gates",
    artistIds: ["artist-casey"],
    organizationIds: [],
    projectIds: [],
    workIds: [workId],
    accessionLotIds:
      status === "accessioned_into_permanent_collection"
        ? ["6529NM.2026.001"]
        : [],
    sourceDocumentIds: [],
    sourcePaths: [`records/entities/${id}.json`],
    presentationMedia: [],
  };
}

function publication(
  works: readonly MuseumPublicWork[],
  acquisitions: readonly MuseumAcquisitionViewModel[]
): MuseumPublication {
  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: "main",
      commit: "a".repeat(40),
      manifestPath: "release-artifacts/manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: works.length,
      assembledAt: "2026-08-12T00:00:00Z",
    },
    declaredSourcePaths: [],
    artists: [
      {
        id: "artist-casey",
        slug: "casey-reas",
        preferredName: "Casey Reas",
        projectIds: [],
        artworkIds: [],
        workIds: works.map((item) => item.id),
        documentIds: [],
        sourcePaths: [],
      },
    ],
    projects: [],
    gifts: [],
    artworks: [],
    works,
    curatedAcquisitions: acquisitions as never,
    documents: [],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  };
}

describe("Museum acquisitions landing", () => {
  it("keeps accessioned holdings and acquisition processing visibly distinct", () => {
    const casey = acquisition(
      "casey-acquisition",
      "the-system-in-seven-states",
      "The System in Seven States",
      "accessioned_into_permanent_collection",
      "casey-work",
      null
    );
    const keys = acquisition(
      "keys-acquisition",
      "keys-and-gates",
      "Keys and Gates",
      "selected_through_acquisition_program_acquisition_pending",
      "keys-work",
      "keys-program"
    );
    const magnum = acquisition(
      "magnum-acquisition",
      "conflict-at-its-edges",
      "Conflict at Its Edges",
      "accessioned_into_permanent_collection",
      "magnum-work",
      "gift-program",
      "donation"
    );
    const records = buildMuseumAcquisitionLandingRecords(
      publication(
        [
          work(
            "casey-work",
            "CENTURY #31",
            "accessioned_into_permanent_collection",
            casey.id
          ),
          work(
            "keys-work",
            "Take the Key!",
            "selected_through_acquisition_program_acquisition_pending",
            keys.id
          ),
          work(
            "magnum-work",
            "Palmyra",
            "accessioned_into_permanent_collection",
            magnum.id
          ),
        ],
        [casey, keys, magnum]
      ),
      [casey, keys, magnum],
      null
    );

    expect(records).toHaveLength(3);
    render(<MuseumAcquisitionLandingPage records={records} />);

    expect(
      screen.getByRole("heading", { name: "Acquisitions" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The System in Seven States" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Keys and Gates" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Conflict at Its Edges" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Accessioned into the permanent Collection")
    ).toHaveLength(2);
    expect(
      screen.getByText("Selected through an acquisition program; unminted")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Gift acquisition")).toHaveLength(2);
    expect(screen.getAllByText("Acquisition program")).toHaveLength(1);
    expect(screen.queryByText(/connected work/u)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("museum-acquisition-card")).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    for (const card of screen.getAllByTestId("museum-acquisition-card")) {
      expect(card.querySelector(".tw-aspect-\\[4\\/3\\]")).not.toBeNull();
      expect(card.querySelector(".lg\\:tw-aspect-\\[4\\/5\\]")).not.toBeNull();
    }
  });

  it("keeps proposal disclosure controls outside navigation links", () => {
    const magnum = {
      ...acquisition(
        "6529NM-CA-2026-003",
        "conflict-at-its-edges",
        "Conflict at Its Edges",
        "accessioned_into_permanent_collection",
        "magnum-work",
        null
      ),
      presentationMedia: [
        {
          id: "magnum-presentation",
          kind: "external_proposal_presentation",
          mediaUrl: "https://museum.test/palmyra.jpg",
          mediaMimeType: "image/jpeg",
          sourceByteSize: 16_900_000,
          width: 1600,
          height: 1067,
          altText: "Palmyra by Lorenzo Meloni",
          source: {
            kind: "signed_wave_storm",
            waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
            dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
            partId: 1,
            serial: 1,
            publicationRecordId: "proposal-magnum",
            contextEntityId: "6529NM-CA-2026-003",
            sourcePath: "records/entities/media-reference.json",
            mediaRecordPath: "records/entities/media-reference.json",
            sourceCommit: "a".repeat(40),
          },
          credit: {
            creditLine: "© Lorenzo Meloni/Magnum Photos 2022.",
            sourcePath: "records/entities/media-reference.json",
          },
          rights: {
            status: "presentation_only",
            licenseLabel: "All Rights Reserved",
            licenseUrl: null,
          },
          download: "not_permitted",
          preservation: "not_retained",
          affordances: ["view", "thumbnail", "hero", "alt"],
        },
      ],
    } satisfies MuseumAcquisitionViewModel;
    const magnumWork = work(
      "magnum-work",
      "Palmyra",
      "accessioned_into_permanent_collection",
      magnum.id
    );
    const magnumWorkWithoutRetainedMedia: MuseumPublicWork = {
      ...magnumWork,
      media: [],
    };
    const records = buildMuseumAcquisitionLandingRecords(
      publication([magnumWorkWithoutRetainedMedia], [magnum]),
      [magnum],
      null
    );

    render(<MuseumAcquisitionLandingPage records={records} />);

    expect(
      screen.getByRole("button", {
        name: /View image.*loads 16\.9 MB/u,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("img", { name: "Palmyra by Lorenzo Meloni" })
    ).toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "View Wave publication" })
    ).toHaveAttribute(
      "href",
      "https://6529.io/waves/5f207393-5418-4a75-8738-e40edb44a94d?drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0"
    );
    for (const link of screen.getAllByRole("link", {
      name: "Conflict at Its Edges",
    })) {
      expect(link).toHaveAttribute(
        "href",
        "/museum/network/acquisitions/conflict-at-its-edges"
      );
    }
  });

  it("fails closed when a declared Work cannot be resolved", () => {
    const record = acquisition(
      "missing-acquisition",
      "missing",
      "Missing group",
      "accessioned_into_permanent_collection",
      "missing-work",
      null
    );
    expect(
      buildMuseumAcquisitionLandingRecords(
        publication([], [record]),
        [record],
        null
      )
    ).toEqual([]);
  });
});
