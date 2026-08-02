import { normalizeMuseumCorpus } from "@/lib/museum/normalize";
import type { MuseumCorpus, MuseumDocument } from "@/lib/museum/types";

function jsonDocument(path: string, value: unknown): MuseumDocument {
  return {
    path,
    sha256: `sha256:${"a".repeat(64)}`,
    size: JSON.stringify(value).length,
    contentType: "json",
    text: JSON.stringify(value),
  };
}

describe("Museum domain mapping", () => {
  it("keeps selection, accession, and object records distinct", () => {
    const corpus: MuseumCorpus = {
      sourceState: "fresh",
      release: null,
      documents: {
        "records/collections/approved-collections.json": jsonDocument(
          "records/collections/approved-collections.json",
          {
            collections: [
              {
                approval_id: "COL-001",
                preferred_name: "Autoglyphs",
                scope_definition: "The canonical collection.",
                category: "generative art",
                status: "approved",
                decision_id: "GOV-001",
                exclusions: [],
              },
            ],
          }
        ),
        "records/accessions/register.json": jsonDocument(
          "records/accessions/register.json",
          {
            lots: [
              {
                accession_lot_id: "6529NM.2026.001",
                preferred_title: "Casey Reas donation",
                object_count: 7,
                donation_status: "received",
                accession_status: "documentation_in_progress",
                completion_limits: ["Object records remain in construction."],
              },
            ],
          }
        ),
        "records/programs/6529NM-AP-01/program.json": jsonDocument(
          "records/programs/6529NM-AP-01/program.json",
          {
            program_id: "6529NM-AP-01",
            title: "Keys and Gates",
            status: "selection_complete_acquisition_and_accession_unverified",
            curatorial_frame: { premise: "A program." },
            non_claims: ["Selection is not accession."],
          }
        ),
        "records/programs/6529NM-AP-01/selected-works.json": jsonDocument(
          "records/programs/6529NM-AP-01/selected-works.json",
          {
            works: [
              {
                record_id: "6529NM-AP-01-OUT-001",
                status: "selected_unminted",
                artist: "Artist",
                title: "Selected work",
                outcome_record: "outcomes/OUT-001.json",
              },
            ],
          }
        ),
        "records/programs/6529NM-AP-01/outcomes/OUT-001.json": jsonDocument(
          "records/programs/6529NM-AP-01/outcomes/OUT-001.json",
          {
            record_type: "PROGRAM_OUTCOME",
            record_id: "6529NM-AP-01-OUT-001",
            status: "selected_unminted",
            artist: { handle: "Artist" },
            title: "Selected work",
            record_scope: "Not an accession statement.",
          }
        ),
        "records/accessions/6529NM.2026.001/objects/object-001.json":
          jsonDocument(
            "records/accessions/6529NM.2026.001/objects/object-001.json",
            {
              envelope: {
                event_type: "MUSEUM_RECORD_COMMITTED",
              },
              payload: {
                record_type: "WORK_DESCRIPTION",
                object_id: "6529NM.2026.001.001",
                accession_lot_id: "6529NM.2026.001",
                current_state: "accessioned",
                artist: { preferred_name: "Casey REAS" },
                title: "Object record",
                medium: "On-chain generative software.",
                claims: {
                  artist_statement: "An artist statement.",
                  museum_interpretation: "A declared accession object.",
                },
              },
            }
          ),
      },
    };

    const view = normalizeMuseumCorpus(corpus);
    expect(view.approvedCollections).toHaveLength(1);
    expect(view.accessions[0]?.accessionStatus).toBe(
      "documentation_in_progress"
    );
    expect(view.programs[0]?.selectedWorks[0]?.status).toBe(
      "selected_unminted"
    );
    expect(view.objects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectId: "6529NM.2026.001.001",
          accessionLotId: "6529NM.2026.001",
          title: "Object record",
          artist: "Casey REAS",
          artistStatement: "An artist statement.",
          classification: "On-chain generative software.",
          status: "accessioned",
          scope: "A declared accession object.",
          record: expect.objectContaining({
            payload: expect.objectContaining({
              record_type: "WORK_DESCRIPTION",
            }),
          }),
        }),
      ])
    );
    expect(view.objects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectId: "6529NM-AP-01-OUT-001",
          accessionLotId: null,
        }),
      ])
    );
  });
});
