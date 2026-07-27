import Link from "next/link";
import type { ReactNode } from "react";

import {
  SolidityDeclarationExplorer,
  type SolidityDeclarationListItem,
} from "@/components/public-review/SolidityDeclarationExplorer";
import { SolidityAuditorEvidenceView } from "@/components/public-review/SolidityAuditorEvidenceView";
import {
  SolidityDefinitionExplorer,
  type SolidityDefinitionListItem,
} from "@/components/public-review/SolidityDefinitionExplorer";
import { SolidityGlobalDeclarationExplorer } from "@/components/public-review/SolidityGlobalDeclarationExplorer";
import { SolidityInheritance } from "@/components/public-review/SolidityInheritance";
import { SolidityOtherDeclarationGroup } from "@/components/public-review/SolidityOtherDeclarationGroup";
import { SolidityReferenceSectionNavigation } from "@/components/public-review/SolidityReferenceSectionNavigation";
import { SoliditySemanticIdentity } from "@/components/public-review/SoliditySemanticIdentity";
import { SolidityWarnings } from "@/components/public-review/SolidityWarnings";
import { compareLocalized, formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getSolidityDeclarationHref,
  getSolidityDefinitionHref,
  getSolidityInterfaceHref,
  getSoliditySourceHref,
  type SolidityReferenceHrefContext,
} from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityAbiSurfaceEntry,
  SolidityDeclarationKind,
  SolidityDefinitionIndexEntry,
  SolidityDefinitionShard,
  SolidityReferenceManifest,
} from "@/lib/public-review/solidityReferenceTypes";

const CARD_CLASSES =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5";

function HumanizedValue({ value }: { readonly value: string }) {
  return <>{value.replaceAll("_", " ")}</>;
}

function SummaryCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className={CARD_CLASSES}>
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-2 tw-font-mono tw-text-2xl tw-font-semibold tw-text-white">
        {formatInteger(DEFAULT_LOCALE, value)}
      </dd>
    </div>
  );
}

function KeyValue({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1.5 tw-break-all tw-text-sm tw-leading-6 tw-text-iron-200">
        {children}
      </dd>
    </div>
  );
}

function ReleaseEvidence({
  definition,
}: {
  readonly definition: SolidityDefinitionIndexEntry;
}) {
  const { release } = definition;
  return (
    <section
      aria-labelledby="definition-release-evidence"
      className={CARD_CLASSES}
    >
      <h2
        id="definition-release-evidence"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.releaseEvidence")}
      </h2>
      <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-5 sm:tw-grid-cols-2">
        <KeyValue
          label={t(DEFAULT_LOCALE, "publicReview.reference.releaseCatalog")}
        >
          {definition.membership.releaseCatalog ?? "—"}
        </KeyValue>
        <KeyValue
          label={t(DEFAULT_LOCALE, "publicReview.reference.genesisTarget")}
        >
          {definition.membership.genesisTarget
            ? t(DEFAULT_LOCALE, "publicReview.reference.yes")
            : t(DEFAULT_LOCALE, "publicReview.reference.no")}
        </KeyValue>
        <KeyValue
          label={t(DEFAULT_LOCALE, "publicReview.reference.deploymentStatus")}
        >
          {definition.membership.deployment.status}
        </KeyValue>
        {release.summary ? (
          <>
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.functions")}
            >
              {formatInteger(DEFAULT_LOCALE, release.summary.function_count)}
            </KeyValue>
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.events")}
            >
              {formatInteger(DEFAULT_LOCALE, release.summary.event_count)}
            </KeyValue>
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.errors")}
            >
              {formatInteger(
                DEFAULT_LOCALE,
                release.summary.custom_error_count
              )}
            </KeyValue>
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.readFunctions")}
            >
              {formatInteger(
                DEFAULT_LOCALE,
                release.summary.read_function_count
              )}
            </KeyValue>
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.writeFunctions")}
            >
              {formatInteger(
                DEFAULT_LOCALE,
                release.summary.write_function_count
              )}
            </KeyValue>
            <KeyValue
              label={t(
                DEFAULT_LOCALE,
                "publicReview.reference.payableFunctions"
              )}
            >
              {formatInteger(
                DEFAULT_LOCALE,
                release.summary.payable_function_count
              )}
            </KeyValue>
          </>
        ) : null}
        {release.deployedBytecodeSizeBytes !== undefined ? (
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.bytecodeSize")}
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.bytes", {
              count: formatInteger(
                DEFAULT_LOCALE,
                release.deployedBytecodeSizeBytes
              ),
            })}
          </KeyValue>
        ) : null}
        {release.abiSha256 ? (
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.abiChecksum")}
          >
            <code>{release.abiSha256}</code>
          </KeyValue>
        ) : null}
        {release.bytecodeSha256 ? (
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.bytecodeChecksum")}
          >
            <code>{release.bytecodeSha256}</code>
          </KeyValue>
        ) : null}
        {release.deployedBytecodeSha256 ? (
          <KeyValue
            label={t(
              DEFAULT_LOCALE,
              "publicReview.reference.deployedBytecodeChecksum"
            )}
          >
            <code>{release.deployedBytecodeSha256}</code>
          </KeyValue>
        ) : null}
      </dl>
    </section>
  );
}

export function SolidityReferenceOverview({
  hrefContext,
  manifest,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
}) {
  const listItems: SolidityDefinitionListItem[] = manifest.definitionIndex.map(
    (definition) => ({
      classification: definition.classification,
      errorCount: definition.abiSurfaceCounts.errors,
      eventCount: definition.abiSurfaceCounts.events,
      functionCount: definition.abiSurfaceCounts.functions,
      href: definition.interface.published
        ? getSolidityInterfaceHref({
            ...hrefContext,
            definitionKey: definition.key,
          })
        : getSolidityDefinitionHref({
            ...hrefContext,
            definitionKey: definition.key,
          }),
      key: definition.key,
      kind: definition.kind,
      name: definition.name,
      scope: definition.scope,
      sourcePath: definition.sourcePath,
      tracked: definition.release.tracked,
      warningCount: definition.warningSummary.totalCount,
    })
  );
  const declarationScopes = Array.from(
    new Set(manifest.declarationIndex.map((declaration) => declaration.scope))
  ).sort((left, right) => compareLocalized(DEFAULT_LOCALE, left, right));

  return (
    <div className="tw-space-y-8">
      <dl className="tw-m-0 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-6">
        <SummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.definitions")}
          value={manifest.summary.definitionCount}
        />
        <SummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.contracts")}
          value={manifest.summary.contractCount}
        />
        <SummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.interfaces")}
          value={manifest.summary.interfaceCount}
        />
        <SummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.libraries")}
          value={manifest.summary.libraryCount}
        />
        <SummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.sourceFiles")}
          value={manifest.summary.fileCount}
        />
        <SummaryCard
          label={t(DEFAULT_LOCALE, "publicReview.reference.warnings")}
          value={manifest.summary.warningCount}
        />
      </dl>

      <SolidityReferenceSectionNavigation />

      <section
        aria-labelledby="solidity-generation-provenance"
        className={CARD_CLASSES}
      >
        <h2
          id="solidity-generation-provenance"
          className="tw-m-0 tw-scroll-mt-28 tw-text-xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.generatedLabel")}
        </h2>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-5 md:tw-grid-cols-2">
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceCommit")}
          >
            <code>{manifest.source.commit}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceTree")}
          >
            <code>{manifest.source.tree}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.compiler")}
          >
            <code>{manifest.source.compiler.version}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.evmVersion")}
          >
            <code>{manifest.source.compiler.evmVersion}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.optimizer")}
          >
            {manifest.source.compiler.optimizer.enabled
              ? t(DEFAULT_LOCALE, "publicReview.reference.optimizerEnabled", {
                  runs: formatInteger(
                    DEFAULT_LOCALE,
                    manifest.source.compiler.optimizer.runs
                  ),
                })
              : t(DEFAULT_LOCALE, "publicReview.reference.optimizerDisabled")}
          </KeyValue>
          {manifest.source.compiler.viaIR !== undefined ? (
            <KeyValue label={t(DEFAULT_LOCALE, "publicReview.reference.viaIr")}>
              {manifest.source.compiler.viaIR
                ? t(DEFAULT_LOCALE, "publicReview.reference.yes")
                : t(DEFAULT_LOCALE, "publicReview.reference.no")}
            </KeyValue>
          ) : null}
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.commitTimestamp")}
          >
            <time
              dateTime={manifest.source.commitTimestamp}
              title={manifest.source.commitTimestamp}
            >
              {formatDate(DEFAULT_LOCALE, manifest.source.commitTimestamp, {
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                month: "short",
                second: "2-digit",
                timeZone: "UTC",
                timeZoneName: "short",
                year: "numeric",
              })}
            </time>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.generator")}
          >
            <code>
              {manifest.generator.name} {manifest.generator.version}
            </code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.outputChecksum")}
          >
            <code>{manifest.generator.outputSha256}</code>
          </KeyValue>
        </dl>
      </section>

      <section
        aria-labelledby="solidity-classifications"
        className={CARD_CLASSES}
      >
        <h2
          id="solidity-classifications"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.classifications")}
        </h2>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          {Object.entries(manifest.summary.classifications).map(
            ([classification, count]) => (
              <div
                key={classification}
                className="tw-rounded-lg tw-bg-iron-900 tw-p-3"
              >
                <dt className="tw-text-sm tw-text-iron-300">
                  <HumanizedValue value={classification} />
                </dt>
                <dd className="tw-m-0 tw-mt-1 tw-font-mono tw-text-white">
                  {formatInteger(DEFAULT_LOCALE, count)}
                </dd>
              </div>
            )
          )}
        </dl>
      </section>

      <section
        aria-labelledby="solidity-retained-artifacts"
        className={CARD_CLASSES}
      >
        <h2
          id="solidity-retained-artifacts"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.artifactChecksums")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.reference.releaseEvidenceDescription"
          )}
        </p>
        <dl className="tw-mb-0 tw-mt-5 tw-space-y-3">
          {Object.entries(manifest.source.artifactChecksums).map(
            ([artifact, checksum]) => (
              <div
                key={artifact}
                className="tw-grid tw-gap-1 tw-rounded-lg tw-bg-iron-900 tw-p-3 lg:tw-grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]"
              >
                <dt className="tw-break-all tw-font-mono tw-text-xs tw-text-iron-300">
                  {artifact}
                </dt>
                <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-xs tw-text-sky-200">
                  {checksum}
                </dd>
              </div>
            )
          )}
        </dl>
      </section>

      <SolidityAuditorEvidenceView
        hrefContext={hrefContext}
        manifest={manifest}
      />

      <SolidityGlobalDeclarationExplorer
        linkMode={hrefContext.version ? "versioned" : "active"}
        reviewId={manifest.reviewId}
        scopes={declarationScopes}
        sourceCommit={manifest.source.commit}
        version={manifest.reviewVersion}
      />

      <SolidityDefinitionExplorer items={listItems} />
    </div>
  );
}

function getDeclarationItems({
  hrefContext,
  shard,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly shard: SolidityDefinitionShard;
}): readonly SolidityDeclarationListItem[] {
  const definitionKey = shard.definition.key;
  const functions = shard.definition.declarations.functions.map(
    (declaration) => ({
      href: getSolidityDeclarationHref({
        ...hrefContext,
        definitionKey,
        declarationKey: declaration.key,
        kind: "functions",
      }),
      key: declaration.key,
      kind: "function" as const,
      name: declaration.name,
      selectorOrTopic: declaration.selector ?? "—",
      signature: declaration.canonicalSignature ?? declaration.displaySignature,
      stateMutability: declaration.stateMutability,
      visibility: declaration.visibility,
    })
  );
  const events = shard.definition.declarations.events.map((declaration) => ({
    href: getSolidityDeclarationHref({
      ...hrefContext,
      definitionKey,
      declarationKey: declaration.key,
      kind: "events",
    }),
    key: declaration.key,
    kind: "event" as const,
    name: declaration.name,
    selectorOrTopic: declaration.topic0 ?? "—",
    signature: declaration.canonicalSignature ?? declaration.displaySignature,
  }));
  const errors = shard.definition.declarations.errors.map((declaration) => ({
    href: getSolidityDeclarationHref({
      ...hrefContext,
      definitionKey,
      declarationKey: declaration.key,
      kind: "errors",
    }),
    key: declaration.key,
    kind: "error" as const,
    name: declaration.name,
    selectorOrTopic: declaration.selector,
    signature: declaration.canonicalSignature ?? declaration.displaySignature,
  }));
  return [...functions, ...events, ...errors];
}

function AbiSurface({
  hrefContext,
  manifest,
  shard,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
  readonly shard: SolidityDefinitionShard;
}) {
  const entries: {
    readonly entry: SolidityAbiSurfaceEntry;
    readonly kind: SolidityDeclarationKind;
  }[] = [
    ...shard.definition.abiSurface.functions.map((entry) => ({
      entry,
      kind: "functions" as const,
    })),
    ...shard.definition.abiSurface.events.map((entry) => ({
      entry,
      kind: "events" as const,
    })),
    ...shard.definition.abiSurface.errors.map((entry) => ({
      entry,
      kind: "errors" as const,
    })),
  ];

  return (
    <details className={CARD_CLASSES}>
      <summary className="tw-cursor-pointer tw-text-xl tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
        {t(DEFAULT_LOCALE, "publicReview.reference.abiSurface")} (
        {formatInteger(DEFAULT_LOCALE, entries.length)})
      </summary>
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.abiSurfaceDescription")}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-2 tw-p-0">
        {entries.map(({ entry, kind }) => {
          const declaringDefinition = manifest.definitionIndex.find(
            (definition) => definition.id === entry.declaringDefinitionId
          );
          const declarationHref = declaringDefinition
            ? getSolidityDeclarationHref({
                ...hrefContext,
                definitionKey: declaringDefinition.key,
                declarationKey: Buffer.from(
                  entry.declarationId,
                  "utf8"
                ).toString("base64url"),
                kind,
              })
            : undefined;
          return (
            <li
              key={`${kind}:${entry.declarationId}`}
              className="tw-grid tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-3 lg:tw-grid-cols-[7rem_minmax(0,1fr)_minmax(8rem,auto)] lg:tw-items-center"
            >
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                {entry.inherited
                  ? t(DEFAULT_LOCALE, "publicReview.reference.inherited")
                  : t(DEFAULT_LOCALE, "publicReview.reference.local")}
              </span>
              {declarationHref ? (
                <Link
                  className="tw-break-all tw-font-mono tw-text-sm tw-text-white tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                  href={declarationHref}
                >
                  {entry.signature}
                </Link>
              ) : (
                <code className="tw-break-all tw-text-sm tw-text-white">
                  {entry.signature}
                </code>
              )}
              <code className="tw-break-all tw-text-xs tw-text-sky-300 lg:tw-text-right">
                {entry.selector ?? entry.topic0 ?? "—"}
              </code>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export function SolidityDefinitionView({
  hrefContext,
  indexEntry,
  manifest,
  shard,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly indexEntry: SolidityDefinitionIndexEntry;
  readonly manifest: SolidityReferenceManifest;
  readonly shard: SolidityDefinitionShard;
}) {
  const sourceHref = getSoliditySourceHref({
    ...hrefContext,
    sourcePath: indexEntry.sourcePath,
  });
  return (
    <div className="tw-space-y-8">
      <section className={CARD_CLASSES} aria-labelledby="definition-identity">
        <h2
          id="definition-identity"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
        >
          {indexEntry.name}
        </h2>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-5 md:tw-grid-cols-2">
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.definitionKind")}
          >
            {indexEntry.kind}
            {indexEntry.abstract
              ? ` (${t(DEFAULT_LOCALE, "publicReview.reference.abstract")})`
              : ""}
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceScope")}
          >
            {indexEntry.scope}
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.classification")}
          >
            <HumanizedValue value={indexEntry.classification} />
          </KeyValue>
          <KeyValue
            label={t(
              DEFAULT_LOCALE,
              "publicReview.reference.classificationReason"
            )}
          >
            {indexEntry.classificationReason}
          </KeyValue>
          <KeyValue label={t(DEFAULT_LOCALE, "publicReview.reference.source")}>
            <Link
              className="tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
              href={sourceHref}
            >
              {indexEntry.sourcePath}
            </Link>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.lines", {
              start: indexEntry.range.lineStart,
              end: indexEntry.range.lineEnd,
            })}
          >
            <a
              className="tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
              href={indexEntry.range.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              {t(DEFAULT_LOCALE, "publicReview.reference.openPinnedSource")}
            </a>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceChecksum")}
          >
            <code>{indexEntry.range.sourceSha256}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.snippetChecksum")}
          >
            <code>{indexEntry.range.snippetSha256}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.byteRange")}
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.byteRangeValue", {
              length: formatInteger(
                DEFAULT_LOCALE,
                indexEntry.range.byteLength
              ),
              start: formatInteger(DEFAULT_LOCALE, indexEntry.range.byteStart),
            })}
          </KeyValue>
          <KeyValue label={t(DEFAULT_LOCALE, "publicReview.reference.natspec")}>
            {shard.definition.natspec ||
              t(DEFAULT_LOCALE, "publicReview.reference.noNatspec")}
          </KeyValue>
        </dl>
        <SoliditySemanticIdentity
          routeKey={indexEntry.key}
          semanticId={indexEntry.id}
        />
      </section>

      <div className="tw-grid tw-gap-8 xl:tw-grid-cols-2">
        <ReleaseEvidence definition={indexEntry} />
        <SolidityWarnings
          summary={shard.warningSummary}
          warnings={shard.warnings}
        />
      </div>

      <SolidityInheritance
        hrefContext={hrefContext}
        manifest={manifest}
        shard={shard}
      />

      <SolidityDeclarationExplorer
        items={getDeclarationItems({ hrefContext, shard })}
      />

      <section aria-labelledby="other-local-declarations">
        <h2
          id="other-local-declarations"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.otherDeclarations")}
        </h2>
        <div className="tw-mt-5 tw-grid tw-gap-3 lg:tw-grid-cols-2">
          <SolidityOtherDeclarationGroup
            declarations={shard.definition.declarations.stateVariables}
            label={t(DEFAULT_LOCALE, "publicReview.reference.stateVariables")}
          />
          <SolidityOtherDeclarationGroup
            declarations={shard.definition.declarations.modifiers}
            label={t(DEFAULT_LOCALE, "publicReview.reference.modifiers")}
          />
          <SolidityOtherDeclarationGroup
            declarations={shard.definition.declarations.structs}
            label={t(DEFAULT_LOCALE, "publicReview.reference.structs")}
          />
          <SolidityOtherDeclarationGroup
            declarations={shard.definition.declarations.enums}
            label={t(DEFAULT_LOCALE, "publicReview.reference.enums")}
          />
          <SolidityOtherDeclarationGroup
            declarations={shard.definition.declarations.userDefinedValueTypes}
            label={t(
              DEFAULT_LOCALE,
              "publicReview.reference.userDefinedValueTypes"
            )}
          />
        </div>
      </section>

      <AbiSurface hrefContext={hrefContext} manifest={manifest} shard={shard} />
    </div>
  );
}
