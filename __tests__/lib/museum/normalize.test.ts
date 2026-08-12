import {
  findReviewedProgramMedia,
  normalizeMuseumCorpus,
} from "@/lib/museum/normalize";
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
            curatorial_frame: {
              premise: "A program.",
              outcome_interpretation:
                "A registrarial status statement that does not belong in the curatorial frame.",
            },
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
            artist_statement: { text: "A legacy artist statement." },
            as_of: "2026-08-01T15:03:35Z",
            program_id: "6529NM-AP-01",
            media: [
              {
                url: "https://d3lqz0a4bldqgf.cloudfront.net/drops/work.jpg",
                mime_type: "image/jpeg",
                retrieval_status: "source URL observed",
              },
            ],
            selection_evidence: {
              winner_place: 1,
              decision_at: "2026-07-09T12:00:00Z",
              wave_url:
                "https://6529.io/waves/4ff022b3-aa17-4a0a-ba78-58f64ff1d427",
            },
            rights_and_consent: {
              rights_effective_status: "unverified until acquisition",
            },
            record_scope: "Not an accession statement.",
          }
        ),
        "records/programs/6529NM-AP-01/public/presentation-manifest.json":
          jsonDocument(
            "records/programs/6529NM-AP-01/public/presentation-manifest.json",
            {
              items: [
                {
                  record_id: "6529NM-AP-01-OUT-001",
                  source: {
                    url: "https://d3lqz0a4bldqgf.cloudfront.net/drops/work.jpg",
                    mime_type: "image/jpeg",
                    sha256: `sha256:${"b".repeat(64)}`,
                    byte_size: 12000000,
                    pixel_width: 6000,
                    pixel_height: 4000,
                  },
                  presentation: {
                    alt_text:
                      "A figure stands before a bright gate in a dark stone hall.",
                    alt_text_status:
                      "constructed_visual_description_pending_independent_review",
                    derivatives: [
                      {
                        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/640.webp",
                        width: 640,
                        height: 427,
                        mime_type: "image/webp",
                        sha256: `sha256:${"c".repeat(64)}`,
                        byte_size: 32000,
                      },
                      {
                        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/1280.webp",
                        width: 1280,
                        height: 853,
                        mime_type: "image/webp",
                        sha256: `sha256:${"d".repeat(64)}`,
                        byte_size: 110000,
                      },
                      {
                        url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/2400.webp",
                        width: 2400,
                        height: 1600,
                        mime_type: "image/webp",
                        sha256: `sha256:${"e".repeat(64)}`,
                        byte_size: 410000,
                      },
                    ],
                  },
                },
              ],
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
                artist: { preferred_name: "", handle: "Casey REAS" },
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
    expect(findReviewedProgramMedia(view, ["6529NM-AP-01-OUT-001"])).toEqual(
      view.programs[0]?.selectedWorks[0]?.media
    );
    expect(findReviewedProgramMedia(view, ["unrelated-record"])).toBeNull();
    expect(view.approvedCollections).toHaveLength(1);
    expect(view.accessions[0]?.accessionStatus).toBe(
      "documentation_in_progress"
    );
    expect(view.programs[0]?.selectedWorks[0]?.status).toBe(
      "selected_unminted"
    );
    expect(view.programs[0]?.curatorialFrame).toBe("A program.");
    expect(view.programs[0]?.selectedWorks[0]).toEqual(
      expect.objectContaining({
        media: expect.objectContaining({
          sourceUrl: "https://d3lqz0a4bldqgf.cloudfront.net/drops/work.jpg",
          altText: "A figure stands before a bright gate in a dark stone hall.",
          variants: expect.arrayContaining([
            expect.objectContaining({ width: 640, height: 427 }),
          ]),
        }),
      })
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
          artistStatement: "A legacy artist statement.",
          programId: "6529NM-AP-01",
          media: expect.objectContaining({
            sourceUrl: "https://d3lqz0a4bldqgf.cloudfront.net/drops/work.jpg",
            variants: expect.arrayContaining([
              expect.objectContaining({ width: 1280, height: 853 }),
              expect.objectContaining({ width: 2400, height: 1600 }),
            ]),
          }),
          selectionPlace: 1,
          selectionDate: "2026-07-09T12:00:00Z",
          selectionSourceUrl:
            "https://6529.io/waves/4ff022b3-aa17-4a0a-ba78-58f64ff1d427",
          rightsStatus: "unverified until acquisition",
        }),
      ])
    );

    const mediaManifestPath =
      "records/programs/6529NM-AP-01/public/presentation-manifest.json";
    const duplicateWidthManifest = JSON.parse(
      corpus.documents[mediaManifestPath]!.text
    ) as {
      items: Array<{
        presentation: {
          derivatives: Array<Record<string, unknown>>;
        };
      }>;
    };
    const firstDerivative =
      duplicateWidthManifest.items[0]!.presentation.derivatives[0]!;
    duplicateWidthManifest.items[0]!.presentation.derivatives.push({
      ...firstDerivative,
      url: "https://d3lqz0a4bldqgf.cloudfront.net/museum/programs/6529NM-AP-01/work/conflicting-640.webp",
      sha256: `sha256:${"f".repeat(64)}`,
    });
    const duplicateWidthView = normalizeMuseumCorpus({
      ...corpus,
      documents: {
        ...corpus.documents,
        [mediaManifestPath]: jsonDocument(
          mediaManifestPath,
          duplicateWidthManifest
        ),
      },
    });
    expect(duplicateWidthView.programs[0]?.selectedWorks[0]?.media).toEqual(
      expect.objectContaining({
        altText: "Selected work by Artist",
        altTextStatus: "identification_only_fallback",
        variants: [],
      })
    );

    const duplicateRecordManifest = JSON.parse(
      corpus.documents[mediaManifestPath]!.text
    ) as { items: Array<Record<string, unknown>> };
    duplicateRecordManifest.items.push({
      ...duplicateRecordManifest.items[0]!,
    });
    const duplicateRecordView = normalizeMuseumCorpus({
      ...corpus,
      documents: {
        ...corpus.documents,
        [mediaManifestPath]: jsonDocument(
          mediaManifestPath,
          duplicateRecordManifest
        ),
      },
    });
    expect(duplicateRecordView.programs[0]?.selectedWorks[0]?.media).toEqual(
      expect.objectContaining({
        altTextStatus: "identification_only_fallback",
        variants: [],
      })
    );
  });
});
