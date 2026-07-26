import { fireEvent, render, screen } from "@testing-library/react";

import {
  SolidityGovernedParameterExplorer,
  type SolidityGovernedParameterListItem,
} from "@/components/public-review/SolidityGovernedParameterExplorer";
import {
  SolidityNatSpecGapExplorer,
  type SolidityNatSpecGapListItem,
} from "@/components/public-review/SolidityNatSpecGapExplorer";
import {
  SolidityReadinessExplorer,
  type SolidityReadinessListItem,
} from "@/components/public-review/SolidityReadinessExplorer";
import { SolidityRiskExplorer } from "@/components/public-review/SolidityRiskExplorer";
import type { SolidityRiskRegisterEntry } from "@/lib/public-review/solidityReferenceTypes";

const GAPS: readonly SolidityNatSpecGapListItem[] = [
  {
    contract: "StreamCore",
    declarationHref: "/reviews/6529-stream/reference/definitions/core/events/1",
    follow_up: "Add event documentation before audit.",
    gapType: "event",
    id: "StreamCore:event:Minted(address,uint256)",
    kind: "event",
    line: 42,
    reason: "The event lacks nearby NatSpec.",
    signature: "Minted(address,uint256)",
    source: "smart-contracts/StreamCore.sol",
    sourceHref:
      "/reviews/6529-stream/reference/sources/smart-contracts/StreamCore.sol#L42",
    status: "missing_natspec",
  },
  {
    contract: "StreamCore",
    follow_up: "Document or deliberately exclude the inherited error.",
    gapType: "declaration",
    id: "StreamCore:custom_error:Unauthorized()",
    kind: "custom_error",
    line: null,
    reason: "The ABI declaration was not found in the local source.",
    signature: "Unauthorized()",
    source: "smart-contracts/StreamCore.sol",
    sourceHref:
      "/reviews/6529-stream/reference/sources/smart-contracts/StreamCore.sol",
    status: "declaration_not_in_source",
  },
];

const READINESS: readonly SolidityReadinessListItem[] = [
  {
    evidence: [],
    id: "external_audit_report",
    notes: "A completed external audit report is not retained.",
    owner: "TBD",
    phase: "public_beta",
    status: "missing",
  },
  {
    evidence: [
      {
        href: "https://github.com/6529-Collections/6529Stream/blob/abc/evidence.json",
        path: "release-artifacts/evidence.json",
        sha256: `sha256:${"a".repeat(64)}`,
      },
    ],
    id: "production_signatures",
    notes: "A signature bundle is pending.",
    owner: "release",
    phase: "production_release",
    status: "pending",
  },
];

const RISKS: readonly SolidityRiskRegisterEntry[] = [
  {
    area: "audit",
    checks: ["check_audit"],
    evidence: [],
    id: "RISK-AUD-001",
    mitigation: "Retain an independent audit.",
    owner: "TBD",
    residual_risk: "Local tests are not an audit.",
    risk_acceptance: null,
    severity: "critical",
    source: "audit package",
    status: "open_blocker",
    target_gate: "Gate F",
    title: "External audit is missing",
    tracking: ["https://github.com/6529-Collections/6529Stream/issues/1"],
  },
  {
    area: "governance",
    checks: ["check_governance"],
    evidence: [],
    id: "RISK-GOV-001",
    mitigation: "Retain the signer ceremony.",
    owner: "release",
    residual_risk: "Custody remains unproven.",
    risk_acceptance: null,
    severity: "high",
    source: "release package",
    status: "planned_mitigation",
    target_gate: "Gate E",
    title: "Signer evidence is incomplete",
    tracking: [],
  },
];

const PARAMETERS: readonly SolidityGovernedParameterListItem[] = [
  {
    constant_name: "GGP_GAS_LIMIT",
    expected_hosts: {
      count: 1,
      profiles: [{ id: 1, key: "STREAM_CORE" }],
      status: "complete",
    },
    family: "GGP",
    fixed_stipend_compatibility: {
      consumers: ["royaltyInfo(uint256,uint256)"],
      disposition: "evidence_required",
      evidence_path: null,
      evidence_sha256: null,
      status: "missing",
    },
    gas: {
      failure_class: {
        id: 1,
        name: "FORWARDING_CAP",
        status: "complete",
      },
      genesis_value: { status: "planning", value: 50_000 },
      immutable_floor: { status: "missing", value: null },
    },
    guarded_consumers: {
      consumers: ["StreamCore.royaltyInfo(uint256,uint256)"],
      status: "planning",
    },
    identifier_schema_version: 1,
    measurement_evidence: {
      path: null,
      sha256: null,
      status: "missing",
    },
    name: "GAS_LIMIT",
    normative_source: {
      anchor: "RSR-GGP",
      href: "https://github.com/6529-Collections/6529Stream/blob/abc/docs/governance.md#rsr-ggp",
      path: "docs/governance.md",
      status: "complete",
    },
    order: 1,
    parameter_id: `0x${"1".repeat(64)}`,
    preimage: "6529STREAM_GGP_GAS_LIMIT",
    time: null,
  },
];

describe("Solidity auditor-evidence explorers", () => {
  it("keeps event and declaration documentation gaps first class", () => {
    render(<SolidityNatSpecGapExplorer items={GAPS} />);

    fireEvent.change(screen.getByLabelText("Documentation gap type"), {
      target: { value: "event" },
    });
    expect(screen.getByText("StreamCore.Minted(address,uint256)")).toBeVisible();
    expect(
      screen.queryByText("StreamCore.Unauthorized()")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "smart-contracts/StreamCore.sol:42",
      })
    ).toHaveAttribute("href", expect.stringContaining("#L42"));
  });

  it("filters retained readiness requirements by phase and status", () => {
    render(<SolidityReadinessExplorer items={READINESS} />);

    fireEvent.change(screen.getByLabelText("Release phase"), {
      target: { value: "production_release" },
    });
    expect(screen.getByText("production signatures")).toBeInTheDocument();
    expect(screen.queryByText("external audit report")).not.toBeInTheDocument();
  });

  it("searches risk mitigations and governed-parameter consumers", () => {
    const { unmount } = render(<SolidityRiskExplorer items={RISKS} />);
    fireEvent.change(screen.getByLabelText("Search risks"), {
      target: { value: "independent audit" },
    });
    expect(screen.getByText("External audit is missing")).toBeInTheDocument();
    expect(
      screen.queryByText("Signer evidence is incomplete")
    ).not.toBeInTheDocument();
    unmount();

    render(
      <SolidityGovernedParameterExplorer
        candidateBinding={{
          blocked_by_issue:
            "https://github.com/6529-Collections/6529Stream/issues/656",
          candidate_artifact_path: null,
          candidate_artifact_sha256: null,
          candidate_commit: null,
          candidate_id: null,
          host_bindings: [],
          status: "not_available",
        }}
        items={PARAMETERS}
        policy={{
          action_class: { id: 1, name: "DELAYED_LOOSENING" },
          domains: {},
          forbidden_surfaces: ["lower_mutation"],
          genesis_revision: 1,
          maximum_raise_multiplier: { denominator: 1, numerator: 2 },
          minimum_delay_seconds: 172_800,
          mutation_model: "raise_only",
          one_write_per_action_per_parameter: true,
          status: "complete",
        }}
      />
    );
    fireEvent.change(screen.getByLabelText("Search governed parameters"), {
      target: { value: "royaltyInfo" },
    });
    expect(screen.getByText("GAS_LIMIT")).toBeInTheDocument();
    expect(
      screen.getByText("StreamCore.royaltyInfo(uint256,uint256)")
    ).toBeInTheDocument();
  });
});
