import { render, screen } from "@testing-library/react";
import {
  AcquisitionWorkFigure,
  MuseumProposalPresentationMedia,
  type AcquisitionWorkCard,
} from "@/components/museum/acquisition/MuseumAcquisitionExhibition";
import type { MuseumExternalProposalPresentationMedia } from "@/lib/museum/publication/types";

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

const work: AcquisitionWorkCard = {
  id: "6529NM-W-0024",
  href: "/museum/network/works/6529NM-W-0024",
  title: "Conflict at Its Edges",
  artist: "Magnum Photos",
  presentationMedia: presentation,
};

const keysAndGatesPresentation: MuseumExternalProposalPresentationMedia = {
  ...presentation,
  id: "keys-and-gates-presentation-01",
  source: {
    ...presentation.source,
    contextEntityId: "6529NM-CA-2026-002",
  },
};

const magnumRightsCaption =
  "Copyright remains with the photographer and Magnum Photos. The Museum presents this image in the context of the accession under its recorded institutional-display interpretation. No general reproduction, commercial, derivative, licensing, download, or AI-training rights are granted.";
const keysAndGatesRightsCaption =
  "This image represents a selected, unminted work from Keys and Gates. It is shown in the acquisition-program context and does not represent accession into the Museum's permanent Collection.";

describe("AcquisitionWorkFigure media policy", () => {
  it("shows a large presentation source in the art-first exhibition frame", () => {
    render(
      <AcquisitionWorkFigure
        work={work}
        eager
        exhibitionPresentation
        featured
      />
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      presentation.mediaUrl
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the same large source behind an intentional view in a directory-style frame", () => {
    render(<AcquisitionWorkFigure work={work} eager />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveClass(
      "tw-h-full",
      "tw-items-center",
      "tw-justify-center"
    );
  });

  it("distinguishes Magnum accession presentation from Keys and Gates selection presentation", () => {
    render(
      <>
        <AcquisitionWorkFigure work={work} />
        <MuseumProposalPresentationMedia
          media={[keysAndGatesPresentation]}
          presentationContext="keys_and_gates_selection"
        />
      </>
    );

    expect(screen.getByText(magnumRightsCaption)).toBeInTheDocument();
    expect(screen.getByText(keysAndGatesRightsCaption)).toBeInTheDocument();
  });
});
