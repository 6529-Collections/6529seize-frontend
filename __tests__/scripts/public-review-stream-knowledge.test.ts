import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  KNOWLEDGE_INDEX_SCHEMA,
  KNOWLEDGE_MANIFEST_SCHEMA,
  KNOWLEDGE_SHARD_SCHEMA,
  headingId,
  splitEditorialPage,
  validateKnowledgePack,
} = require("../../scripts/public-reviews/stream-knowledge.cjs");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const REVIEW_ID = "6529-stream";
const ACTIVE_VERSION = "2026-07-30.1";
const HISTORICAL_VERSION = "2026-07-27.1";
const PINNED_COMMIT = "513bd7e079eafe109df6ae1ae21bfbca6fec6786";
const KNOWLEDGE_ROOT = path.join(
  REPO_ROOT,
  "ops",
  "public-review-knowledge",
  REVIEW_ID,
  "versions",
  ACTIVE_VERSION,
  "knowledge"
);

function knowledgeArtifactPath(publicPath: string): string {
  const relativePath = publicPath.split("/knowledge/")[1];
  if (!relativePath) {
    throw new Error(`Invalid knowledge artifact path: ${publicPath}`);
  }
  return path.join(KNOWLEDGE_ROOT, ...relativePath.split("/"));
}

type SearchRecord = {
  id: string;
  category: string;
  kind: string;
  title: string;
  name?: string;
  signature?: string;
  selector?: string;
  topic0?: string;
  sourcePath?: string;
  scope?: string;
  classification?: string;
  recordShard: number;
};

type EvidenceRecord = SearchRecord & {
  summary?: string;
  canonicalPath: string;
  sourceLink?: string;
  bodyExcerpt?: string;
  text?: string;
  provenance?: {
    reviewVersion?: string;
    sourceCommit?: string;
  };
  technical?: {
    declaration?: {
      inputs?: unknown[];
      outputs?: unknown[];
      visibility?: string;
      stateMutability?: string;
      selector?: string;
      topic0?: string;
      natspec?: string;
      valueSource?: string;
    };
    abiSurfaceCounts?: {
      errors?: number;
    };
  };
  relationships?: {
    relatedDeclarationIds?: string[];
  };
  structured?: {
    lifecycleState?: string;
    deploymentStatus?: string;
    auditStatus?: string;
  };
};

type KnowledgeManifest = {
  knowledgeSha256: string;
  reviewVersion: string;
  reference: {
    bundleSha256: string;
  };
  editorial: {
    corpusSha256: string;
    pageCount: number;
    sectionCount: number;
  };
  counts: {
    total: number;
    byKind: Record<string, number>;
  };
  recordShards: Array<{
    path: string;
    sha256: string;
  }>;
};

type ValidatedKnowledgePack = {
  manifest: KnowledgeManifest;
  searchIndex: { schemaVersion: string; records: SearchRecord[] };
  records: EvidenceRecord[];
};

describe("Stream knowledge pack", () => {
  let active: ValidatedKnowledgePack;
  let historical: ValidatedKnowledgePack;
  let searchById: Map<string, SearchRecord>;
  let evidenceById: Map<string, EvidenceRecord>;

  beforeAll(() => {
    active = validateKnowledgePack({
      repoRoot: REPO_ROOT,
      reviewId: REVIEW_ID,
      reviewVersion: ACTIVE_VERSION,
      requireCurrentGenerator: true,
    }) as ValidatedKnowledgePack;
    historical = validateKnowledgePack({
      repoRoot: REPO_ROOT,
      reviewId: REVIEW_ID,
      reviewVersion: HISTORICAL_VERSION,
    }) as ValidatedKnowledgePack;
    searchById = new Map(
      active.searchIndex.records.map((record) => [record.id, record])
    );
    evidenceById = new Map(active.records.map((record) => [record.id, record]));
  });

  it("carries versioned identity, integrity, counts, and deterministic paths", () => {
    expect(active.manifest).toMatchObject({
      schemaVersion: KNOWLEDGE_MANIFEST_SCHEMA,
      reviewId: REVIEW_ID,
      reviewVersion: ACTIVE_VERSION,
      source: {
        repository: "6529-Collections/6529Stream",
        commit: PINNED_COMMIT,
      },
      publication: {
        lifecycleState: "PUBLIC_REVIEW",
        deploymentStatus: "NOT_DEPLOYED",
        auditStatus: "PRE_AUDIT",
      },
      searchIndex: {
        path: `/review-data/${REVIEW_ID}/versions/${ACTIVE_VERSION}/knowledge/search-index.json`,
      },
    });
    expect(active.searchIndex.schemaVersion).toBe(KNOWLEDGE_INDEX_SCHEMA);
    expect(active.manifest.knowledgeSha256).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(active.manifest.reference.bundleSha256).toMatch(
      /^sha256:[0-9a-f]{64}$/
    );
    expect(active.manifest.editorial.corpusSha256).toMatch(
      /^sha256:[0-9a-f]{64}$/
    );
    expect(active.manifest.counts.total).toBe(
      active.searchIndex.records.length
    );
    expect(active.manifest.recordShards).toHaveLength(
      Math.ceil(active.manifest.counts.total / 160)
    );
    expect(
      active.manifest.recordShards.every(
        (shard: { path: string; sha256: string }) =>
          shard.path.startsWith(
            `/review-data/${REVIEW_ID}/versions/${ACTIVE_VERSION}/knowledge/records/`
          ) && /^sha256:[0-9a-f]{64}$/.test(shard.sha256)
      )
    ).toBe(true);
    expect(historical.manifest.reviewVersion).toBe(HISTORICAL_VERSION);
  });

  it("splits editorial pages by semantic Markdown headings and canonical anchors", () => {
    expect(active.manifest.editorial.pageCount).toBe(14);
    expect(active.manifest.editorial.sectionCount).toBeGreaterThan(
      active.manifest.editorial.pageCount
    );
    const saleModes = active.records.find(
      (record) =>
        record.id ===
        "editorial:curation-and-tdh-authorization:why-each-field-exists:price-and-sale-mode"
    );
    expect(saleModes).toMatchObject({
      category: "editorial",
      kind: "editorial_section",
      provenance: {
        reviewVersion: ACTIVE_VERSION,
        sourceCommit: PINNED_COMMIT,
      },
    });
    expect(saleModes?.canonicalPath).toContain(
      `/reviews/${REVIEW_ID}/versions/${ACTIVE_VERSION}/curation-and-tdh-authorization#`
    );
    expect(saleModes?.text).toContain("fixed-price authorization");

    const chunks = splitEditorialPage({
      markdown: [
        "# Sample",
        "Intro.",
        "## Sale Modes",
        "Fixed price.",
        "### Auctions",
        "Auction details.",
      ].join("\n"),
      page: { id: "sample", title: "Sample", file: "sample.md" },
      reviewId: REVIEW_ID,
      reviewVersion: ACTIVE_VERSION,
      sourceCommit: PINNED_COMMIT,
    });
    expect(headingId("5. Curation becomes a bound authorization")).toBe(
      "curation-becomes-a-bound-authorization"
    );
    expect(chunks.map((record: { id: string }) => record.id)).toEqual([
      "editorial:sample:intro",
      "editorial:sample:sale-modes",
      "editorial:sample:sale-modes:auctions",
    ]);
  });

  it("extracts exact callable facts and bounded implementation evidence", () => {
    const id =
      "declaration:smart-contracts/AuctionContract.sol:StreamAuctions#function:0x7649eec6";
    const catalog = searchById.get(id);
    const evidence = evidenceById.get(id);

    expect(catalog).toMatchObject({
      kind: "function",
      name: "withdrawBidderCredit",
      signature: "withdrawBidderCredit()",
      selector: "0x7649eec6",
      scope: "protocol",
      classification: "production_release_contract",
      sourcePath: "smart-contracts/AuctionContract.sol",
    });
    expect(evidence?.technical?.declaration).toMatchObject({
      inputs: [],
      outputs: [],
      visibility: "external",
      stateMutability: "nonpayable",
      selector: "0x7649eec6",
    });
    expect(evidence?.bodyExcerpt).toContain("withdrawBidderCredit");
    expect(evidence?.bodyExcerpt?.length).toBeLessThanOrEqual(1_200);
    expect(evidence?.canonicalPath).toContain(
      `/reviews/${REVIEW_ID}/versions/${ACTIVE_VERSION}/reference/definitions/`
    );
    expect(evidence?.sourceLink).toContain(
      `/reviews/${REVIEW_ID}/versions/${ACTIVE_VERSION}/reference/sources/smart-contracts/AuctionContract.sol#L`
    );
  });

  it("describes StreamSplitWallet observations for native and ERC-20 assets", () => {
    const assetAwareFunctionIds = [
      "declaration:smart-contracts/StreamSplitWallet.sol:StreamSplitWallet#function:0x15dc07d7",
      "declaration:smart-contracts/StreamSplitWallet.sol:StreamSplitWallet#function:0x1c8db92d",
      "declaration:smart-contracts/StreamSplitWallet.sol:StreamSplitWallet#function:0x833a782a",
      "declaration:smart-contracts/StreamSplitWallet.sol:StreamSplitWallet#function:0xc45ac050",
      "declaration:smart-contracts/StreamSplitWallet.sol:StreamSplitWallet#function:0xee11f328",
    ];

    for (const id of assetAwareFunctionIds) {
      const record = evidenceById.get(id);
      expect(record?.summary).toContain("supported asset");
      expect(record?.summary).toContain("address(0)");
      expect(record?.summary).toContain("ERC-20");
      expect(record?.technical?.declaration?.natspec).toBe(record?.summary);
    }

    const currentBalance = evidenceById.get(
      "declaration:smart-contracts/StreamSplitWallet.sol:StreamSplitWallet#function:_currentBalance(address)"
    );
    expect(currentBalance?.summary).toContain("address(0)");
    expect(currentBalance?.summary).toContain("ERC-20");
  });

  it("redacts test signing-key values while preserving declaration metadata", () => {
    for (const pack of [active, historical]) {
      const signingKeys = pack.records.filter((record) =>
        /(?:private.*key|signer.*key)/i.test(record.name ?? "")
      );
      expect(signingKeys.length).toBeGreaterThan(0);
      for (const record of signingKeys) {
        expect(record.technical?.declaration?.valueSource).toBeUndefined();
        expect(record.name).toBeTruthy();
        expect(record.sourceLink).toBeTruthy();
      }
    }
  });

  it("links inherited ABI errors from their containing definitions", () => {
    const definitionId =
      "definition:test/StreamGovernanceBootstrap.t.sol:StreamGovernanceSSTORE2ReadHarness";
    const errorId =
      "declaration:smart-contracts/SSTORE2.sol:SSTORE2#error:0xd8415944";

    for (const pack of [active, historical]) {
      const harness = pack.records.find((record) => record.id === definitionId);
      expect(harness?.technical?.abiSurfaceCounts?.errors).toBe(1);
      expect(harness?.relationships?.relatedDeclarationIds).toContain(errorId);
      expect(pack.records.some((record) => record.id === errorId)).toBe(true);
    }
  });

  it("preserves compound editorial terms without Markdown wrap spaces", () => {
    const testEvidence = evidenceById.get(
      "editorial:security-testing-and-known-limitations:test-evidence"
    );

    expect(testEvidence?.text).toContain("signed-Drop-to-MintManager");
    expect(testEvidence?.text).not.toContain("signed-Drop-to- MintManager");
  });

  it("indexes functions, events, errors, topics, selectors, and source classifications", () => {
    const bidderEvent = active.searchIndex.records.find(
      (record) =>
        record.title ===
        "StreamAuctions.BidderCreditWithdrawn(address,address,uint256)"
    );
    const callerError = active.searchIndex.records.find(
      (record) =>
        record.title ===
        "IStreamArtworkFinalityRegistry.FinalityCallerNotFinalityAdmin(address)"
    );
    const sepolia = active.searchIndex.records.find(
      (record) => record.title === "RehearseDeployment.runSepolia()"
    );

    expect(bidderEvent).toMatchObject({
      kind: "event",
      topic0:
        "0x3f8729566a11fa4d9d7a96b1c030f775c0f1b9156d228a35ba90583747e7b8af",
    });
    expect(callerError).toMatchObject({
      kind: "error",
      selector: "0x1308739d",
    });
    expect(sepolia).toMatchObject({
      kind: "function",
      scope: "script",
      classification: "deployment_or_operational_source",
      sourcePath: "script/RehearseDeployment.s.sol",
    });
    expect(
      evidenceById.get(sepolia!.id)?.bodyExcerpt?.length
    ).toBeLessThanOrEqual(700);
    expect(
      active.records
        .filter((record) => record.scope === "test")
        .every((record) => !record.bodyExcerpt)
    ).toBe(true);
  });

  it("covers every indexed declaration and every protocol callable exact signature", () => {
    const reference = JSON.parse(
      fs.readFileSync(
        path.join(
          REPO_ROOT,
          "public",
          "review-data",
          REVIEW_ID,
          "versions",
          ACTIVE_VERSION,
          "reference-manifest.json"
        ),
        "utf8"
      )
    ) as {
      declarationIndex: Array<{
        id: string;
        scope: string;
        kind: string;
        canonicalSignature?: string;
      }>;
    };

    for (const declaration of reference.declarationIndex) {
      const record = searchById.get(`declaration:${declaration.id}`);
      expect(record).toBeDefined();
      if (
        declaration.scope === "protocol" &&
        declaration.kind === "function" &&
        declaration.canonicalSignature
      ) {
        expect(record?.signature).toBe(declaration.canonicalSignature);
      }
    }
  });

  it("keeps the complete catalog within the backend discovery budget", () => {
    const searchIndexPath = path.join(KNOWLEDGE_ROOT, "search-index.json");
    expect(fs.statSync(searchIndexPath).size).toBeLessThanOrEqual(8_000_000);
    expect(
      active.manifest.recordShards.every(
        (shard: { path: string }) =>
          fs.statSync(knowledgeArtifactPath(shard.path)).size <= 1_000_000
      )
    ).toBe(true);
  });

  it("retains explicit implementation, audit, readiness, risk, and deployment evidence", () => {
    expect(active.manifest.counts.byKind).toMatchObject({
      review_status: 1,
      readiness_requirement: 20,
      risk: 14,
      release_evidence: 2,
    });
    const reviewState = evidenceById.get(
      `status:${ACTIVE_VERSION}:review-state`
    );
    expect(reviewState?.structured).toMatchObject({
      lifecycleState: "PUBLIC_REVIEW",
      deploymentStatus: "NOT_DEPLOYED",
      auditStatus: "PRE_AUDIT",
    });
  });

  it("uses the declared shard schema for every content shard", () => {
    for (const shard of active.manifest.recordShards as Array<{
      path: string;
    }>) {
      const parsed = JSON.parse(
        fs.readFileSync(knowledgeArtifactPath(shard.path), "utf8")
      );
      expect(parsed.schemaVersion).toBe(KNOWLEDGE_SHARD_SCHEMA);
      expect(parsed.reviewVersion).toBe(ACTIVE_VERSION);
    }
  });

  it("fails with an actionable error for malformed shard manifests", () => {
    const temporaryRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "stream-knowledge-manifest-")
    );
    try {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(KNOWLEDGE_ROOT, "manifest.json"), "utf8")
      ) as Record<string, unknown>;
      manifest["recordShards"] = null;
      fs.writeFileSync(
        path.join(temporaryRoot, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`
      );

      expect(() =>
        validateKnowledgePack({
          repoRoot: REPO_ROOT,
          reviewId: REVIEW_ID,
          reviewVersion: ACTIVE_VERSION,
          knowledgeRootOverride: temporaryRoot,
        })
      ).toThrow("knowledge manifest record shards are invalid");
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("routes standalone knowledge generation through the artifact lock", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["public-review:knowledge"]).toContain(
      "stream-review-artifacts.cjs --knowledge-only"
    );
  });
});
