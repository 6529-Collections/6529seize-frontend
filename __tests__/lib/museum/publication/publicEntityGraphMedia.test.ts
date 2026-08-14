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
const MEDIA_CONTINUITY_AMENDMENT_PATH =
  "records/proposed-gifts/6529NM-PG-2026-001/public/scholarship/machine/media-source-continuity-amendment.json";
const ACCESSION_PRESENTATION_PATH =
  "records/accessions/6529NM.2026.002/public/presentation-manifest.json";
const PROPOSAL_ID = "6529NM-PG-2026-001";

type WavePart = Record<string, unknown>;

function sha256(text: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function buildMediaContinuityAmendmentDocument(input: {
  readonly historicalWaveUri: string;
  readonly displayUri: string;
  readonly digest: string;
}): MuseumSourceDocument {
  const text = JSON.stringify(
    {
      amendment_id: "6529NM-MEDIA-CONT-AMD-2026-08-12-001",
      status: "active_downstream_accession_display_source",
      observed_at: "2026-08-12T07:37:56.984246Z",
      works: [
        {
          work_entity_id: "6529NM-W-0028",
          media_reference_entity_id: "6529NM-MED-0044",
          historical_wave_uri: input.historicalWaveUri,
          display_token_source_uri: input.displayUri,
          sha256: input.digest,
          bytes: 16_871_807,
          width: 5964,
          height: 4768,
          fixity_verified_at: "2026-08-08T10:15:02.0167151Z",
          display_policy:
            "historical_wave_locator_preserved_token_source_used_for_accession_display",
        },
      ],
    },
    null,
    2
  );
  return {
    path: MEDIA_CONTINUITY_AMENDMENT_PATH,
    sha256: sha256(text),
    mediaType: "application/json",
    text,
  };
}

function buildAccessionPresentationDocument(input: {
  readonly workId: string;
  readonly mediaId: string;
  readonly sourceUrl: string;
  readonly sourceDigest: string;
  readonly sourceByteSize: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly altText: string;
}): { readonly document: MuseumSourceDocument; readonly paths: string[] } {
  const digest = input.sourceDigest.replace("sha256:", "");
  const dimensions = [
    [640, 512],
    [1280, 1023],
    [2400, 1919],
  ] as const;
  const derivatives = dimensions.map(([width, height]) => {
    const repositoryPath = `media/accessions/6529NM.2026.002/${input.workId}/${digest}/webp-v2-q82-m6-fixed-icc/${width}.webp`;
    return {
      width,
      height,
      mime_type: "image/webp",
      sha256: `sha256:${String(width).padStart(64, "0")}`,
      byte_size: width * 100,
      repository_path: repositoryPath,
      url: `https://d3lqz0a4bldqgf.cloudfront.net/museum/accessions/6529NM.2026.002/${input.workId}/${digest}/webp-v2-q82-m6-fixed-icc/${width}.webp`,
      cache_control: "public, max-age=31536000, immutable",
    };
  });
  const text = JSON.stringify({
    record_type: "ACCESSION_MEDIA_PRESENTATION",
    schema_profile: "6529NM_ACCESSION_MEDIA_PRESENTATION_V1",
    accession_lot_id: "6529NM.2026.002",
    delivery: {
      status: "approved_for_contextual_museum_display",
      cdn_base_url: "https://d3lqz0a4bldqgf.cloudfront.net",
      cache_control: "public, max-age=31536000, immutable",
    },
    items: [
      {
        work_entity_id: input.workId,
        media_reference_entity_id: input.mediaId,
        source: {
          url: input.sourceUrl,
          sha256: input.sourceDigest,
          byte_size: input.sourceByteSize,
          pixel_width: input.sourceWidth,
          pixel_height: input.sourceHeight,
        },
        presentation: { alt_text: input.altText, derivatives },
      },
    ],
  });
  return {
    document: {
      path: ACCESSION_PRESENTATION_PATH,
      sha256: sha256(text),
      mediaType: "application/json",
      text,
    },
    paths: derivatives.map((derivative) => derivative.repository_path),
  };
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

function buildRetainedMediaGraph(input: {
  readonly role: string;
  readonly uri: string;
  readonly repositoryPath?: string;
}): MuseumPublicEntityGraph {
  const workId = "6529NM-W-0001";
  const mediaId = "6529NM-MED-0001";
  const sourceLocator = {
    uri: input.uri,
    repository_path: input.repositoryPath ?? null,
  };
  const work: MuseumPublicEntityRecord = {
    id: workId,
    entityType: "WORK",
    label: "A governed work",
    slug: workId,
    canonicalRoute: `/museum/network/works/${workId}`,
    pageExposure: "canonical_page",
    entityStatus: "published",
    sourcePath: "records/entities/6529NM-W-0001.json",
    sourceRecordIds: [workId],
    profile: {},
  };
  const media: MuseumPublicEntityRecord = {
    id: mediaId,
    entityType: "MEDIA_REFERENCE",
    label: "A governed visual source",
    slug: null,
    canonicalRoute: null,
    pageExposure: "relational_only",
    entityStatus: "published",
    sourcePath: "records/entities/6529NM-MED-0001.json",
    sourceRecordIds: [workId],
    profile: {
      media: {
        media_role: input.role,
        source_locator: sourceLocator,
        media_type: "image/png",
        visual: true,
        width: 1000,
        height: 1000,
        accessibility_text: "A governed visual source.",
        credit: "6529 Network Museum",
        allowed_ui_affordances: ["view", "thumbnail"],
        subject_entity_id: workId,
        rights: { status: "cleared" },
        source_observation: { status: "retrieved" },
        fixity: {
          status: "verified",
          digest: `sha256:${"a".repeat(64)}`,
        },
      },
    },
  };
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
  return {
    sourceCommit: "a".repeat(40),
    entityPaths: [],
    relationPaths: [],
    entities: [work, media],
    relations: [relation],
    identityInventory: {
      sourcePath: "schemas/public-entity-identity-inventory.json",
      inventoryVersion: "1.6.0",
      curatedAcquisitionIds: [],
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
      activeRelationIds: [relation.id],
      retiredRelationIds: [],
    },
  };
}

describe("Wave publication receipt joins", () => {
  it("retains only exact official Art Blocks media URLs", () => {
    const contract = "0x0000000000000000000000000000000000000000";
    const graph = buildRetainedMediaGraph({
      role: "token_linked_source_media",
      uri: `https://media-proxy.artblocks.io/1/${contract}/1.png`,
    });

    const projected = projectMediaRelations(graph.entities, graph, new Map());
    expect(projected.get("6529NM-W-0001")?.retained[0]?.url).toBe(
      `https://media-proxy.artblocks.io/1/${contract}/1.png`
    );

    const liveGraph = buildRetainedMediaGraph({
      role: "token_linked_source_media",
      uri: `https://generator.artblocks.io/1/${contract}/1`,
    });
    const live = projectMediaRelations(
      liveGraph.entities,
      liveGraph,
      new Map()
    );
    expect(live.get("6529NM-W-0001")?.retained[0]).toMatchObject({
      kind: "live",
      url: `https://generator.artblocks.io/1/${contract}/1`,
    });
  });

  it("constructs repository media from the exact immutable B URL", () => {
    const repositoryPath =
      "records/proposed-gifts/6529NM-PG-2026-001/public/media/approved.png";
    const graph = buildRetainedMediaGraph({
      role: "museum_authored_public_graphic",
      // The source locator is evidence, not the browser authority.
      uri: "https://github.com/6529-Collections/6529networkmuseum/blob/main/records/proposed-gifts/6529NM-PG-2026-001/public/media/approved.png",
      repositoryPath,
    });

    const projected = projectMediaRelations(graph.entities, graph, new Map(), [
      repositoryPath,
    ]);
    expect(projected.get("6529NM-W-0001")?.retained[0]?.url).toBe(
      `https://raw.githubusercontent.com/6529-Collections/6529networkmuseum/${"a".repeat(40)}/${repositoryPath}`
    );
  });

  it("rejects repository media that is outside the catalog media-asset set", () => {
    const repositoryPath =
      "records/proposed-gifts/6529NM-PG-2026-001/public/media/approved.png";
    const graph = buildRetainedMediaGraph({
      role: "museum_authored_public_graphic",
      uri: "https://example.test/approved.png",
      repositoryPath,
    });

    expect(() =>
      projectMediaRelations(graph.entities, graph, new Map(), [])
    ).toThrow("publication_unapproved_retained_media_origin");
  });

  it("rejects an official external URL under a repository-media role", () => {
    const graph = buildRetainedMediaGraph({
      role: "museum_authored_public_graphic",
      uri: "https://media-proxy.artblocks.io/1/0x0000000000000000000000000000000000000000/1.png",
    });

    expect(() =>
      projectMediaRelations(graph.entities, graph, new Map())
    ).toThrow("publication_unapproved_retained_media_origin");
  });

  it.each([
    "http://media-proxy.artblocks.io/1/0x0000000000000000000000000000000000000000/1.png",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "file:///tmp/approved.png",
    "https://media-proxy.artblocks.io.evil.test/1/0x0000000000000000000000000000000000000000/1.png",
    "https://user:pass@media-proxy.artblocks.io/1/0x0000000000000000000000000000000000000000/1.png",
    "https://media-proxy.artblocks.io:443/1/0x0000000000000000000000000000000000000000/1.png",
    "https://media-proxy.artblocks.io/1/0x0000000000000000000000000000000000000000/1.png?raw=1",
    "https://github.com/6529-Collections/6529networkmuseum/blob/main/approved.png",
  ])("rejects an ungoverned direct visual URI: %s", (uri) => {
    const graph = buildRetainedMediaGraph({
      role: "token_linked_source_media",
      uri,
    });
    expect(() =>
      projectMediaRelations(graph.entities, graph, new Map())
    ).toThrow("publication_unapproved_media_origin");
  });

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
        inventoryVersion: "1.6.0",
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

  it("projects accession-reviewed Conflict media without admitting the raw Wave receipt", () => {
    const workId = "6529NM-W-0028";
    const mediaId = "6529NM-MED-0044";
    const acquisitionId = "6529NM-CA-2026-003";
    const observationId = "6529NM-WAVE-PUB-OBS-2026-08-08-001";
    const work: MuseumPublicEntityRecord = {
      id: workId,
      entityType: "WORK",
      label: "Palmyra, Syria",
      slug: "palmyra-syria",
      canonicalRoute: `/museum/network/works/${workId}`,
      pageExposure: "canonical_page",
      entityStatus: "published",
      sourcePath: `records/entities/${workId}.json`,
      sourceRecordIds: [workId],
      profile: {},
    };
    const media: MuseumPublicEntityRecord = {
      id: mediaId,
      entityType: "MEDIA_REFERENCE",
      label: "Palmyra presentation source",
      slug: null,
      canonicalRoute: null,
      pageExposure: "relational_only",
      entityStatus: "published",
      sourcePath: `records/entities/${mediaId}.json`,
      sourceRecordIds: [acquisitionId, PROPOSAL_ID, observationId],
      profile: {
        media: {
          media_role: "historical_wave_proposal_presentation",
          publication_boundary: "historical_wave_proposal_context",
          source_locator: {
            uri: "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/palmyra/magnum-75-104.jpg",
            repository_path: null,
          },
          token_source_locator: {
            uri: "https://arweave.net/oz0t0DJj2BgFCux1WXskxisxvzV2KA0ukqaVbQ1Ckco",
            repository_path: null,
          },
          media_type: "image/jpeg",
          visual: true,
          width: 5964,
          height: 4768,
          source_byte_size: 16_871_807,
          publication_part_number: 6,
          accessibility_text:
            "A soldier seated among rubble and standing columns at Palmyra.",
          credit:
            "Lorenzo Meloni, Palmyra, Syria, 2016. © Lorenzo Meloni/Magnum Photos 2022.",
          rights: {
            status: "restricted",
            notes: "Source rights label: All Rights Reserved.",
          },
          source_observation: { status: "mutable_external" },
          fixity: {
            status: "verified",
            algorithm: "sha256",
            digest: `sha256:${"a".repeat(64)}`,
            verified_at: "2026-08-08T10:15:02.0167151Z",
          },
          token_source_fixity: {
            status: "verified",
            algorithm: "sha256",
            digest: `sha256:${"a".repeat(64)}`,
            verified_at: "2026-08-08T10:15:02.0167151Z",
          },
          active_display_source_amendment: {
            amendment_id: "6529NM-MEDIA-CONT-AMD-2026-08-12-001",
            path: "records/proposed-gifts/6529NM-PG-2026-001/public/scholarship/machine/media-source-continuity-amendment.json",
            status: "active_downstream_accession_display_source",
            observed_at: "2026-08-12T07:37:56.984246Z",
          },
          subject_entity_id: workId,
          allowed_ui_affordances: [
            "view",
            "thumbnail",
            "hero",
            "alt_text",
            "open_wave_proposal_context",
            "copy_citation",
          ],
          publication_context_entity_ids: [acquisitionId],
          wave_proposal_context: {
            wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
            drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
            publication_record_id: PROPOSAL_ID,
            observation_record_id: observationId,
            publication_status: "historical_public_proposal_context",
          },
        },
      },
    };
    const relations: MuseumPublicRelationRecord[] = [
      {
        id: "6529NM-REL-0001",
        relationType: "ENTITY_HAS_MEDIA",
        sourceEntityId: workId,
        targetEntityId: mediaId,
        assertionStatus: "asserted",
        qualifier: {},
        sourceRecordIds: [workId],
        sourcePath: "records/relations/6529NM-REL-0001.json",
      },
      {
        id: "6529NM-REL-0002",
        relationType: "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
        sourceEntityId: acquisitionId,
        targetEntityId: workId,
        assertionStatus: "asserted",
        qualifier: { display_order: 5 },
        sourceRecordIds: [acquisitionId],
        sourcePath: "records/relations/6529NM-REL-0002.json",
      },
    ];
    const graph = {
      sourceCommit: "a".repeat(40),
      entityPaths: [],
      relationPaths: [],
      entities: [work, media],
      relations,
      identityInventory: {
        sourcePath: "schemas/public-entity-identity-inventory.json",
        inventoryVersion: "1.6.0",
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
        activeRelationIds: relations.map((relation) => relation.id),
        retiredRelationIds: [],
      },
    } satisfies MuseumPublicEntityGraph;

    const historicalWaveUri =
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/palmyra/magnum-75-104.jpg";
    const displayUri =
      "https://arweave.net/oz0t0DJj2BgFCux1WXskxisxvzV2KA0ukqaVbQ1Ckco";
    const digest = `sha256:${"a".repeat(64)}`;
    const amendmentDocument = buildMediaContinuityAmendmentDocument({
      historicalWaveUri,
      displayUri,
      digest,
    });
    const sourceDocuments = new Map([
      [MEDIA_CONTINUITY_AMENDMENT_PATH, amendmentDocument],
    ]);
    const presentation = buildAccessionPresentationDocument({
      workId,
      mediaId,
      sourceUrl: displayUri,
      sourceDigest: digest,
      sourceByteSize: 16_871_807,
      sourceWidth: 5964,
      sourceHeight: 4768,
      altText:
        "A soldier seated among rubble and standing columns at Palmyra.",
    });
    sourceDocuments.set(ACCESSION_PRESENTATION_PATH, presentation.document);
    const projected = projectMediaRelations(
      graph.entities,
      graph,
      sourceDocuments,
      presentation.paths
    );
    expect(projected.get(workId)?.presentation).toEqual([
      expect.objectContaining({
        id: mediaId,
        sourceByteSize: 16_871_807,
        source: expect.objectContaining({
          partId: 6,
          sourcePath: `records/entities/${mediaId}.json`,
          mediaRecordPath: `records/entities/${mediaId}.json`,
        }),
        mediaUrl: displayUri,
        variants: [
          expect.objectContaining({ width: 640 }),
          expect.objectContaining({ width: 1280 }),
          expect.objectContaining({ width: 2400 }),
        ],
      }),
    ]);
    const mismatchedDocument = buildMediaContinuityAmendmentDocument({
      historicalWaveUri,
      displayUri: "https://arweave.net/not-the-reviewed-source",
      digest,
    });
    const mismatchedDocuments = new Map([
      [MEDIA_CONTINUITY_AMENDMENT_PATH, mismatchedDocument],
    ]);
    expect(() =>
      projectMediaRelations(graph.entities, graph, mismatchedDocuments)
    ).toThrow("public_entity_graph_media_accession_amendment");

    const unrelatedAmendmentPath =
      "records/proposed-gifts/6529NM-PG-2026-999/public/scholarship/machine/media-source-continuity-amendment.json";
    const unrelatedMedia = JSON.parse(
      JSON.stringify(media).replace(
        MEDIA_CONTINUITY_AMENDMENT_PATH,
        unrelatedAmendmentPath
      )
    ) as MuseumPublicEntityRecord;
    const unrelatedGraph = {
      ...graph,
      entities: [work, unrelatedMedia],
    } satisfies MuseumPublicEntityGraph;
    const unrelatedDocuments = new Map([
      [
        unrelatedAmendmentPath,
        { ...amendmentDocument, path: unrelatedAmendmentPath },
      ],
    ]);
    expect(() =>
      projectMediaRelations(
        unrelatedGraph.entities,
        unrelatedGraph,
        unrelatedDocuments
      )
    ).toThrow("public_entity_graph_media_accession_record");

    for (const [validTimestamp, invalidTimestamp] of [
      ["2026-08-08T10:15:02.0167151Z", "not-a-fixity-timestamp"],
      ["2026-08-12T07:37:56.984246Z", "2026-02-30T07:37:56Z"],
    ] as const) {
      const invalidMedia = JSON.parse(
        JSON.stringify(media).replaceAll(validTimestamp, invalidTimestamp)
      ) as MuseumPublicEntityRecord;
      const invalidGraph = {
        ...graph,
        entities: [work, invalidMedia],
      } satisfies MuseumPublicEntityGraph;
      const invalidDocument = {
        ...amendmentDocument,
        text: amendmentDocument.text.replaceAll(
          validTimestamp,
          invalidTimestamp
        ),
      };
      expect(() =>
        projectMediaRelations(
          invalidGraph.entities,
          invalidGraph,
          new Map([[MEDIA_CONTINUITY_AMENDMENT_PATH, invalidDocument]])
        )
      ).toThrow("public_entity_graph_media_accession_record");
    }
  });

  it("rejects a historical Wave locator without its accession token-source binding", () => {
    const workId = "6529NM-W-0028";
    const mediaId = "6529NM-MED-0044";
    const acquisitionId = "6529NM-CA-2026-003";
    const observationId = "6529NM-WAVE-PUB-OBS-2026-08-08-001";
    const entities: MuseumPublicEntityRecord[] = [
      {
        id: workId,
        entityType: "WORK",
        label: "Palmyra, Syria",
        slug: "palmyra-syria",
        canonicalRoute: `/museum/network/works/${workId}`,
        pageExposure: "canonical_page",
        entityStatus: "published",
        sourcePath: `records/entities/${workId}.json`,
        sourceRecordIds: [workId],
        profile: {},
      },
      {
        id: mediaId,
        entityType: "MEDIA_REFERENCE",
        label: "Palmyra token source",
        slug: null,
        canonicalRoute: null,
        pageExposure: "relational_only",
        entityStatus: "published",
        sourcePath: `records/entities/${mediaId}.json`,
        sourceRecordIds: [acquisitionId, PROPOSAL_ID, observationId],
        profile: {
          media: {
            media_role: "historical_wave_proposal_presentation",
            publication_boundary: "historical_wave_proposal_context",
            source_locator: {
              uri: "https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7ee51a67-07b7-4c91-87ed-464c56446c43/palmyra/magnum-75-104.jpg",
              repository_path: null,
            },
            media_type: "image/jpeg",
            visual: true,
            width: 5964,
            height: 4768,
            source_byte_size: 16_871_807,
            publication_part_number: 6,
            accessibility_text: "A soldier seated among rubble at Palmyra.",
            credit:
              "Lorenzo Meloni, Palmyra, Syria, 2016. © Lorenzo Meloni/Magnum Photos 2022.",
            rights: { status: "restricted", notes: "All Rights Reserved." },
            source_observation: { status: "mutable_external" },
            fixity: {
              status: "verified",
              algorithm: "sha256",
              digest: `sha256:${"a".repeat(64)}`,
              verified_at: "2026-08-08T10:15:02.0167151Z",
            },
            subject_entity_id: workId,
            allowed_ui_affordances: ["view", "alt_text"],
            publication_context_entity_ids: [acquisitionId],
            wave_proposal_context: {
              wave_id: "5f207393-5418-4a75-8738-e40edb44a94d",
              drop_id: "002bfa4f-8416-48bf-b35e-38f354e9a9f0",
              publication_record_id: PROPOSAL_ID,
              observation_record_id: observationId,
              publication_status: "historical_public_proposal_context",
            },
          },
        },
      },
    ];
    const relations: MuseumPublicRelationRecord[] = [
      {
        id: "6529NM-REL-0001",
        relationType: "ENTITY_HAS_MEDIA",
        sourceEntityId: workId,
        targetEntityId: mediaId,
        assertionStatus: "asserted",
        qualifier: {},
        sourceRecordIds: [workId],
        sourcePath: "records/relations/6529NM-REL-0001.json",
      },
      {
        id: "6529NM-REL-0002",
        relationType: "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
        sourceEntityId: acquisitionId,
        targetEntityId: workId,
        assertionStatus: "asserted",
        qualifier: { display_order: 5 },
        sourceRecordIds: [acquisitionId],
        sourcePath: "records/relations/6529NM-REL-0002.json",
      },
    ];
    const graph = {
      sourceCommit: "a".repeat(40),
      entityPaths: [],
      relationPaths: [],
      entities,
      relations,
      identityInventory: {
        sourcePath: "schemas/public-entity-identity-inventory.json",
        inventoryVersion: "1.6.0",
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
        activeRelationIds: relations.map((relation) => relation.id),
        retiredRelationIds: [],
      },
    } satisfies MuseumPublicEntityGraph;

    expect(() => projectMediaRelations(entities, graph, new Map())).toThrow(
      "public_entity_graph_media_token_source_locator"
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
        inventoryVersion: "1.6.0",
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
