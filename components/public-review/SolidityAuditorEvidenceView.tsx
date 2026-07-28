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
import {
  SolidityRiskExplorer,
  type SolidityRiskListItem,
} from "@/components/public-review/SolidityRiskExplorer";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getSolidityDeclarationIndexHref,
  getSoliditySourceHref,
  type SolidityReferenceHrefContext,
} from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityDeclarationIndexEntry,
  SolidityNatSpecGap,
  SolidityReferenceManifest,
} from "@/lib/public-review/solidityReferenceTypes";

const SUMMARY_CARD_CLASSES = "tw-min-w-0 tw-p-3";

function EvidenceSummaryCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | string;
}) {
  return (
    <div className={SUMMARY_CARD_CLASSES}>
      <dt className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-2 tw-break-words tw-font-mono tw-text-lg tw-font-semibold tw-text-white">
        {typeof value === "number"
          ? formatInteger(DEFAULT_LOCALE, value)
          : value.replaceAll("_", " ")}
      </dd>
    </div>
  );
}

function getPinnedRepositoryHref({
  commit,
  path,
  repository,
}: {
  readonly commit: string;
  readonly path: string;
  readonly repository: string;
}): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${repository}/blob/${commit}/${encodedPath}`;
}

function declarationLookupKey({
  kind,
  signature,
}: {
  readonly kind: SolidityNatSpecGap["kind"];
  readonly signature: string;
}): string {
  return `${kind === "custom_error" ? "error" : kind}:${signature}`;
}

function getUniqueDeclarationLookup(
  declarations: readonly SolidityDeclarationIndexEntry[]
): ReadonlyMap<string, SolidityDeclarationIndexEntry | undefined> {
  const candidates = new Map<
    string,
    readonly SolidityDeclarationIndexEntry[]
  >();
  for (const declaration of declarations) {
    const signature =
      declaration.canonicalSignature ?? declaration.displaySignature;
    const key = `${declaration.kind}:${signature}`;
    candidates.set(key, [...(candidates.get(key) ?? []), declaration]);
  }
  return new Map(
    [...candidates].map(([key, entries]) => [
      key,
      entries.length === 1 ? entries[0] : undefined,
    ])
  );
}

function getNatSpecItems({
  hrefContext,
  manifest,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
}): readonly SolidityNatSpecGapListItem[] {
  const declarations = getUniqueDeclarationLookup(manifest.declarationIndex);
  return manifest.auditorEvidence.natSpecGaps.gaps.map((gap) => {
    const declaration = declarations.get(declarationLookupKey(gap));
    const sourceHref = getSoliditySourceHref({
      ...hrefContext,
      sourcePath: gap.source,
    });
    return {
      ...gap,
      ...(declaration
        ? {
            declarationHref: getSolidityDeclarationIndexHref({
              ...hrefContext,
              declaration,
            }),
          }
        : {}),
      sourceHref: gap.line === null ? sourceHref : `${sourceHref}#L${gap.line}`,
    };
  });
}

function getReadinessItems(
  manifest: SolidityReferenceManifest
): readonly SolidityReadinessListItem[] {
  return manifest.auditorEvidence.readiness.requirements.map((requirement) => ({
    evidence: requirement.evidence.map((artifact) => ({
      ...artifact,
      href: getPinnedRepositoryHref({
        commit: manifest.source.commit,
        path: artifact.path,
        repository: manifest.source.repository,
      }),
    })),
    id: requirement.id,
    notes: requirement.notes,
    owner: requirement.owner,
    phase: requirement.phase,
    status: requirement.status,
  }));
}

function getRiskItems(
  manifest: SolidityReferenceManifest
): readonly SolidityRiskListItem[] {
  return manifest.auditorEvidence.riskRegister.risks.map((risk) => ({
    area: risk.area,
    id: risk.id,
    mitigation: risk.mitigation,
    owner: risk.owner,
    residual_risk: risk.residual_risk,
    severity: risk.severity,
    status: risk.status,
    target_gate: risk.target_gate,
    title: risk.title,
    tracking: risk.tracking.map((href) =>
      href.startsWith("https://github.com/")
        ? href
        : getPinnedRepositoryHref({
            commit: manifest.source.commit,
            path: href,
            repository: manifest.source.repository,
          })
    ),
  }));
}

function getGovernedParameterItems(
  manifest: SolidityReferenceManifest
): readonly SolidityGovernedParameterListItem[] {
  return manifest.auditorEvidence.governedParameterInventory.parameters.map(
    (parameter) => ({
      ...parameter,
      normative_source: {
        ...parameter.normative_source,
        href: `${getPinnedRepositoryHref({
          commit: manifest.source.commit,
          path: parameter.normative_source.path,
          repository: manifest.source.repository,
        })}#${parameter.normative_source.anchor.toLocaleLowerCase(
          DEFAULT_LOCALE
        )}`,
      },
    })
  );
}

export type SolidityAuditorEvidenceSection =
  | "overview"
  | "readiness"
  | "risks"
  | "parameters"
  | "documentation";

function AuditorEvidenceOverview({
  manifest,
}: {
  readonly manifest: SolidityReferenceManifest;
}) {
  const evidence = manifest.auditorEvidence;
  const unfinishedRequirements = evidence.readiness.requirements.filter(
    (requirement) => requirement.status !== "complete"
  ).length;
  const openRiskBlockers = evidence.riskRegister.risks.filter(
    (risk) => risk.status === "open_blocker"
  ).length;

  return (
    <section
      aria-labelledby="solidity-auditor-evidence"
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-py-8"
    >
      <h2
        id="solidity-auditor-evidence"
        className="tw-m-0 tw-scroll-mt-28 tw-text-2xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.auditorEvidence")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.auditorEvidenceDescription")}
      </p>
      <dl className="tw-mb-0 tw-mt-5 tw-grid tw-grid-cols-2 tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03] xl:tw-grid-cols-4">
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.releaseStatus")}
          value={evidence.release.status}
        />
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.publicBeta")}
          value={evidence.readiness.status.public_beta}
        />
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.productionRelease")}
          value={evidence.readiness.status.production_release}
        />
        <EvidenceSummaryCard
          label={t(
            DEFAULT_LOCALE,
            "publicReview.reference.unfinishedRequirements"
          )}
          value={unfinishedRequirements}
        />
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.openRiskBlockers")}
          value={openRiskBlockers}
        />
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.natSpecGaps")}
          value={evidence.natSpecGaps.gapCount}
        />
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.governedParameters")}
          value={
            evidence.governedParameterInventory.inventory_summary
              .logical_parameter_count
          }
        />
        <EvidenceSummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.retainedArtifacts")}
          value={Object.keys(evidence.boundArtifactDigests).length}
        />
      </dl>
      <p className="tw-mb-0 tw-mt-4 tw-rounded-md tw-border tw-border-solid tw-border-[#5c4d3c] tw-bg-[#b48232]/[0.015] tw-p-4 tw-text-[13.5px] tw-font-light tw-leading-relaxed tw-text-[#c2b29e]">
        {evidence.riskRegister.readiness_boundary}
      </p>
    </section>
  );
}

export function SolidityAuditorEvidenceView({
  hrefContext,
  manifest,
  section,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
  readonly section: SolidityAuditorEvidenceSection;
}) {
  const evidence = manifest.auditorEvidence;

  switch (section) {
    case "overview":
      return <AuditorEvidenceOverview manifest={manifest} />;
    case "readiness":
      return <SolidityReadinessExplorer items={getReadinessItems(manifest)} />;
    case "risks":
      return <SolidityRiskExplorer items={getRiskItems(manifest)} />;
    case "parameters":
      return (
        <SolidityGovernedParameterExplorer
          candidateBinding={
            evidence.governedParameterInventory.candidate_binding
          }
          items={getGovernedParameterItems(manifest)}
          policy={evidence.governedParameterInventory.governance_policy}
        />
      );
    case "documentation":
      return (
        <SolidityNatSpecGapExplorer
          items={getNatSpecItems({ hrefContext, manifest })}
        />
      );
    default:
      return assertUnreachable(section);
  }
}
