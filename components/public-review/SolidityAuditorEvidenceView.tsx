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

const SUMMARY_CARD_CLASSES =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4";

function EvidenceSummaryCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | string;
}) {
  return (
    <div className={SUMMARY_CARD_CLASSES}>
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
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
  return manifest.auditorEvidence.readiness.requirements.map(
    (requirement) => ({
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
    })
  );
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
    tracking: risk.tracking,
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

export function SolidityAuditorEvidenceView({
  hrefContext,
  manifest,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
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
    <div className="tw-space-y-8">
      <section aria-labelledby="solidity-auditor-evidence">
        <h2
          id="solidity-auditor-evidence"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.auditorEvidence")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.reference.auditorEvidenceDescription"
          )}
        </p>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
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
        <p className="tw-mb-0 tw-mt-4 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/30 tw-bg-amber-400/5 tw-p-4 tw-text-sm tw-leading-6 tw-text-amber-100">
          {evidence.riskRegister.readiness_boundary}
        </p>
      </section>

      <SolidityReadinessExplorer items={getReadinessItems(manifest)} />
      <SolidityRiskExplorer items={getRiskItems(manifest)} />
      <SolidityGovernedParameterExplorer
        candidateBinding={
          evidence.governedParameterInventory.candidate_binding
        }
        items={getGovernedParameterItems(manifest)}
        policy={evidence.governedParameterInventory.governance_policy}
      />
      <SolidityNatSpecGapExplorer
        items={getNatSpecItems({ hrefContext, manifest })}
      />
    </div>
  );
}
