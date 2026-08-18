import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  COMPATIBILITY_CONTRACT,
  findMuseumResearchSectionDrift,
  verifyMuseumPublicationCompatibility,
} from "@/scripts/museum-publication-compatibility";
import { MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS } from "@/app/museum/network/research/catalog";
import {
  createCaseyFixture,
  EXACT_COMMIT,
} from "@/__tests__/lib/museum/publication/fixture";
import { GitHubMuseumPublicationSource } from "@/lib/museum/publication/github";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";

const PUBLICATION_COMMIT = "b".repeat(40);
const CATALOG_CONTENT_HASH = `0x${"c".repeat(64)}`;

function researchPublicationFixture(
  markdownTransform: (markdown: string, researchId: string) => string = (
    markdown
  ) => markdown
) {
  const records = Object.values(MUSEUM_RESEARCH_ACQUISITION_ASSIGNMENTS).map(
    (assignment) => {
      const sourcePath = `docs/research/${assignment.researchId}.md`;
      const markdown = [
        `# ${assignment.selectedSections[0]}`,
        ...assignment.selectedSections
          .slice(1)
          .map((heading) => `## ${heading}`),
      ].join("\n\n");
      return {
        record: {
          kind: "research" as const,
          id: assignment.researchId,
          slug: assignment.researchId.toLowerCase(),
          title: assignment.researchId,
          publicationKind: "acquisition_essay",
          publicationUri: buildImmutableMuseumBlobUrl(
            PUBLICATION_COMMIT,
            sourcePath
          ),
          authorIds: [],
          subjectIds: [],
          sourcePath: `records/research/${assignment.researchId}.json`,
        },
        document: {
          id: assignment.researchId,
          kind: "acquisition_essay" as const,
          title: assignment.researchId,
          markdown: markdownTransform(markdown, assignment.researchId),
          sha256: null,
          sourcePath,
          artistIds: [],
          projectIds: [],
          giftIds: [],
          artworkIds: [],
          workIds: [],
        },
      };
    }
  );
  return {
    documents: records.map(({ document }) => document),
    researchPublications: records.map(({ record }) => record),
  };
}

function validPublicationIdentity() {
  return {
    repository: "6529-Collections/6529networkmuseum" as const,
    requestedRef: EXACT_COMMIT,
    commit: PUBLICATION_COMMIT,
    manifestPath: "release-artifacts/latest/record-manifest.json",
    manifestSha256: null,
    manifestCommitment: null,
    inventoryCount: 0,
    assembledAt: "2026-08-12T00:00:00Z",
    catalogId: `6529NM-PUBCAT-${PUBLICATION_COMMIT}`,
    catalogContentHash: CATALOG_CONTENT_HASH as `0x${string}`,
  };
}

describe("museum publication compatibility", () => {
  it("keeps managed holds bound to GitHub Actions' exact API identities", () => {
    const workflow = fs.readFileSync(
      ".github/workflows/museum-publication-compatibility.yml",
      "utf8"
    );
    expect(workflow).toContain(
      `managed_authors='["app/github-actions","github-actions[bot]"]'`
    );
    expect(workflow).toContain("$authors | index($author)");
    expect(workflow).toContain("max_by(.number).number");
    expect(workflow).toContain(
      "Superseded by active automated Museum hold #${primary_issue_number}."
    );
    expect(workflow).not.toContain("github-actions[bot)");
  });

  it("accepts a catalog commit only when it resolves a verified immutable publication commit", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "current",
        publication: {
          identity: validPublicationIdentity(),
          ...researchPublicationFixture(),
        },
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toEqual({
        contract: COMPATIBILITY_CONTRACT,
        source_commit: EXACT_COMMIT,
        accepted: true,
        adapter_status: "current",
        adapter_error_code: null,
        publication_commit: PUBLICATION_COMMIT,
        catalog_id: `6529NM-PUBCAT-${PUBLICATION_COMMIT}`,
        catalog_content_hash: CATALOG_CONTENT_HASH,
      });
    } finally {
      load.mockRestore();
    }
  });

  it("fails closed when a reviewed research heading drifts", async () => {
    const driftedResearch = researchPublicationFixture(
      (markdown, researchId) =>
        researchId === "6529NM-RP-0002"
          ? markdown.replace("Managed movement", "Managed motion")
          : markdown
    );
    const publication = {
      identity: validPublicationIdentity(),
      ...driftedResearch,
    };
    expect(findMuseumResearchSectionDrift(publication as never)).toEqual([
      {
        researchId: "6529NM-RP-0002",
        heading: "Managed movement",
        occurrences: 0,
        reason: "heading_count",
      },
    ]);

    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "current",
        publication,
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toMatchObject({
        accepted: false,
        adapter_status: "current",
        adapter_error_code: "publication_research_section_drift",
      });
    } finally {
      load.mockRestore();
    }
  });

  it("ignores heading-shaped text after a language-tagged fenced example", () => {
    const fencedResearch = researchPublicationFixture((markdown, researchId) =>
      researchId === "6529NM-RP-0001"
        ? [
            "```markdown",
            "```tsx",
            "# The System in Seven States",
            "```",
            "",
            markdown,
          ].join("\n")
        : markdown
    );

    expect(
      findMuseumResearchSectionDrift({
        identity: validPublicationIdentity(),
        ...fencedResearch,
      } as never)
    ).toEqual([]);
  });

  it("fails closed before transport for a non-immutable source reference", async () => {
    const fixture = createCaseyFixture();

    await expect(
      verifyMuseumPublicationCompatibility({
        sourceCommit: "main",
        fetch: fixture.fetch,
      })
    ).resolves.toEqual({
      contract: COMPATIBILITY_CONTRACT,
      source_commit: "main",
      accepted: false,
      adapter_status: "invalid",
      adapter_error_code: "publication_invalid_commit",
      publication_commit: null,
      catalog_id: null,
      catalog_content_hash: null,
    });
    expect(fixture.calls).toEqual([]);
  });

  it("exits nonzero and retains the rejected result in output mode", () => {
    const outputDirectory = fs.mkdtempSync(
      path.join(process.cwd(), ".tmp-museum-compatibility-")
    );
    const outputPath = path.join(outputDirectory, "strict-adapter.json");
    const environment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "test",
    };
    delete environment["PUBLIC_RUNTIME"];

    try {
      const execution = spawnSync(
        process.execPath,
        [
          require.resolve("tsx/cli"),
          "scripts/museum-publication-compatibility.ts",
          "--source-commit",
          "main",
          "--output",
          outputPath,
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: environment,
        }
      );
      const retainedResult = fs.readFileSync(outputPath, "utf8");

      expect(execution.error).toBeUndefined();
      expect(execution.status).toBe(1);
      expect(execution.stderr).toBe("");
      expect(execution.stdout).toBe(retainedResult);
      expect(JSON.parse(retainedResult)).toEqual({
        contract: COMPATIBILITY_CONTRACT,
        source_commit: "main",
        accepted: false,
        adapter_status: "invalid",
        adapter_error_code: "publication_invalid_commit",
        publication_commit: null,
        catalog_id: null,
        catalog_content_hash: null,
      });
    } finally {
      fs.rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it("rejects a current publication without a verified catalog identity", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "current",
        publication: {
          identity: {
            commit: PUBLICATION_COMMIT,
            requestedRef: EXACT_COMMIT,
          },
        },
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toEqual({
        contract: COMPATIBILITY_CONTRACT,
        source_commit: EXACT_COMMIT,
        accepted: false,
        adapter_status: "current",
        adapter_error_code: "publication_source_identity_mismatch",
        publication_commit: PUBLICATION_COMMIT,
        catalog_id: null,
        catalog_content_hash: null,
      });
    } finally {
      load.mockRestore();
    }
  });

  it("rejects a catalog ID that is not bound to the publication/source commit", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "current",
        publication: {
          identity: {
            commit: PUBLICATION_COMMIT,
            requestedRef: EXACT_COMMIT,
            catalogId: `6529NM-PUBCAT-${EXACT_COMMIT}`,
            catalogContentHash: CATALOG_CONTENT_HASH,
          },
        },
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toMatchObject({
        accepted: false,
        adapter_error_code: "publication_source_identity_mismatch",
      });
    } finally {
      load.mockRestore();
    }
  });

  it("propagates a catalog content-hash mismatch as an unavailable publication", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "unavailable",
        publication: null,
        errorCode: "publication_catalog_content_hash_mismatch",
        failedAt: "2026-08-10T00:00:00.000Z",
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toMatchObject({
        accepted: false,
        adapter_status: "unavailable",
        adapter_error_code: "publication_catalog_content_hash_mismatch",
        publication_commit: null,
        catalog_id: null,
        catalog_content_hash: null,
      });
    } finally {
      load.mockRestore();
    }
  });

  it("rejects a reversed catalog/control and publication/source identity", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "current",
        publication: {
          identity: {
            commit: EXACT_COMMIT,
            requestedRef: PUBLICATION_COMMIT,
            catalogId: `6529NM-PUBCAT-${EXACT_COMMIT}`,
            catalogContentHash: CATALOG_CONTENT_HASH,
          },
        },
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toMatchObject({
        accepted: false,
        adapter_error_code: "publication_source_identity_mismatch",
        publication_commit: EXACT_COMMIT,
        catalog_id: `6529NM-PUBCAT-${EXACT_COMMIT}`,
        catalog_content_hash: CATALOG_CONTENT_HASH,
      });
    } finally {
      load.mockRestore();
    }
  });

  it("propagates a non-current adapter state with the fallback error code", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "unavailable",
        publication: null,
        errorCode: null,
        failedAt: "2026-08-06T00:00:00.000Z",
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toEqual({
        contract: COMPATIBILITY_CONTRACT,
        source_commit: EXACT_COMMIT,
        accepted: false,
        adapter_status: "unavailable",
        adapter_error_code: "publication_source_unavailable",
        publication_commit: null,
        catalog_id: null,
        catalog_content_hash: null,
      });
    } finally {
      load.mockRestore();
    }
  });

  it("keeps catalog/control and publication/source identities separate in every deployed sweep", () => {
    const adapter = fs.readFileSync(
      "scripts/museum-publication-compatibility.ts",
      "utf8"
    );
    const staging = fs.readFileSync(
      ".github/workflows/staging-e2e.yml",
      "utf8"
    );
    const production = fs.readFileSync(
      ".github/workflows/production-e2e.yml",
      "utf8"
    );
    const compatibility = fs.readFileSync(
      ".github/workflows/museum-publication-compatibility.yml",
      "utf8"
    );

    for (const [workflow, e2eStepName] of [
      [staging, "name: Run staging packs against staging.6529.io"],
      [production, "name: Run production-safe read-only packs"],
    ] as const) {
      expect(workflow).toContain("scripts/museum-publication-compatibility.ts");
      expect(workflow).toContain(
        "MUSEUM_CATALOG_COMMIT: ${{ steps.museum-selection.outputs.source_commit }}"
      );
      expect(workflow).toContain(
        "MUSEUM_PUBLICATION_EXPECTED_COMMIT: ${{ steps.museum-publication.outputs.publication_commit }}"
      );
      expect(workflow).not.toContain(
        "MUSEUM_PUBLICATION_EXPECTED_COMMIT: ${{ steps.museum-selection.outputs.source_commit }}"
      );
      expect(workflow).toContain("museum-publication-provenance.json");
      expect(workflow).toContain(
        "MUSEUM_PUBLICATION_OUTCOME: ${{ steps.museum-publication.outcome }}"
      );
      const resolveIndex = workflow.indexOf(
        "name: Resolve immutable Museum publication provenance"
      );
      const e2eIndex = workflow.indexOf(e2eStepName, resolveIndex);
      const provenanceIndex = workflow.indexOf(
        "immutable Museum provenance",
        e2eIndex
      );
      const uploadIndex = workflow.indexOf(
        "name: Upload manifest-bound Playwright evidence",
        provenanceIndex
      );
      expect(resolveIndex).toBeGreaterThanOrEqual(0);
      expect(e2eIndex).toBeGreaterThan(resolveIndex);
      expect(provenanceIndex).toBeGreaterThan(e2eIndex);
      expect(uploadIndex).toBeGreaterThan(provenanceIndex);
    }
    expect(staging.indexOf("museum-publication-provenance.json")).toBeLessThan(
      staging.indexOf("name: Validate exact manifest-bound E2E evidence")
    );
    expect(production).toContain(
      "provenance_file='isolated-production-e2e-artifacts/museum-publication-provenance.json'"
    );
    expect(production).toContain(
      ".source_commit == $selection[0].source_commit"
    );
    expect(production).not.toContain("MUSEUM_PUBLICATION_TEST_COMMIT");
    expect(adapter).toContain(
      "catalogResolver: museumPublicationCatalogResolver"
    );
    expect(compatibility).toContain(
      "publication_commit: ${{ steps.adapter.outputs.publication_commit }}"
    );
    expect(compatibility).toContain(
      "MUSEUM_PUBLICATION_EXPECTED_COMMIT: ${{ needs.strict-adapter.outputs.publication_commit }}"
    );
    expect(compatibility).not.toContain(
      "MUSEUM_PUBLICATION_EXPECTED_COMMIT: ${{ needs.resolve-canonical-source.outputs.source_commit }}"
    );
  });
});
