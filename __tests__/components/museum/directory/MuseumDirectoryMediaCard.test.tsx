import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MuseumDirectoryArtistCard,
  MuseumDirectoryWorkCard,
} from "@/components/museum/directory/MuseumDirectoryMediaCard";
import type {
  MuseumDirectoryArtistRecord,
  MuseumDirectoryWorkRecord,
} from "@/components/museum/directory/MuseumDirectoryData";
import type {
  MuseumExternalProposalPresentationMedia,
  MuseumMediaMetadata,
  MuseumPublicWork,
} from "@/lib/museum/publication/types";

const presentation: MuseumExternalProposalPresentationMedia = {
  id: "presentation-01",
  kind: "external_proposal_presentation",
  mediaUrl: "https://example.com/proposal.jpg",
  mediaMimeType: "image/jpeg",
  sourceByteSize: 16_871_807,
  width: 2400,
  height: 1600,
  altText: "A governed proposal photograph.",
  source: {
    kind: "signed_wave_storm",
    waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
    dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
    partId: 1,
    serial: 1276093,
    publicationRecordId: "6529NM-PG-2026-001",
    contextEntityId: "6529NM-CA-2026-003",
    sourcePath: "records/media/presentation-01.json",
    mediaRecordPath: "records/media/presentation-01.json",
    sourceCommit: "a".repeat(40),
  },
  credit: {
    creditLine: "Â© photographer / Magnum Photos.",
    sourcePath: "records/media/presentation-01.json",
  },
  rights: {
    status: "presentation_only",
    licenseLabel: "All Rights Reserved",
    licenseUrl: null,
  },
  download: "not_permitted",
  preservation: "not_retained",
  affordances: ["view", "thumbnail", "alt", "open_upstream_presentation"],
};

const metadata: MuseumMediaMetadata = {
  id: "metadata-01",
  artworkId: "6529NM-W-0024",
  role: "historical_wave_proposal_presentation",
  mediaType: "image/jpeg",
  width: 2400,
  height: 1600,
  altText: "A governed source photograph.",
  credit: {
    creditLine: "Â© photographer / Magnum Photos.",
    licenseLabel: "All Rights Reserved",
    licenseUrl: null,
    rightsExpressionId: null,
    sourcePath: "records/media/metadata-01.json",
  },
  sourcePath: "records/media/metadata-01.json",
};

function record(
  overrides: Partial<MuseumPublicWork>
): MuseumDirectoryWorkRecord {
  const work: MuseumPublicWork = {
    kind: "work",
    id: "6529NM-W-0024",
    slug: "conflict-at-its-edges-01",
    title: "Conflict at Its Edges",
    medium: "Photograph",
    artistId: "artist-magnum",
    projectId: null,
    status: "accessioned_into_permanent_collection",
    statusAsOf: "2026-08-12",
    collectionMembership: true,
    acquisitionIds: ["6529NM-CA-2026-003"],
    programIds: [],
    media: [],
    documentIds: [],
    qualifiers: [],
    sourcePaths: ["records/entities/6529NM-W-0024.json"],
    ...overrides,
  };
  return {
    work,
    artist: null,
    artistName: "Magnum Photos",
    section: "permanent_collection",
    acquisitionTitle: "Conflict at Its Edges",
    programTitle: "Gift Acquisitions",
    contextTitle: "Conflict at Its Edges",
    relationship: "Accessioned into the permanent Collection",
  };
}

describe("MuseumDirectoryMediaStage", () => {
  it("shows governed presentation media directly in the directory", async () => {
    const user = userEvent.setup();
    render(
      <MuseumDirectoryWorkCard
        record={record({ presentationMedia: [presentation] })}
      />
    );

    const imageGate = screen.getByRole("button", {
      name: "View image · loads 16.9 MB",
    });
    expect(
      imageGate.closest('[style*="aspect-ratio"]')?.getAttribute("style")
    ).toContain("aspect-ratio: 2400 / 1600");
    await user.click(imageGate);
    const image = screen.getByRole("img", { name: presentation.altText });
    expect(image).toHaveAttribute("src", presentation.mediaUrl);
    expect(image).toHaveClass("tw-h-full", "tw-w-full", "tw-object-contain");
  });

  it("shows the governed presentation image on the artist card", async () => {
    const user = userEvent.setup();
    const workRecord = record({
      id: "6529NM-W-LORENZO-01",
      slug: "lorenzo-meloni-01",
      title: "Lorenzo Meloni 01",
      artistId: "artist-lorenzo-meloni",
      presentationMedia: [presentation],
    });
    const artistRecord: MuseumDirectoryArtistRecord = {
      artist: {
        id: "artist-lorenzo-meloni",
        slug: "lorenzo-meloni",
        preferredName: "Lorenzo Meloni",
        projectIds: [],
        artworkIds: [],
        documentIds: [],
        sourcePaths: ["records/entities/artist-lorenzo-meloni.json"],
      },
      works: [workRecord],
      permanentWorks: [workRecord],
      acquisitionWorks: [],
      relationship: "1 work in the permanent Collection",
      representative: workRecord,
    };

    render(<MuseumDirectoryArtistCard record={artistRecord} />);

    await user.click(
      screen.getByRole("button", { name: "View image · loads 16.9 MB" })
    );
    expect(
      screen.getByRole("img", { name: presentation.altText })
    ).toHaveAttribute("src", presentation.mediaUrl);
    expect(
      screen
        .getByRole("img", { name: presentation.altText })
        .closest(".tw-aspect-\\[4\\/3\\]")
    ).toBeInTheDocument();
  });

  it("fills and centers metadata-only states in the directory media frame", () => {
    render(
      <MuseumDirectoryWorkCard record={record({ mediaMetadata: [metadata] })} />
    );

    expect(screen.getByRole("group")).toHaveClass(
      "tw-h-full",
      "tw-items-center",
      "tw-justify-center"
    );
  });

  it("fills and centers a failed retained image state in the directory frame", () => {
    render(
      <MuseumDirectoryWorkCard
        record={record({
          media: [
            {
              id: "retained-01",
              artworkId: "6529NM-W-0024",
              kind: "still",
              role: "source",
              mediaType: "image/jpeg",
              width: null,
              height: null,
              altText: "A retained source photograph.",
              credit: metadata.credit,
              sourcePath: "records/media/retained-01.json",
              custody: "retained",
              url: "https://example.com/retained.jpg",
              preservationStatus: "retained_verified",
              sha256: null,
              upstreamProvider: null,
            },
          ],
        })}
      />
    );

    fireEvent.error(screen.getByRole("img"));
    expect(
      screen.getByRole("alert").closest(".tw-aspect-square")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass(
      "tw-h-full",
      "tw-items-center",
      "tw-justify-center"
    );
  });
});
