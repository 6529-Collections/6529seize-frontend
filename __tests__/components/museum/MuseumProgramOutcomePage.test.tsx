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
  media: {
    sourceUrl: "https://d3lqz0a4bldqgf.cloudfront.net/drops/work-original.jpg",
    sourceMimeType: "image/jpeg",
    sourceSha256: `sha256:${"a".repeat(64)}`,
    sourceByteSize: 12000000,
    sourceWidth: 6000,
    sourceHeight: 4000,
    altText: "A figure stands before a bright gate in a dark stone hall.",
    altTextStatus: "constructed_visual_description_pending_independent_review",
    variants: [
      {
        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/work-640.webp",
        width: 640,
        height: 427,
        mimeType: "image/webp",
        sha256: `sha256:${"b".repeat(64)}`,
        byteSize: 32000,
      },
      {
        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/work-1280.webp",
        width: 1280,
        height: 853,
        mimeType: "image/webp",
        sha256: `sha256:${"c".repeat(64)}`,
        byteSize: 110000,
      },
      {
        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/work-2400.webp",
        width: 2400,
        height: 1600,
        mimeType: "image/webp",
        sha256: `sha256:${"d".repeat(64)}`,
        byteSize: 410000,
      },
    ],
  },
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
    const image = screen.getByRole("img", {
      name: "A figure stands before a bright gate in a dark stone hall.",
    });
    expect(image).toHaveAttribute(
      "src",
      "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/work-640.webp"
    );
    expect(image).toHaveAttribute(
      "srcset",
      expect.stringContaining("work-2400.webp 2400w")
    );
    expect(image).toHaveAttribute("width", "640");
    expect(image).toHaveAttribute("height", "427");
    expect(
      screen.getByRole("link", {
        name: "Open submitted high-resolution image",
      })
    ).toHaveAttribute("href", outcome.media?.sourceUrl);
    expect(screen.getByText("Selected; unminted")).toBeInTheDocument();
    expect(screen.getByText("Selected for Keys and Gates")).toBeInTheDocument();
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
    ).toHaveAttribute("href", "/museum/network/acquisitions/keys-and-gates");
  });

  it("recognizes the canonical Keys and Gates program entity", () => {
    render(
      <MuseumProgramOutcomePage
        outcome={{ ...outcome, programId: "6529NM-AP-ENT-0002" }}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(screen.getByText("Selected for Keys and Gates")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Keys and Gates" })
    ).toHaveAttribute("href", "/museum/network/acquisitions/keys-and-gates");
  });

  it("does not apply Keys and Gates status copy to another program", () => {
    render(
      <MuseumProgramOutcomePage
        outcome={{ ...outcome, programId: "6529NM-AP-02" }}
        sourceCommit={"a".repeat(40)}
      />
    );

    expect(
      screen.queryByText("Selected for Keys and Gates")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back to program" })
    ).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="/museum/network/programs/"]')).toBe(
      null
    );
  });
});
