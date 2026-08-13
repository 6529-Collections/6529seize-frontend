import { render, screen } from "@testing-library/react";
import { MuseumResearchProjectCard } from "@/components/museum/research/MuseumResearchProjectCard";

describe("MuseumResearchProjectCard", () => {
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
