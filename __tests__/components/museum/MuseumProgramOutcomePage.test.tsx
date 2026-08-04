import { render, screen } from "@testing-library/react";
import { MuseumProgramOutcomePage } from "@/components/museum/MuseumProgramOutcomePage";
import type { MuseumObjectRecord } from "@/lib/museum/types";

const outcome: MuseumObjectRecord = {
  objectId: "6529NM-AP-01-OUT-001",
  accessionLotId: null,
  title: "Take the Key!",
  artist: "GulYildiz",
  artistStatement: "A door becomes a question of passage.",
  classification: "Photographic work",
  status: "selected_unminted",
  statusAsOf: "2026-08-01T15:03:35Z",
  programId: "6529NM-AP-01",
  imageUrl: "https://d3lqz0a4bldqgf.cloudfront.net/drops/work.jpg",
  imageMimeType: "image/jpeg",
  imageRetrievalStatus: "source URL observed",
  selectionPlace: 1,
  selectionDate: "2026-07-09T12:00:00Z",
  selectionSourceUrl:
    "https://6529.io/waves/4ff022b3-aa17-4a0a-ba78-58f64ff1d427",
  rightsStatus: "unverified until acquisition",
  scope: "Program outcome; not an accession statement.",
  sourcePath: "records/programs/6529NM-AP-01/outcomes/OUT-001.json",
  record: { record_type: "PROGRAM_OUTCOME" },
};

describe("MuseumProgramOutcomePage", () => {
  it("presents the photograph before its evidence and preserves selection boundaries", () => {
    render(
      <MuseumProgramOutcomePage
        outcome={outcome}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Take the Key!" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Take the Key! by GulYildiz" })
    ).toHaveAttribute("src", outcome.imageUrl);
    expect(screen.getByText("Selected; unminted")).toBeInTheDocument();
    expect(
      screen.getByText("A door becomes a question of passage.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Selected place 1/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source record" })).toHaveAttribute(
      "href",
      expect.stringContaining(`/blob/${"a".repeat(40)}/`)
    );
    expect(
      screen.getByRole("link", { name: "Back to Keys and Gates" })
    ).toHaveAttribute("href", "/museum/network/programs/6529NM-AP-01");
  });
});
