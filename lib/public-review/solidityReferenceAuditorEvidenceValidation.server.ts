import "next/dist/compiled/server-only";

import type {
  SolidityAuditorEvidence,
  SolidityEvidenceArtifact,
  SolidityGovernedParameter,
  SolidityNatSpecGap,
  SolidityReadinessRequirement,
  SolidityRiskRegisterEntry,
} from "@/lib/public-review/solidityReferenceTypes";
import {
  assertNumberRecord,
  assertSafeSourcePath,
  assertStringRecord,
  isNonNegativeInteger,
  isPositiveInteger,
  isRecord,
  isSha256,
} from "@/lib/public-review/solidityReferenceValidationPrimitives.server";

const PARAMETER_ID_PATTERN = /^0x[0-9a-f]{64}$/;
const SAFE_ARTIFACT_PATH_PATTERN = /^[A-Za-z0-9._/-]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function assertStringArray(
  value: unknown,
  label: string
): asserts value is readonly string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => !isNonEmptyString(entry))
  ) {
    throw new Error(`Invalid ${label} in Solidity auditor evidence.`);
  }
}

function assertJsonValue(value: unknown, label: string): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => assertJsonValue(entry, label));
    return;
  }
  if (isRecord(value)) {
    Object.values(value).forEach((entry) => assertJsonValue(entry, label));
    return;
  }
  throw new Error(`Invalid ${label} JSON in Solidity auditor evidence.`);
}

function assertArtifactPath(value: unknown, label: string): asserts value is string {
  if (
    !isNonEmptyString(value) ||
    !SAFE_ARTIFACT_PATH_PATTERN.test(value) ||
    value.startsWith("/") ||
    value.includes("//") ||
    value.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(`Invalid ${label} path in Solidity auditor evidence.`);
  }
}

function assertEvidenceArtifact(
  value: unknown,
  label: string
): asserts value is SolidityEvidenceArtifact {
  if (!isRecord(value) || !isSha256(value["sha256"])) {
    throw new Error(`Invalid ${label} artifact in Solidity auditor evidence.`);
  }
  assertArtifactPath(value["path"], label);
}

function assertReadinessRequirement(
  value: unknown
): asserts value is SolidityReadinessRequirement {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value["id"]) ||
    !["public_beta", "production_release"].includes(String(value["phase"])) ||
    !isNonEmptyString(value["status"]) ||
    !isNonEmptyString(value["owner"]) ||
    !isNonEmptyString(value["notes"]) ||
    !Array.isArray(value["evidence"])
  ) {
    throw new Error("Invalid release-readiness requirement.");
  }
  value["evidence"].forEach((entry) =>
    assertEvidenceArtifact(entry, "release-readiness")
  );
  assertJsonValue(value["risk_acceptance"], "risk acceptance");
}

function assertRiskEntry(
  value: unknown
): asserts value is SolidityRiskRegisterEntry {
  const stringFields = [
    "area",
    "id",
    "mitigation",
    "owner",
    "residual_risk",
    "severity",
    "source",
    "status",
    "target_gate",
    "title",
  ];
  if (
    !isRecord(value) ||
    stringFields.some((field) => !isNonEmptyString(value[field])) ||
    !Array.isArray(value["evidence"])
  ) {
    throw new Error("Invalid risk-register entry.");
  }
  assertStringArray(value["checks"], "risk checks");
  assertStringArray(value["tracking"], "risk tracking");
  if (
    value["tracking"].some(
      (href) =>
        !href.startsWith(
          "https://github.com/6529-Collections/6529Stream/"
        )
    )
  ) {
    throw new Error("Invalid risk-register tracking link.");
  }
  value["evidence"].forEach((entry) =>
    assertEvidenceArtifact(entry, "risk-register")
  );
  assertJsonValue(value["risk_acceptance"], "risk acceptance");
}

function assertGovernedParameterCore(
  value: unknown
): asserts value is Record<string, unknown> {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value["order"]) ||
    !["GGP", "GTP"].includes(String(value["family"])) ||
    !isNonEmptyString(value["name"]) ||
    !isNonEmptyString(value["constant_name"]) ||
    !isNonEmptyString(value["preimage"]) ||
    !isNonEmptyString(value["parameter_id"]) ||
    !PARAMETER_ID_PATTERN.test(value["parameter_id"]) ||
    !isPositiveInteger(value["identifier_schema_version"]) ||
    !isRecord(value["normative_source"]) ||
    !isNonEmptyString(value["normative_source"]["status"]) ||
    !isNonEmptyString(value["normative_source"]["path"]) ||
    !isNonEmptyString(value["normative_source"]["anchor"]) ||
    !isRecord(value["expected_hosts"]) ||
    !isNonEmptyString(value["expected_hosts"]["status"]) ||
    !isNonNegativeInteger(value["expected_hosts"]["count"]) ||
    !Array.isArray(value["expected_hosts"]["profiles"]) ||
    !isRecord(value["guarded_consumers"]) ||
    !isNonEmptyString(value["guarded_consumers"]["status"])
  ) {
    throw new Error("Invalid governed-parameter evidence.");
  }
}

function assertGovernedValueEvidence(
  value: Record<string, unknown>
): void {
  const groups = [
    ["gas", ["genesis_value", "immutable_floor"]],
    [
      "time",
      [
        "genesis_value_blocks",
        "immutable_floor_blocks",
        "wall_clock_floor_seconds",
      ],
    ],
  ] as const;
  for (const [group, fields] of groups) {
    const evidence = value[group];
    if (evidence === null) {
      continue;
    }
    if (!isRecord(evidence)) {
      throw new Error("Invalid governed-parameter value evidence.");
    }
    for (const field of fields) {
      const record = evidence[field];
      if (
        !isRecord(record) ||
        !isNonEmptyString(record["status"]) ||
        (record["value"] !== null &&
          !isNonNegativeInteger(record["value"]))
      ) {
        throw new Error("Invalid governed-parameter value evidence.");
      }
    }
  }
  const gasEvidence = value["gas"];
  if (gasEvidence === null) {
    return;
  }
  if (!isRecord(gasEvidence)) {
    throw new Error("Invalid governed-parameter gas evidence.");
  }
  const failureClass = gasEvidence["failure_class"];
  if (
    !isRecord(failureClass) ||
    !isNonEmptyString(failureClass["status"]) ||
    !isPositiveInteger(failureClass["id"]) ||
    !isNonEmptyString(failureClass["name"])
  ) {
    throw new Error("Invalid governed-parameter failure class.");
  }
}

function assertGovernedSupportingEvidence(
  value: Record<string, unknown>
): void {
  const measurement = value["measurement_evidence"];
  const compatibility = value["fixed_stipend_compatibility"];
  if (
    !isRecord(measurement) ||
    !isNonEmptyString(measurement["status"]) ||
    (measurement["path"] !== null &&
      !isNonEmptyString(measurement["path"])) ||
    (measurement["sha256"] !== null &&
      !isSha256(measurement["sha256"])) ||
    !isRecord(compatibility) ||
    !isNonEmptyString(compatibility["status"]) ||
    !isNonEmptyString(compatibility["disposition"]) ||
    (compatibility["evidence_path"] !== null &&
      !isNonEmptyString(compatibility["evidence_path"])) ||
    (compatibility["evidence_sha256"] !== null &&
      !isSha256(compatibility["evidence_sha256"]))
  ) {
    throw new Error("Invalid governed-parameter supporting evidence.");
  }
  assertStringArray(
    compatibility["consumers"],
    "fixed-stipend consumers"
  );
}

function assertGovernedParameter(
  value: unknown
): asserts value is SolidityGovernedParameter {
  assertGovernedParameterCore(value);
  const normativeSource = value["normative_source"];
  const expectedHosts = value["expected_hosts"];
  const guardedConsumers = value["guarded_consumers"];
  if (
    !isRecord(normativeSource) ||
    !isRecord(expectedHosts) ||
    !Array.isArray(expectedHosts["profiles"]) ||
    !isRecord(guardedConsumers)
  ) {
    throw new Error("Invalid governed-parameter nested evidence.");
  }
  assertArtifactPath(
    normativeSource["path"],
    "governed-parameter source"
  );
  for (const profile of expectedHosts["profiles"]) {
    if (
      !isRecord(profile) ||
      !isPositiveInteger(profile["id"]) ||
      !isNonEmptyString(profile["key"])
    ) {
      throw new Error("Invalid governed-parameter host profile.");
    }
  }
  assertStringArray(
    guardedConsumers["consumers"],
    "governed-parameter consumers"
  );
  assertGovernedValueEvidence(value);
  assertGovernedSupportingEvidence(value);
  assertJsonValue(value, "governed parameter");
}

function assertGovernancePolicy(value: unknown): void {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value["status"]) ||
    !isRecord(value["action_class"]) ||
    !isPositiveInteger(value["action_class"]["id"]) ||
    !isNonEmptyString(value["action_class"]["name"]) ||
    !isNonNegativeInteger(value["minimum_delay_seconds"]) ||
    !isRecord(value["maximum_raise_multiplier"]) ||
    !isPositiveInteger(value["maximum_raise_multiplier"]["numerator"]) ||
    !isPositiveInteger(value["maximum_raise_multiplier"]["denominator"]) ||
    !isPositiveInteger(value["genesis_revision"]) ||
    typeof value["one_write_per_action_per_parameter"] !== "boolean" ||
    !isNonEmptyString(value["mutation_model"]) ||
    !isRecord(value["domains"])
  ) {
    throw new Error("Invalid governed-parameter governance policy.");
  }
  assertStringArray(
    value["forbidden_surfaces"],
    "forbidden governance surfaces"
  );
  for (const domain of Object.values(value["domains"])) {
    if (
      !isRecord(domain) ||
      !isNonEmptyString(domain["preimage"]) ||
      !isNonEmptyString(domain["keccak256"]) ||
      !PARAMETER_ID_PATTERN.test(domain["keccak256"])
    ) {
      throw new Error("Invalid governed-parameter domain evidence.");
    }
  }
}

function assertCandidateBinding(value: unknown): void {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value["status"]) ||
    !isNonEmptyString(value["blocked_by_issue"]) ||
    !value["blocked_by_issue"].startsWith(
      "https://github.com/6529-Collections/6529Stream/"
    ) ||
    !Array.isArray(value["host_bindings"])
  ) {
    throw new Error("Invalid governed-parameter candidate binding.");
  }
  for (const field of [
    "candidate_artifact_path",
    "candidate_artifact_sha256",
    "candidate_commit",
    "candidate_id",
  ]) {
    if (value[field] !== null && !isNonEmptyString(value[field])) {
      throw new Error("Invalid governed-parameter candidate binding.");
    }
  }
  assertJsonValue(value["host_bindings"], "candidate host bindings");
}

function assertNatSpecGap(
  value: unknown,
  sourcePaths: ReadonlySet<string>
): asserts value is SolidityNatSpecGap {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value["id"]) ||
    !isNonEmptyString(value["contract"]) ||
    !["function", "event", "custom_error"].includes(String(value["kind"])) ||
    ![
      "function",
      "event",
      "custom_error",
      "public_variable_getter",
      "declaration",
    ].includes(String(value["gapType"])) ||
    ![
      "missing_natspec",
      "public_variable_getter_missing_natspec",
      "declaration_not_in_source",
    ].includes(String(value["status"])) ||
    !isNonEmptyString(value["signature"]) ||
    !isNonEmptyString(value["reason"]) ||
    !isNonEmptyString(value["follow_up"]) ||
    (value["line"] !== null && !isPositiveInteger(value["line"])) ||
    !isNonEmptyString(value["source"])
  ) {
    throw new Error("Invalid normalized NatSpec gap.");
  }
  assertSafeSourcePath(value["source"]);
  if (!sourcePaths.has(value["source"])) {
    throw new Error("NatSpec gap references an unknown Solidity source.");
  }
  let expectedGapType = value["kind"];
  if (value["status"] === "declaration_not_in_source") {
    expectedGapType = "declaration";
  } else if (value["status"] === "public_variable_getter_missing_natspec") {
    expectedGapType = "public_variable_getter";
  }
  if (value["gapType"] !== expectedGapType) {
    throw new Error("Normalized NatSpec gap type drift.");
  }
}

function countBy(
  gaps: readonly SolidityNatSpecGap[],
  field: "gapType" | "kind" | "status"
): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const gap of gaps) {
    counts[gap[field]] = (counts[gap[field]] ?? 0) + 1;
  }
  return counts;
}

function recordsEqual(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => left[key] === right[key]);
}

function assertNatSpecEvidence(
  value: unknown,
  sourcePaths: ReadonlySet<string>
): void {
  if (
    !isRecord(value) ||
    !isRecord(value["baseline"]) ||
    value["baseline"]["path"] !==
      "release-artifacts/baselines/v0.1.0/natspec-coverage.json" ||
    value["baseline"]["schemaVersion"] !==
      "6529stream.natspec-coverage-baseline.v1" ||
    !isSha256(value["baseline"]["sha256"]) ||
    !isNonEmptyString(value["baseline"]["policy"]) ||
    !isNonEmptyString(value["baseline"]["scope"]) ||
    !isNonNegativeInteger(value["gapCount"]) ||
    !isRecord(value["counts"]) ||
    !Array.isArray(value["gaps"])
  ) {
    throw new Error("Invalid normalized NatSpec evidence.");
  }
  assertNumberRecord(value["counts"]["byGapType"], "NatSpec gap types");
  assertNumberRecord(value["counts"]["byKind"], "NatSpec gap kinds");
  assertNumberRecord(value["counts"]["byStatus"], "NatSpec gap statuses");
  const ids = new Set<string>();
  let previousId: string | undefined;
  value["gaps"].forEach((gap) => {
    assertNatSpecGap(gap, sourcePaths);
    if (
      ids.has(gap.id) ||
      (previousId !== undefined && previousId.localeCompare(gap.id, "en") >= 0)
    ) {
      throw new Error("Duplicate or unsorted normalized NatSpec gap.");
    }
    ids.add(gap.id);
    previousId = gap.id;
  });
  const gaps = value["gaps"] as readonly SolidityNatSpecGap[];
  if (
    value["gapCount"] !== gaps.length ||
    !recordsEqual(value["counts"]["byGapType"], countBy(gaps, "gapType")) ||
    !recordsEqual(value["counts"]["byKind"], countBy(gaps, "kind")) ||
    !recordsEqual(value["counts"]["byStatus"], countBy(gaps, "status"))
  ) {
    throw new Error("Normalized NatSpec gap summary drift.");
  }
}

function assertBoundArtifacts(value: unknown): void {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    throw new Error("Missing retained artifact bindings.");
  }
  for (const [artifactPath, digest] of Object.entries(value)) {
    assertArtifactPath(artifactPath, "retained artifact");
    if (
      !isRecord(digest) ||
      !isSha256(digest["sha256"]) ||
      !isNonNegativeInteger(digest["sizeBytes"]) ||
      (digest["schemaVersion"] !== null &&
        !isNonEmptyString(digest["schemaVersion"]))
    ) {
      throw new Error("Invalid retained artifact binding.");
    }
  }
}

export function assertAuditorEvidence(
  value: unknown,
  sourcePaths: ReadonlySet<string>
): asserts value is SolidityAuditorEvidence {
  if (
    !isRecord(value) ||
    value["schemaVersion"] !== "6529stream.release-manifest.v1" ||
    !isSha256(value["sha256"]) ||
    !isRecord(value["release"]) ||
    value["release"]["project"] !== "6529Stream" ||
    !isNonEmptyString(value["release"]["status"]) ||
    !isRecord(value["readiness"]) ||
    value["readiness"]["schema_version"] !==
      "6529stream.public-beta-evidence.v1" ||
    !isNonEmptyString(value["readiness"]["release_version"]) ||
    !isRecord(value["readiness"]["status"]) ||
    !isNonEmptyString(value["readiness"]["status"]["public_beta"]) ||
    !isNonEmptyString(value["readiness"]["status"]["production_release"]) ||
    !Array.isArray(value["readiness"]["requirements"]) ||
    !isRecord(value["riskRegister"]) ||
    value["riskRegister"]["schema_version"] !==
      "6529stream.risk-register.v1" ||
    !isNonEmptyString(value["riskRegister"]["maturity"]) ||
    !isNonEmptyString(value["riskRegister"]["readiness_boundary"]) ||
    !isNonEmptyString(value["riskRegister"]["risk_acceptance_policy"]) ||
    !Array.isArray(value["riskRegister"]["risks"]) ||
    !isRecord(value["governedParameterInventory"]) ||
    value["governedParameterInventory"]["schema_version"] !==
      "6529stream.governed-parameter-inventory.v1" ||
    !Array.isArray(value["governedParameterInventory"]["parameters"])
  ) {
    throw new Error("Invalid Solidity auditor evidence identity.");
  }
  assertStringArray(
    value["release"]["protocol_versions"],
    "protocol versions"
  );
  assertStringArray(
    value["release"]["deployment_versions"],
    "deployment versions"
  );
  const requirementValues = value["readiness"]["requirements"] as unknown[];
  requirementValues.forEach(assertReadinessRequirement);
  const requirements =
    requirementValues as readonly SolidityReadinessRequirement[];
  if (
    new Set(requirements.map((requirement) => requirement.id)).size !==
    requirements.length
  ) {
    throw new Error("Duplicate release-readiness requirement.");
  }
  const riskValues = value["riskRegister"]["risks"] as unknown[];
  riskValues.forEach(assertRiskEntry);
  assertStringRecord(
    value["riskRegister"]["status_taxonomy"],
    "risk status taxonomy"
  );
  const risks = riskValues as readonly SolidityRiskRegisterEntry[];
  if (new Set(risks.map((risk) => risk.id)).size !== risks.length) {
    throw new Error("Duplicate risk-register entry.");
  }
  const inventory = value["governedParameterInventory"];
  const parameterValues = inventory["parameters"] as unknown[];
  parameterValues.forEach(assertGovernedParameter);
  if (
    !isRecord(inventory["inventory_summary"]) ||
    !isNonNegativeInteger(inventory["inventory_summary"]["ggp_count"]) ||
    !isNonNegativeInteger(inventory["inventory_summary"]["gtp_count"]) ||
    !isNonNegativeInteger(
      inventory["inventory_summary"]["logical_parameter_count"]
    ) ||
    !isNonNegativeInteger(
      inventory["inventory_summary"]["expected_host_binding_count"]
    )
  ) {
    throw new Error("Invalid governed-parameter summary.");
  }
  const parameters = parameterValues as readonly SolidityGovernedParameter[];
  const parameterIds = new Set(parameters.map((parameter) => parameter.parameter_id));
  const orders = new Set(parameters.map((parameter) => parameter.order));
  const expectedHosts = parameters.reduce(
    (total, parameter) => total + parameter.expected_hosts.count,
    0
  );
  if (
    parameterIds.size !== parameters.length ||
    orders.size !== parameters.length ||
    inventory["inventory_summary"]["ggp_count"] !==
      parameters.filter((parameter) => parameter.family === "GGP").length ||
    inventory["inventory_summary"]["gtp_count"] !==
      parameters.filter((parameter) => parameter.family === "GTP").length ||
    inventory["inventory_summary"]["logical_parameter_count"] !==
      parameters.length ||
    inventory["inventory_summary"]["expected_host_binding_count"] !==
      expectedHosts
  ) {
    throw new Error("Governed-parameter inventory summary drift.");
  }
  assertCandidateBinding(inventory["candidate_binding"]);
  assertGovernancePolicy(inventory["governance_policy"]);
  assertBoundArtifacts(value["boundArtifactDigests"]);
  assertJsonValue(value["checksumBundle"], "checksum bundle");
  assertStringRecord(
    value["unavailableReleaseCeremony"],
    "unavailable release ceremony"
  );
  if (!isRecord(value["blockerReports"])) {
    throw new Error("Missing release blocker reports.");
  }
  for (const report of [
    value["blockerReports"]["publicBeta"],
    value["blockerReports"]["productionRelease"],
  ]) {
    if (
      !isRecord(report) ||
      !isSha256(report["sha256"]) ||
      !isNonNegativeInteger(report["size_bytes"])
    ) {
      throw new Error("Invalid release blocker report.");
    }
    assertArtifactPath(report["path"], "release blocker report");
  }
  assertNatSpecEvidence(value["natSpecGaps"], sourcePaths);
  const evidence = value as unknown as SolidityAuditorEvidence;
  const baselineDigest =
    evidence.boundArtifactDigests[evidence.natSpecGaps.baseline.path];
  if (baselineDigest?.sha256 !== evidence.natSpecGaps.baseline.sha256) {
    throw new Error("NatSpec baseline artifact binding drift.");
  }
}
