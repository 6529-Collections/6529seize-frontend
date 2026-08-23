import {
  assertVeraMolnarActivation,
  VERA_MOLNAR_PUBLIC_PATHS,
} from "@/lib/museum/publication/veraMolnarPublication";
import type { MuseumSourceDocument } from "@/lib/museum/publication/types";

function publicDocuments(): Map<string, MuseumSourceDocument> {
  return new Map(
    Object.values(VERA_MOLNAR_PUBLIC_PATHS).map((path) => [
      path,
      {
        path,
        mediaType: "text/markdown",
        sha256: null,
        text: "# Canonical source\n\nThe Wave cover is byte-identical to the official still.",
      },
    ])
  );
}

function emptyGraph() {
  return { entities: [], relations: [] } as never;
}

describe("Vera Molnár publication activation", () => {
  it("does nothing when the accession is absent", () => {
    expect(() =>
      assertVeraMolnarActivation({
        graph: emptyGraph(),
        publication: {} as never,
        sourceDocuments: new Map(),
      })
    ).not.toThrow();
  });

  it("rejects a partial canonical public set before any route can appear", () => {
    const documents = publicDocuments();
    documents.delete(VERA_MOLNAR_PUBLIC_PATHS.sourceChronology);

    expect(() =>
      assertVeraMolnarActivation({
        graph: emptyGraph(),
        publication: {} as never,
        sourceDocuments: documents,
      })
    ).toThrow("vera_molnar_atomic_public_documents");
  });

  it("requires the machine object record even when every public manuscript is present", () => {
    expect(() =>
      assertVeraMolnarActivation({
        graph: emptyGraph(),
        publication: {} as never,
        sourceDocuments: publicDocuments(),
      })
    ).toThrow("vera_molnar_atomic_object_record");
  });

  it("rejects a Vera graph when all canonical manuscripts are absent", () => {
    expect(() =>
      assertVeraMolnarActivation({
        graph: {
          entities: [
            {
              entityType: "ARTIST",
              slug: "vera-molnar",
              sourceRecordIds: [],
            },
          ],
          relations: [],
        } as never,
        publication: {} as never,
        sourceDocuments: new Map(),
      })
    ).toThrow("vera_molnar_atomic_public_documents");
  });
});
