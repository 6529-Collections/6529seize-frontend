import { render, screen } from "@testing-library/react";
import { MuseumAcquisitionRecordPage } from "@/components/museum/MuseumAcquisitionRecordPage";
import type { MuseumAcquisitionViewModel } from "@/lib/museum/publication/ia";
import type {
  MuseumArtist,
  MuseumMediaMetadata,
  MuseumPublication,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";

const WAVE_CONTEXT_HREF =
  "https://6529.io/waves/5f207393-5418-4a75-8738-e40edb44a94d?drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0";

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
  mediaMetadata: MuseumMediaMetadata
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
    programIds: [],
    media: [],
    mediaMetadata: [mediaMetadata],
    documentIds: [],
    qualifiers: [],
    sourcePaths: [],
  };
}

function acquisition(
  id: string,
  slug: string,
  title: string,
  status: MuseumAcquisitionViewModel["status"],
  workId: string
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
    programId: null,
    pathway: null,
    artistIds: [],
    organizationIds: [],
    projectIds: [],
    workIds: [workId],
    accessionLotIds: [],
    sourceDocumentIds: [],
    sourcePaths: [],
    presentationMedia: [],
  };
}

function publication(
  artists: readonly MuseumArtist[],
  works: readonly MuseumPublicWork[]
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
    documents: [],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  };
}

function expectEditorialOrder(
  workTitle: string,
  artistName: string,
  lifecycle: string
): void {
  const figure = screen.getByText(artistName).closest("figure");
  expect(figure).not.toBeNull();
  const text = figure?.textContent ?? "";
  expect(text.indexOf(workTitle)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(artistName)).toBeGreaterThan(text.indexOf(workTitle));
  expect(text.indexOf(lifecycle)).toBeGreaterThan(text.indexOf(artistName));
}

describe("MuseumAcquisitionRecordPage metadata-only presentations", () => {
  it("renders Keys and Gates text-only works with the selected acquisition status and qualifier", () => {
    const workTitle = "A Door Opens";
    const artistName = "Anni Artist";
    const lifecycle =
      "Selected through an acquisition program; acquisition pending";
    const qualifier = "Not yet minted or accessioned.";
    const workId = "6529NM-W-0008";

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-keys-and-gates",
          "keys-and-gates",
          "Keys and Gates",
          "selected_through_acquisition_program_acquisition_pending",
          workId
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
              )
            ),
          ]
        )}
        view={null}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Keys and Gates" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No public image is available for this record.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("A photographic work from the Keys and Gates program.")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(lifecycle, { exact: true }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(qualifier, { exact: true })).toBeInTheDocument();
    expectEditorialOrder(workTitle, artistName, lifecycle);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(
      "selected_through_acquisition_program_acquisition_pending"
    );
    expect(document.body.textContent).not.toContain("https://example.invalid");
    expect(
      screen.queryByRole("link", { name: "Open Wave proposal context" })
    ).not.toBeInTheDocument();
  });

  it("renders Magnum metadata-only works with the Wave context link only when modeled", () => {
    const workTitle = "Conflict at Its Edges";
    const artistName = "M. Artist";
    const lifecycle = "Selected by Museum Wave; acquisition review in progress";
    const workId = "6529NM-W-0024";

    render(
      <MuseumAcquisitionRecordPage
        acquisition={acquisition(
          "acquisition-wave-selection",
          "wave-selection",
          "Wave selection",
          "selected_by_museum_wave_acquisition_review_in_progress",
          workId
        )}
        publication={publication(
          [artist("artist-m", artistName)],
          [
            work(
              workId,
              workTitle,
              "artist-m",
              "selected_by_museum_wave_acquisition_review_in_progress",
              metadata(
                "media-wave-proposal",
                workId,
                "© artist / Magnum Photos.",
                "A governed presentation photograph.",
                {
                  kind: "wave_proposal",
                  waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
                  dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
                  publicationRecordId: "publication-wave-selection",
                  acquisitionId: "acquisition-wave-selection",
                  sourcePath: "records/entities/media-wave-proposal.json",
                  openHref: WAVE_CONTEXT_HREF,
                }
              )
            ),
          ]
        )}
        view={null}
        sourceCommit={"b".repeat(40)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Wave selection" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("No public image is available for this record.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("A governed presentation photograph.")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(lifecycle, { exact: true }).length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Not yet minted or accessioned.", { exact: true })
    ).not.toBeInTheDocument();
    expectEditorialOrder(workTitle, artistName, lifecycle);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Wave proposal context" })
    ).toHaveAttribute("href", WAVE_CONTEXT_HREF);
    expect(document.body.textContent).not.toContain(
      "selected_by_museum_wave_acquisition_review_in_progress"
    );
    expect(document.body.textContent).not.toContain(
      "https://d3lqz0a4bldqgf.cloudfront.net"
    );
  });
});
