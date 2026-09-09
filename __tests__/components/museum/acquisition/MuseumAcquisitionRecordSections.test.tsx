import { render, screen } from "@testing-library/react";
import { AcquisitionDocumentSection } from "@/components/museum/acquisition/MuseumAcquisitionRecordSections";
import { museumAcquisitionWorkCountLabel } from "@/components/museum/acquisition/MuseumAcquisitionCopy";
import type { MuseumPublicDocument } from "@/lib/museum/publication/types";

function documentFor(
  sourcePath: string,
  kind: MuseumPublicDocument["kind"] = "source_record"
): MuseumPublicDocument {
  return {
    id: "museum-document-1",
    kind,
    title: "Earlier status record",
    markdown: '{"status":"selected"}',
    sha256: null,
    sourcePath,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

describe("Museum acquisition record document history", () => {
  it("uses museum language for singular and plural work counts", () => {
    expect(museumAcquisitionWorkCountLabel(1)).toBe("1 work");
    expect(museumAcquisitionWorkCountLabel(7)).toBe("7 works");
    expect(museumAcquisitionWorkCountLabel(16)).toBe("16 works");
  });

  it("recognizes status observations and amendments as historical records", () => {
    const props = { sourceCommit: "a".repeat(40), workHrefs: {} } as const;
    const { rerender } = render(
      <AcquisitionDocumentSection
        document={documentFor(
          "records/acquisitions/keys-and-gates/status-amendments/2026-08-12.json"
        )}
        {...props}
      />
    );
    expect(screen.getByText("Historical record")).toBeInTheDocument();

    rerender(
      <AcquisitionDocumentSection
        document={documentFor(
          "records/acquisitions/keys-and-gates/current-record.json"
        )}
        {...props}
      />
    );
    expect(screen.queryByText("Historical record")).not.toBeInTheDocument();

    rerender(
      <AcquisitionDocumentSection
        document={documentFor(
          "records/acquisitions/keys-and-gates/status-amendments/2026-08-12.json",
          "acquisition_essay"
        )}
        {...props}
      />
    );
    expect(screen.queryByText("Historical record")).not.toBeInTheDocument();
  });

  it("shows the historical marker in the rendered record section", () => {
    render(
      <AcquisitionDocumentSection
        document={documentFor(
          "records/acquisitions/keys-and-gates/wave-publication-observation-2026-08-12.json"
        )}
        sourceCommit={"a".repeat(40)}
        workHrefs={{}}
      />
    );

    expect(screen.getByText("Historical record")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This document preserves an earlier proposal or status observation; the current accession status is shown above."
      )
    ).toBeInTheDocument();
  });
});
