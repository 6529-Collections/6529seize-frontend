/**
 * @jest-environment node
 */
import { keccak256, toBytes, type Hex } from "viem";
import type {
  OnchainMuseumRecord,
  OnchainMuseumSnapshot,
} from "@/lib/museum/onchain/museum";
import {
  buildOnchainMuseumView,
  cleanLabel,
  textGroupKey,
  textsNaming,
  type OnchainLabeler,
} from "@/lib/museum/onchain/presentation";

const labeler: OnchainLabeler = {
  entityTypePlural: (type) => `plural:${type}`,
  entityTypeSingular: (type) => `one:${type}`,
  recordType: (literal) => `type:${literal}`,
  recordTypePlural: (literal) => `types:${literal}`,
  relationType: (type) => `rel:${type}`,
  textGroup: (kind) => `group:${kind}`,
};

let sequence = 0;
function record(
  recordType: string,
  label: string,
  payload: Record<string, unknown> | null,
  documentPath: string | null = null
): OnchainMuseumRecord {
  sequence += 1;
  const subjectId = keccak256(toBytes(`subject-${sequence}`));
  return {
    subjectId,
    recordTypeId: keccak256(toBytes(recordType)),
    recordType,
    schemaLiteral: null,
    canonicalizationLiteral: null,
    versionCount: 1,
    subjectDeleted: false,
    version: {
      version: 1,
      sequence,
      releaseId: 1,
      schemaId: `0x${"00".repeat(32)}` as Hex,
      contentHash: {
        algorithm: 1,
        digest: `0x${"00".repeat(32)}` as Hex,
        canonicalizationId: `0x${"00".repeat(32)}` as Hex,
      },
      effectiveAt: 0,
      publishedAt: 0,
      publisher: "0x0000000000000000000000000000000000000000",
      deleted: false,
      deletionId: 0,
      cid: "0x",
      arweaveId: `0x${"00".repeat(32)}` as Hex,
      label,
    },
    cidText: null,
    state: "verified",
    check: "verified",
    computedDigest: null,
    cidMatches: true,
    servedBy: "media.6529.io",
    content:
      payload === null
        ? { kind: "markdown", text: `# ${label}\n` }
        : { kind: "json", payload },
    documentPath,
    label,
  };
}

function snapshot(records: OnchainMuseumRecord[]): OnchainMuseumSnapshot {
  return {
    loadedAt: "2026-11-22T00:00:00.000Z",
    loadMs: 0,
    registry: {} as OnchainMuseumSnapshot["registry"],
    catalog: {
      state: "verified",
      cidText: null,
      servedBy: null,
      catalogId: null,
      createdAt: null,
      releaseIds: [1],
    },
    records,
    counts: {
      verified: records.length,
      mismatch: 0,
      unavailable: 0,
      unsupported: 0,
      deleted: 0,
    },
  };
}

describe("text groups", () => {
  it.each([
    [
      "records/accessions/6529NM.2026.003/public/alt-text.md",
      "accession",
      "6529NM.2026.003",
    ],
    [
      "records/proposed-gifts/6529NM-PG-2026-001/public/x.md",
      "proposedGift",
      "6529NM-PG-2026-001",
    ],
    [
      "records/programs/6529NM-AP-01/public/works/rusted.md",
      "programWorks",
      "6529NM-AP-01",
    ],
    [
      "records/programs/6529NM-AP-01/public/artists/zoku.md",
      "programArtists",
      "6529NM-AP-01",
    ],
    [
      "records/programs/6529NM-AP-01/public/README.md",
      "program",
      "6529NM-AP-01",
    ],
    [
      "records/institutional-practice/profiles/moma.md",
      "institutionalProfiles",
      null,
    ],
    [
      "records/institutional-practice/a-field-of-practice.md",
      "institutionalPractice",
      null,
    ],
    ["policies/donation-acceptance.md", "policies", null],
    ["docs/data-architecture/premis.md", "dataArchitecture", null],
    ["docs/data-architecture.md", "dataArchitecture", null],
    ["docs/open-museum.md", "documentation", null],
    ["CONTRIBUTING.md", "contributing", null],
    [null, "other", null],
  ])("places %s", (path, kind, contextId) => {
    expect(textGroupKey(path)).toEqual({ kind, contextId });
  });

  it("drops Markdown emphasis from a heading", () => {
    expect(cleanLabel("*the Artist in the Open Sea*")).toBe(
      "the Artist in the Open Sea"
    );
    expect(cleanLabel("`code` and _words_")).toBe("code and words");
  });
});

describe("buildOnchainMuseumView", () => {
  const work = record("PUBLIC_ENTITY", "Rusted", {
    entity_id: "6529NM-W-0001",
    entity_type: "WORK",
    preferred_label: "Rusted",
  });
  const artist = record("PUBLIC_ENTITY", "Zoku", {
    entity_id: "6529NM-ART-0001",
    entity_type: "ARTIST",
  });
  const accession = record("PUBLIC_ENTITY", "Zoku accession", {
    entity_id: "6529NM-ACC-ENT-0001",
    entity_type: "ACCESSION",
    source_record_ids: ["6529NM.2026.001"],
  });
  const relation = record("PUBLIC_RELATION", "", {
    record_id: "6529NM-REL-0001",
    relation_type: "ARTIST_CREATES_WORK",
    references: ["6529NM-ART-0001", "6529NM-W-0001", "6529NM-GOV-1"],
  });
  const condition = record("CONDITION_REPORT", "6529NM.2026.001.COND.01", {
    record_id: "6529NM.2026.001.COND.01",
  });
  const essay = record(
    "PUBLIC_DOCUMENT",
    "*Rusted*",
    null,
    "records/accessions/6529NM.2026.001/public/rusted.md"
  );
  const policy = record(
    "PUBLIC_DOCUMENT",
    "Donation acceptance",
    null,
    "policies/donation-acceptance.md"
  );
  const view = buildOnchainMuseumView(
    snapshot([work, artist, accession, relation, condition, essay, policy]),
    { labeler, compare: (left, right) => left.localeCompare(right) }
  );

  it("gives relations and ID-only records readable labels", () => {
    expect(view.labelOf(relation)).toBe(
      "rel:ARTIST_CREATES_WORK: Zoku · Rusted"
    );
    expect(view.labelOf(condition)).toBe(
      "type:CONDITION_REPORT 6529NM.2026.001.COND.01"
    );
    expect(view.labelOf(essay)).toBe("Rusted");
    expect(view.kindOf(work)).toBe("one:WORK");
  });

  it("groups entities, other records and texts", () => {
    expect(view.entityGroups.map((group) => group.key)).toEqual([
      "WORK",
      "ARTIST",
      "ACCESSION",
    ]);
    expect(view.recordGroups.map((group) => group.heading)).toEqual([
      "types:CONDITION_REPORT",
    ]);
    expect(view.relationCount).toBe(1);
    expect(view.textGroups.map((group) => [group.kind, group.heading])).toEqual(
      [
        ["accession", "Zoku accession"],
        ["policies", "group:policies"],
      ]
    );
    expect(view.textGroupOf(essay)?.contextHref).toBe(
      `/museum/network-onchain/records/${accession.subjectId.toLowerCase()}`
    );
  });

  it("resolves IDs and finds texts that name a work", () => {
    expect(view.resolve("6529NM-W-0001").label).toBe("Rusted");
    expect(view.resolve("6529NM-GOV-1").href).toBeNull();
    expect(textsNaming(view, "Rusted", "equals")).toEqual([essay]);
    expect(
      view.find(work.subjectId.toUpperCase().replace("0X", "0x") as Hex)
    ).toBe(work);
  });
});
