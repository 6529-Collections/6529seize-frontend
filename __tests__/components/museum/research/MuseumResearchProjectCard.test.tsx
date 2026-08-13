import { render, screen } from "@testing-library/react";
import { MuseumResearchProjectCard } from "@/components/museum/research/MuseumResearchProjectCard";
import type { MuseumMedia } from "@/lib/museum/publication/types";

const PORTRAIT_MEDIA: MuseumMedia = {
  id: "magnum-portrait",
  artworkId: "work-portrait",
  kind: "still",
  role: "source",
  mediaType: "image/jpeg",
  width: 1000,
  height: 1500,
  altText: "A portrait photograph.",
  credit: {
    creditLine: "Museum record",
    licenseLabel: "All Rights Reserved",
    licenseUrl: null,
    rightsExpressionId: null,
    sourcePath: "records/media/portrait.json",
  },
  sourcePath: "records/media/portrait.json",
  custody: "retained",
  url: "https://example.com/portrait.jpg",
  preservationStatus: "retained_verified",
  sha256: `sha256:${"c".repeat(64)}`,
  upstreamProvider: null,
};

describe("MuseumResearchProjectCard", () => {
  it("matches portrait media frames to the source ratio", () => {
    render(
      <MuseumResearchProjectCard
        project={{
          id: "portrait-project",
          href: "/museum/network/projects/portrait-project",
          title: "Portrait Project",
          artistNames: ["An Artist"],
          workCount: 1,
          media: PORTRAIT_MEDIA,
        }}
      />
    );

    expect(
      screen.getByRole("img", { name: PORTRAIT_MEDIA.altText! })
    ).toHaveAttribute("src", PORTRAIT_MEDIA.url);
    expect(screen.getByRole("img").parentElement?.style.aspectRatio).toBe(
      "0.6666666666666666"
    );
  });

  it("shows accession-reviewed presentation media without bogus empty metadata", () => {
    render(
      <MuseumResearchProjectCard
        project={{
          id: "6529NM-PRJ-0006",
          href: "/museum/network/projects/magnum-photos-75",
          title: "Magnum Photos 75",
          artistNames: [],
          workCount: 5,
          presentationMedia: {
            id: "magnum-75-127",
            kind: "external_proposal_presentation",
            mediaUrl: "https://example.com/magnum-75-127.jpg",
            mediaMimeType: "image/jpeg",
            sourceByteSize: 16_900_000,
            width: 1600,
            height: 1067,
            altText: "David Seymour's 1952 photograph of the Negev border.",
            source: {
              kind: "signed_wave_storm",
              waveId: "wave-id",
              dropId: "drop-id",
              partId: 1,
              serial: 1,
              publicationRecordId: "publication-id",
              contextEntityId: "6529NM-CA-2026-003",
              sourcePath: "records/media/reference.json",
              mediaRecordPath: "records/media/reference.json",
              sourceCommit: "a5b64f7",
            },
            credit: {
              creditLine: "© David Seymour/Magnum Photos 2022",
              sourcePath: "records/media/reference.json",
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
        }}
      />
    );

    expect(
      screen.getByRole("img", {
        name: "David Seymour's 1952 photograph of the Negev border.",
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText(/loads 16\.9 MB/i)).not.toBeInTheDocument();
  });
});
