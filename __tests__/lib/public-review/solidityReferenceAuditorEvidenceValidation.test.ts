jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { assertAuditorEvidence } from "@/lib/public-review/solidityReferenceAuditorEvidenceValidation.server";
import type { SolidityAuditorEvidence } from "@/lib/public-review/solidityReferenceTypes";

const BASELINE_PATH =
  "release-artifacts/baselines/v0.1.0/natspec-coverage.json";
const SHA = `sha256:${"a".repeat(64)}`;
const SOURCE_PATH = "smart-contracts/StreamCore.sol";

function createEvidence(): SolidityAuditorEvidence {
  return {
    blockerReports: {
      productionRelease: {
        path: "release-artifacts/latest/production-release-blockers.md",
        sha256: SHA,
        size_bytes: 1,
      },
      publicBeta: {
        path: "release-artifacts/latest/public-beta-blockers.md",
        sha256: SHA,
        size_bytes: 1,
      },
    },
    boundArtifactDigests: {
      [BASELINE_PATH]: {
        schemaVersion: "6529stream.natspec-coverage-baseline.v1",
        sha256: SHA,
        sizeBytes: 1,
      },
    },
    checksumBundle: {},
    governedParameterInventory: {
      candidate_binding: {
        blocked_by_issue:
          "https://github.com/6529-Collections/6529Stream/issues/656",
        candidate_artifact_path: null,
        candidate_artifact_sha256: null,
        candidate_commit: null,
        candidate_id: null,
        host_bindings: [],
        status: "not_available",
      },
      governance_policy: {
        action_class: { id: 1, name: "DELAYED_LOOSENING" },
        domains: {
          gas_scope: {
            keccak256: `0x${"1".repeat(64)}`,
            preimage: "6529STREAM_GAS_PARAMETER_SCOPE_V2",
          },
        },
        forbidden_surfaces: ["lower_mutation"],
        genesis_revision: 1,
        maximum_raise_multiplier: { denominator: 1, numerator: 2 },
        minimum_delay_seconds: 172_800,
        mutation_model: "raise_only",
        one_write_per_action_per_parameter: true,
        status: "complete",
      },
      inventory_summary: {
        expected_host_binding_count: 0,
        ggp_count: 0,
        gtp_count: 0,
        logical_parameter_count: 0,
      },
      parameters: [],
      schema_version: "6529stream.governed-parameter-inventory.v1",
    },
    natSpecGaps: {
      baseline: {
        path: BASELINE_PATH,
        policy: "New gaps fail unless deliberately baselined.",
        schemaVersion: "6529stream.natspec-coverage-baseline.v1",
        scope: "Release-relevant protocol surface.",
        sha256: SHA,
      },
      counts: {
        byGapType: { event: 1 },
        byKind: { event: 1 },
        byStatus: { missing_natspec: 1 },
      },
      gapCount: 1,
      gaps: [
        {
          contract: "StreamCore",
          follow_up: "Add NatSpec before audit.",
          gapType: "event",
          id: "StreamCore:event:Minted(address,uint256)",
          kind: "event",
          line: 42,
          reason: "The event lacks nearby NatSpec.",
          signature: "Minted(address,uint256)",
          source: SOURCE_PATH,
          status: "missing_natspec",
        },
      ],
    },
    readiness: {
      release_version: "v0.1.0-local",
      requirements: [],
      schema_version: "6529stream.public-beta-evidence.v1",
      status: {
        production_release: "blocked",
        public_beta: "blocked",
      },
    },
    release: {
      deployment_versions: ["anvil-v0.1.0"],
      project: "6529Stream",
      protocol_versions: ["0.1.0"],
      status: "pre_audit_local_baseline",
    },
    riskRegister: {
      maturity: "pre_audit_local_baseline",
      readiness_boundary: "This evidence is not a launch approval.",
      risk_acceptance_policy: "Accepted risks require owner approval.",
      risks: [],
      schema_version: "6529stream.risk-register.v1",
      status_taxonomy: {
        open_blocker: "Blocks public beta or production claims.",
      },
    },
    schemaVersion: "6529stream.release-manifest.v1",
    sha256: SHA,
    unavailableReleaseCeremony: {
      signed_git_tag: "not_available",
    },
  };
}

describe("Solidity auditor-evidence validation", () => {
  it("accepts internally consistent, source-bound evidence", () => {
    expect(() =>
      assertAuditorEvidence(createEvidence(), new Set([SOURCE_PATH]))
    ).not.toThrow();
  });

  it("rejects summary drift and unknown source references", () => {
    const summaryDrift = createEvidence();
    (summaryDrift.natSpecGaps.counts.byGapType as Record<string, number>)[
      "event"
    ] = 2;
    expect(() =>
      assertAuditorEvidence(summaryDrift, new Set([SOURCE_PATH]))
    ).toThrow("summary drift");

    const unknownSource = createEvidence();
    (
      unknownSource.natSpecGaps.gaps[0] as {
        source: string;
      }
    ).source = "smart-contracts/Unknown.sol";
    expect(() =>
      assertAuditorEvidence(unknownSource, new Set([SOURCE_PATH]))
    ).toThrow("unknown Solidity source");
  });

  it("rejects governed-parameter inventory summary drift", () => {
    const evidence = createEvidence();
    (
      evidence.governedParameterInventory.inventory_summary as {
        logical_parameter_count: number;
      }
    ).logical_parameter_count = 1;
    expect(() =>
      assertAuditorEvidence(evidence, new Set([SOURCE_PATH]))
    ).toThrow("inventory summary drift");
  });

  it("accepts safe retained risk tracking paths and rejects unsafe paths", () => {
    const createRisk = (tracking: readonly string[]) => ({
      area: "governance",
      checks: ["review_backlog"],
      evidence: [],
      id: "RISK-ONE-001",
      mitigation: "Resolve the tracked execution item.",
      owner: "protocol",
      residual_risk: "The item remains open.",
      risk_acceptance: null,
      severity: "high",
      source: "release package",
      status: "planned_mitigation",
      target_gate: "Gate E",
      title: "Execution backlog item remains open",
      tracking,
    });

    const retainedPath = createEvidence();
    (
      retainedPath.riskRegister as unknown as {
        risks: ReturnType<typeof createRisk>[];
      }
    ).risks = [createRisk(["ops/EXECUTION_BACKLOG.md"])];
    expect(() =>
      assertAuditorEvidence(retainedPath, new Set([SOURCE_PATH]))
    ).not.toThrow();

    for (const unsafePath of [
      "../ops/EXECUTION_BACKLOG.md",
      "javascript:alert(1)",
      "/ops/EXECUTION_BACKLOG.md",
    ]) {
      const unsafe = createEvidence();
      (
        unsafe.riskRegister as unknown as {
          risks: ReturnType<typeof createRisk>[];
        }
      ).risks = [createRisk([unsafePath])];
      expect(() =>
        assertAuditorEvidence(unsafe, new Set([SOURCE_PATH]))
      ).toThrow("Invalid risk-register tracking link.");
    }
  });
});
