import { render, screen } from "@testing-library/react";
import { MuseumMediaMetadataPlaceholder } from "@/components/museum/MuseumMediaMetadataPlaceholder";
import type { MuseumMediaMetadata } from "@/lib/museum/publication/types";

const metadata: MuseumMediaMetadata = {
  id: "6529NM-MED-0003",
  artworkId: "6529NM-W-0024",
  role: "historical_wave_proposal_presentation",
  mediaType: "image/jpeg",
  width: 2400,
  height: 1600,
  altText: "A governed source photograph.",
  credit: {
    creditLine: "© artist / Magnum Photos. All Rights Reserved.",
    licenseLabel: "All Rights Reserved",
    licenseUrl: null,
    rightsExpressionId: null,
    sourcePath: "records/entities/6529NM-MED-0003.json",
  },
  sourcePath: "records/entities/6529NM-MED-0003.json",
  context: {
    kind: "wave_proposal",
    waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
    dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
    publicationRecordId: "6529NM-PG-2026-001",
    acquisitionId: "6529NM-CA-2026-003",
    sourcePath: "records/entities/6529NM-MED-0003.json",
    openHref:
      "https://6529.io/waves/5f207393-5418-4a75-8738-e40edb44a94d?drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0",
  },
};

describe("MuseumMediaMetadataPlaceholder", () => {
  it("shows a dignified metadata-only state without an image or media locator", () => {
    render(
      <MuseumMediaMetadataPlaceholder
        title="Conflict at Its Edges"
        metadata={metadata}
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText("No public image is available for this record.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("A governed source photograph.", { exact: false })
    ).toBeInTheDocument();
    expect(
      screen.getByText("© artist / Magnum Photos. All Rights Reserved.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("All Rights Reserved", { exact: true })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Wave proposal context" })
    ).toHaveAttribute("href", metadata.context?.openHref);
  });
});
