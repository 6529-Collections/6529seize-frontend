import { createHash } from "node:crypto";
import {
  findWavePublicationPart,
  projectMediaRelations,
} from "@/lib/museum/publication/publicEntityGraphMedia";
import { parseWavePublicationParts } from "@/lib/museum/publication/publicEntityGraphWaveReceipt";
import {
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalTokenSourceUrl,
} from "@/lib/museum/publication/entities";
import type {
  MuseumPublicEntityGraph,
  MuseumPublicEntityRecord,
  MuseumPublicRelationRecord,
  MuseumSourceDocument,
} from "@/lib/museum/publication/types";

const OBSERVATION_PATH =
  "records/proposed-gifts/6529NM-PG-2026-001/wave-publication-observation-2026-08-08.json";
const PROPOSAL_ID = "6529NM-PG-2026-001";

type WavePart = Record<string, unknown>;

function sha256(text: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function buildFixture(): {
  readonly document: MuseumSourceDocument;
  readonly sourceDocuments: Map<string, MuseumSourceDocument>;
} {
  const sourceDocuments = new Map<string, MuseumSourceDocument>();
  const parts: WavePart[] = [];
  for (let index = 1; index <= 7; index += 1) {
    const sourcePath = `records/proposed-gifts/${PROPOSAL_ID}/public/wave-storm/${String(
      index
    ).padStart(2, "0")}-part.md`;
    const text = `# Part ${index}\n\nPublished source text ${index}.\n`;
    const digest = sha256(text);
    sourceDocuments.set(sourcePath, {
      path: sourcePath,
      sha256: digest,
      mediaType: "text/markdown",
      text,
    });
    const isCandidate = index >= 2 && index <= 6;
    const mediaByteSizes = [
      2_518_674, 1_813_285, 1_666_083, 1_540_870, 16_871_807,
    ];
    parts.push({
      part_id: index,
      source_path: sourcePath,
      content_encoding: "UTF-8",
      line_endings: "LF",
      content_sha256: digest,
      candidate_object_id: isCandidate
        ? `${PROPOSAL_ID}.OBJ-${String(index - 1).padStart(3, "0")}`
        : null,
      ...(isCandidate
        ? {
            media_url: `https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/part-${index}-source/part-${index}.jpg`,
            mime_type: "image/jpeg",
            media_bytes: mediaByteSizes[index - 2],
            credit: "© artist/Magnum Photos",
            rights_label: "All Rights Reserved",
            token_source_uri:
              "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM",
          }
        : {}),
    });
  }
  const text = JSON.stringify(
    {
      envelope: { recordType: "WAVE_PUBLICATION_OBSERVATION" },
      payload: {
        proposal_id: PROPOSAL_ID,
        wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
        drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
        is_signed: true,
        parts_count: 7,
        parts,
      },
    },
    null,
    2
  );
  const document: MuseumSourceDocument = {
    path: OBSERVATION_PATH,
    sha256: sha256(text),
    mediaType: "application/json",
    text,
  };
  sourceDocuments.set(OBSERVATION_PATH, document);
  return { document, sourceDocuments };
}

function replaceObservationParts(
  document: MuseumSourceDocument,
  update: (parts: WavePart[]) => void
): MuseumSourceDocument {
  const root = JSON.parse(document.text) as {
    payload: { parts: WavePart[] };
  };
  update(root.payload.parts);
  const text = JSON.stringify(root, null, 2);
  return { ...document, sha256: sha256(text), text };
}

describe("Wave publication receipt joins", () => {
  it("requires the complete seven-part receipt and returns five candidate joins", () => {
    const fixture = buildFixture();

    expect(
      isMuseumExternalProposalMediaUrl(
        "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/part-2-source/part-2.jpg"
      )
    ).toBe(true);
    expect(
      isMuseumExternalProposalTokenSourceUrl(
        "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM"
      )
    ).toBe(true);

    const parts = parseWavePublicationParts(
      fixture.document,
      fixture.sourceDocuments
    );

    expect(parts).toHaveLength(5);
    expect(parts.map((part) => part.partId)).toEqual([2, 3, 4, 5, 6]);
    expect(parts.map((part) => part.mediaByteSize)).toEqual([
      2_518_674, 1_813_285, 1_666_083, 1_540_870, 16_871_807,
    ]);
    expect(
      parts.every((part) => isMuseumExternalProposalMediaUrl(part.mediaUrl))
    ).toBe(true);
    expect(
      parts.every(
        (part) =>
          part.tokenSourceUri !== null &&
          isMuseumExternalProposalTokenSourceUrl(part.tokenSourceUri)
      )
    ).toBe(true);
  });

  it("accepts only exact Arweave transaction locators", () => {
    const valid =
      "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM";
    expect(isMuseumExternalProposalTokenSourceUrl(valid)).toBe(true);
    for (const invalid of [
      "http://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM",
      "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM?download=1",
      "https://arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWfQOWkaM/extra",
      "https://user:pass@arweave.net/VE0zO2N1zVTsbEUHdUFazEgvuMbmVOi6OfaWQOWkaM",
      "https://arweave.net/short",
    ]) {
      expect(isMuseumExternalProposalTokenSourceUrl(invalid)).toBe(false);
    }
  });

  it("rejects changed source text even when the receipt hash is changed", () => {
    const fixture = buildFixture();
    const changedPath =
      "records/proposed-gifts/6529NM-PG-2026-001/public/wave-storm/02-part.md";
    const changedSource = fixture.sourceDocuments.get(changedPath);
    if (changedSource === undefined) throw new Error("test_fixture_source");
    const changedText = `${changedSource.text}A valid-looking appended line.\n`;
    const changedHash = sha256(changedText);
    const sourceDocuments = new Map(fixture.sourceDocuments);
    sourceDocuments.set(changedPath, {
      ...changedSource,
      text: changedText,
      sha256: changedSource.sha256,
    });
    const document = replaceObservationParts(fixture.document, (parts) => {
      const part = parts[1];
      if (part === undefined) throw new Error("test_fixture_part");
      part["content_sha256"] = changedHash;
    });

    expect(() => parseWavePublicationParts(document, sourceDocuments)).toThrow(
      "public_entity_graph_media_wave_publication_receipt"
    );
  });

  it("rejects duplicate part IDs and duplicate candidate joins", () => {
    const partIdFixture = buildFixture();
    const duplicatePartIdDocument = replaceObservationParts(
      partIdFixture.document,
      (parts) => {
        const part = parts[1];
        if (part === undefined) throw new Error("test_fixture_part");
        part["part_id"] = 1;
      }
    );
    expect(() =>
      parseWavePublicationParts(
        duplicatePartIdDocument,
        partIdFixture.sourceDocuments
      )
    ).toThrow("public_entity_graph_media_wave_publication_receipt");

    const candidateFixture = buildFixture();
    const duplicateCandidateDocument = replaceObservationParts(
      candidateFixture.document,
      (parts) => {
        const part = parts[2];
        if (part === undefined) throw new Error("test_fixture_part");
        part["candidate_object_id"] = `${PROPOSAL_ID}.OBJ-001`;
      }
    );
    expect(() =>
      parseWavePublicationParts(
        duplicateCandidateDocument,
        candidateFixture.sourceDocuments
      )
    ).toThrow("public_entity_graph_media_wave_publication_candidate");
  });

  it("rejects a changed-valid presentation URL at the exact media join", () => {
    const fixture = buildFixture();
    const changedDocument = replaceObservationParts(
      fixture.document,
      (parts) => {
        const part = parts[1];
        if (part === undefined) throw new Error("test_fixture_part");
        part["media_url"] =
          "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/part-2-source/changed.jpg";
      }
    );
    const sourceDocuments = new Map(fixture.sourceDocuments);
    sourceDocuments.set(changedDocument.path, changedDocument);
    const subjectEntity: MuseumPublicEntityRecord = {
      id: "6529NM-W-0024",
      entityType: "WORK",
      label: "Conflict at Its Edges",
      slug: "conflict-at-its-edges",
      canonicalRoute: "/museum/network/works/6529NM-W-0024",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-W-0024.json",
      sourceRecordIds: ["6529NM-W-0024"],
      profile: {
        manifestation_references: [
          {
            reference_type: "manifestation",
            source_record_id: `${PROPOSAL_ID}.OBJ-001`,
          },
        ],
      },
    };

    expect(() =>
      findWavePublicationPart({
        sourceDocuments,
        subjectEntity,
        publicationRecordId: PROPOSAL_ID,
        waveId: "5f207393-5418-4a75-8738-e40edb44a94d",
        dropId: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
        input: {
          uri: "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/part-2-source/part-2.jpg",
          mediaType: "image/jpeg",
          creditLine: "© artist/Magnum Photos",
        },
      })
    ).toThrow("public_entity_graph_media_wave_publication_mismatch");
  });

  it("rejects CR/BOM source bytes and an undeclared part count", () => {
    const lineEndingFixture = buildFixture();
    const sourcePath =
      "records/proposed-gifts/6529NM-PG-2026-001/public/wave-storm/02-part.md";
    const source = lineEndingFixture.sourceDocuments.get(sourcePath);
    if (source === undefined) throw new Error("test_fixture_source");
    const sourceDocuments = new Map(lineEndingFixture.sourceDocuments);
    sourceDocuments.set(sourcePath, {
      ...source,
      text: `\uFEFF${source.text.replaceAll("\n", "\r\n")}`,
    });
    expect(() =>
      parseWavePublicationParts(lineEndingFixture.document, sourceDocuments)
    ).toThrow("public_entity_graph_media_wave_publication_receipt");

    const countFixture = buildFixture();
    const countRoot = JSON.parse(countFixture.document.text) as {
      payload: { parts_count: number };
    };
    countRoot.payload.parts_count = 6;
    const countText = JSON.stringify(countRoot, null, 2);
    const countDocument: MuseumSourceDocument = {
      ...countFixture.document,
      sha256: sha256(countText),
      text: countText,
    };
    expect(() =>
      parseWavePublicationParts(countDocument, countFixture.sourceDocuments)
    ).toThrow("public_entity_graph_media_wave_publication_parts_count");
  });

  it("projects rights-limited K&G and Magnum media as metadata without an image locator", () => {
    const magnumWork: MuseumPublicEntityRecord = {
      id: "6529NM-W-0024",
      entityType: "WORK",
      label: "Conflict at Its Edges",
      slug: "conflict-at-its-edges",
      canonicalRoute: "/museum/network/works/6529NM-W-0024",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-W-0024.json",
      sourceRecordIds: ["6529NM-W-0024"],
      profile: {},
    };
    const keysAndGatesWork: MuseumPublicEntityRecord = {
      id: "6529NM-W-0008",
      entityType: "WORK",
      label: "Take the Key!",
      slug: "take-the-key",
      canonicalRoute: "/museum/network/works/6529NM-W-0008",
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-W-0008.json",
      sourceRecordIds: ["6529NM-W-0008"],
      profile: {},
    };
    const mediaProfile = (
      subjectEntityId: string,
      mediaRole: string,
      sourceLocator: Record<string, unknown>,
      affordances: readonly string[],
      extra: Record<string, unknown> = {}
    ): Readonly<Record<string, unknown>> => ({
      media: {
        media_role: mediaRole,
        source_locator: sourceLocator,
        media_type: "image/jpeg",
        visual: true,
        width: 2400,
        height: 1600,
        accessibility_text: "A governed source photograph.",
        credit: "© artist / source. All Rights Reserved.",
        allowed_ui_affordances: affordances,
        subject_entity_id: subjectEntityId,
        rights: { status: "restricted" },
        source_observation: { status: "observed" },
        ...extra,
      },
    });
    const magnumMedia: MuseumPublicEntityRecord = {
      id: "6529NM-MED-0003",
      entityType: "MEDIA_REFERENCE",
      label: "Historical Wave proposal image",
      slug: null,
      canonicalRoute: null,
      pageExposure: "relational_only",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-MED-0003.json",
      sourceRecordIds: ["6529NM-PG-2026-001"],
      profile: mediaProfile(
        magnumWork.id,
        "historical_wave_proposal_presentation",
        { uri: null },
        ["alt_text", "open_wave_proposal_context"],
        {
          signed_wave: {
            wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
            drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
            publication_record_id: PROPOSAL_ID,
          },
          publication_context_entity_ids: ["6529NM-CA-2026-003"],
        }
      ),
    };
    const keysAndGatesMedia: MuseumPublicEntityRecord = {
      id: "6529NM-MED-0008",
      entityType: "MEDIA_REFERENCE",
      label: "Keys and Gates source image record",
      slug: null,
      canonicalRoute: null,
      pageExposure: "relational_only",
      entityStatus: "published",
      sourcePath: "records/entities/6529NM-MED-0008.json",
      sourceRecordIds: ["6529NM-W-0008"],
      profile: mediaProfile(
        keysAndGatesWork.id,
        "museum_generated_public_derivative",
        { uri: null, repository_path: "media/works/6529NM-W-0008.json" },
        ["copy_citation"]
      ),
    };
    const relations: MuseumPublicRelationRecord[] = [
      {
        id: "6529NM-REL-0001",
        relationType: "ENTITY_HAS_MEDIA",
        sourceEntityId: magnumWork.id,
        targetEntityId: magnumMedia.id,
        assertionStatus: "asserted",
        qualifier: {},
        sourceRecordIds: ["6529NM-W-0024"],
        sourcePath: "records/relations/6529NM-REL-0001.json",
      },
      {
        id: "6529NM-REL-0002",
        relationType: "ENTITY_HAS_MEDIA",
        sourceEntityId: keysAndGatesWork.id,
        targetEntityId: keysAndGatesMedia.id,
        assertionStatus: "asserted",
        qualifier: {},
        sourceRecordIds: ["6529NM-W-0008"],
        sourcePath: "records/relations/6529NM-REL-0002.json",
      },
      {
        id: "6529NM-REL-0003",
        relationType: "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
        sourceEntityId: "6529NM-CA-2026-003",
        targetEntityId: magnumWork.id,
        assertionStatus: "asserted",
        qualifier: { display_order: 1 },
        sourceRecordIds: ["6529NM-CA-2026-003"],
        sourcePath: "records/relations/6529NM-REL-0003.json",
      },
    ];
    const graph = {
      sourceCommit: "a".repeat(40),
      entityPaths: [],
      relationPaths: [],
      entities: [magnumWork, keysAndGatesWork, magnumMedia, keysAndGatesMedia],
      relations,
      identityInventory: {
        sourcePath: "schemas/public-entity-identity-inventory.json",
        inventoryVersion: "1.4.0",
        curatedAcquisitionIds: ["6529NM-CA-2026-003"],
        workAliases: [],
        acquisitionAliases: [],
        programAliases: [],
        routeAliases: [],
        typedReferenceRegistry: [],
      },
      relationIdentityInventory: {
        sourcePath: "schemas/public-relation-identity-inventory.json",
        schemaPath: "schemas/public-relation-identity-inventory.schema.json",
        inventoryVersion: "1.3.0",
        activeRelationIds: relations.map((relation) => relation.id),
        retiredRelationIds: [],
      },
    } satisfies MuseumPublicEntityGraph;

    const projected = projectMediaRelations(graph.entities, graph, new Map());
    const magnum = projected.get(magnumWork.id);
    const keysAndGates = projected.get(keysAndGatesWork.id);
    expect(magnum?.presentation).toEqual([]);
    expect(magnum?.retained).toEqual([]);
    expect(magnum?.metadata).toHaveLength(1);
    expect(magnum?.metadata[0]?.context).toMatchObject({
      kind: "wave_proposal",
      acquisitionId: "6529NM-CA-2026-003",
      openHref:
        "https://6529.io/waves/5f207393-5418-4a75-8738-e40edb44a94d?drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0",
    });
    expect(keysAndGates?.presentation).toEqual([]);
    expect(keysAndGates?.retained).toEqual([]);
    expect(keysAndGates?.metadata[0]?.role).toBe(
      "museum_generated_public_derivative"
    );
  });

  it("rejects Wave metadata and context when sourceRecordIds miss the publication record", () => {
    const workId = "6529NM-W-0024";
    const mediaId = "6529NM-MED-0003";
    const acquisitionId = "6529NM-CA-2026-003";
    const relation: MuseumPublicRelationRecord = {
      id: "6529NM-REL-0001",
      relationType: "ENTITY_HAS_MEDIA",
      sourceEntityId: workId,
      targetEntityId: mediaId,
      assertionStatus: "asserted",
      qualifier: {},
      sourceRecordIds: [workId],
      sourcePath: "records/relations/6529NM-REL-0001.json",
    };
    const graph = {
      sourceCommit: "a".repeat(40),
      entityPaths: [],
      relationPaths: [],
      entities: [
        {
          id: workId,
          entityType: "WORK",
          label: "Conflict at Its Edges",
          slug: "conflict-at-its-edges",
          canonicalRoute: `/museum/network/works/${workId}`,
          pageExposure: "canonical_page",
          entityStatus: "published",
          sourcePath: "records/entities/6529NM-W-0024.json",
          sourceRecordIds: [workId],
          profile: {},
        },
        {
          id: mediaId,
          entityType: "MEDIA_REFERENCE",
          label: "Historical Wave proposal image",
          slug: null,
          canonicalRoute: null,
          pageExposure: "relational_only",
          entityStatus: "published",
          sourcePath: "records/entities/6529NM-MED-0003.json",
          sourceRecordIds: ["6529NM-PG-2026-999"],
          profile: {
            media: {
              media_role: "historical_wave_proposal_presentation",
              source_locator: { uri: null },
              media_type: "image/jpeg",
              accessibility_text: "A governed source photograph.",
              credit: "© artist / Magnum Photos",
              allowed_ui_affordances: [
                "alt_text",
                "open_wave_proposal_context",
              ],
              subject_entity_id: workId,
              signed_wave: {
                wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
                drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
                publication_record_id: PROPOSAL_ID,
              },
              publication_context_entity_ids: [acquisitionId],
            },
          },
        },
      ],
      relations: [
        relation,
        {
          id: "6529NM-REL-0002",
          relationType: "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
          sourceEntityId: acquisitionId,
          targetEntityId: workId,
          assertionStatus: "asserted",
          qualifier: {},
          sourceRecordIds: [acquisitionId],
          sourcePath: "records/relations/6529NM-REL-0002.json",
        },
      ],
      identityInventory: {
        sourcePath: "schemas/public-entity-identity-inventory.json",
        inventoryVersion: "1.4.0",
        curatedAcquisitionIds: [acquisitionId],
        workAliases: [],
        acquisitionAliases: [],
        programAliases: [],
        routeAliases: [],
        typedReferenceRegistry: [],
      },
      relationIdentityInventory: {
        sourcePath: "schemas/public-relation-identity-inventory.json",
        schemaPath: "schemas/public-relation-identity-inventory.schema.json",
        inventoryVersion: "1.3.0",
        activeRelationIds: [relation.id, "6529NM-REL-0002"],
        retiredRelationIds: [],
      },
    } satisfies MuseumPublicEntityGraph;

    expect(() =>
      projectMediaRelations(graph.entities, graph, new Map())
    ).toThrow("public_entity_graph_media_wave_source_join");
  });
});
