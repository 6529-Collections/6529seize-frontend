import Link from "next/link";
import type { ReactNode } from "react";

import { SolidityFileScopeDeclarations } from "@/components/public-review/SolidityFileScopeDeclarations";
import { SoliditySemanticIdentity } from "@/components/public-review/SoliditySemanticIdentity";
import { SoliditySourceReview } from "@/components/public-review/SoliditySourceReview";
import { SolidityDefinitionView } from "@/components/public-review/SolidityReferenceViews";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getSolidityDefinitionHref,
  getSolidityInterfaceHref,
  type SolidityReferenceHrefContext,
} from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityDefinitionIndexEntry,
  SolidityDefinitionShard,
  SolidityParameter,
  SolidityReferenceManifest,
  SolidityRoutedDeclaration,
  SoliditySourceDocument,
  SolidityTopLevelDeclaration,
} from "@/lib/public-review/solidityReferenceTypes";

const CARD_CLASSES =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5";
const DECLARATION_SOURCE_CONTEXT_LINES = 8;
type SolidityDisplayDeclaration =
  | SolidityRoutedDeclaration
  | Extract<
      SolidityTopLevelDeclaration,
      { kind: "function" | "event" | "error" }
    >;

function getBooleanLabel(value: boolean): string {
  return t(
    DEFAULT_LOCALE,
    value ? "publicReview.reference.yes" : "publicReview.reference.no"
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

function getIndexedLabel(indexed: boolean | undefined): string {
  if (indexed === undefined) {
    return "—";
  }
  return getBooleanLabel(indexed);
}

function ParameterTable({
  label,
  parameters,
}: {
  readonly label: string;
  readonly parameters: readonly SolidityParameter[];
}) {
  const headingId = `declaration-${label.toLowerCase().replaceAll(" ", "-")}`;
  const showIndexed = parameters.some(
    (parameter) => parameter.indexed !== undefined
  );
  const showInternalType = parameters.some(
    (parameter) =>
      parameter.internalType !== undefined &&
      parameter.internalType !== parameter.type
  );
  const showStorage = parameters.some(
    (parameter) => parameter.storageLocation !== undefined
  );
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {label}
      </h2>
      {parameters.length === 0 ? (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.reference.noParameters")}
        </p>
      ) : (
        <div
          aria-labelledby={headingId}
          className="tw-mt-4 tw-overflow-x-auto tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          role="region"
          tabIndex={0}>
          <table className="tw-w-full tw-min-w-[34rem] tw-border-collapse tw-text-left tw-text-sm">
            <thead className="tw-bg-iron-900 tw-text-iron-400">
              <tr>
                <th className="tw-p-3 tw-font-semibold">
                  {t(DEFAULT_LOCALE, "publicReview.reference.name")}
                </th>
                <th className="tw-p-3 tw-font-semibold">
                  {t(DEFAULT_LOCALE, "publicReview.reference.type")}
                </th>
                {showInternalType ? (
                  <th className="tw-p-3 tw-font-semibold">
                    {t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.internalType"
                    )}
                  </th>
                ) : null}
                {showStorage ? (
                  <th className="tw-p-3 tw-font-semibold">
                    {t(
                      DEFAULT_LOCALE,
                      "publicReview.reference.storageLocation"
                    )}
                  </th>
                ) : null}
                {showIndexed ? (
                  <th className="tw-p-3 tw-font-semibold">
                    {t(DEFAULT_LOCALE, "publicReview.reference.indexed")}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {parameters.map((parameter) => (
                <tr
                  key={`${parameter.index}:${parameter.name}:${parameter.type}`}
                  className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
                >
                  <td className="tw-p-3 tw-font-mono tw-text-iron-100">
                    {parameter.name || "—"}
                  </td>
                  <td className="tw-p-3 tw-font-mono tw-text-sky-200">
                    {parameter.type}
                  </td>
                  {showInternalType ? (
                    <td className="tw-p-3 tw-font-mono tw-text-iron-300">
                      {parameter.internalType ?? "—"}
                    </td>
                  ) : null}
                  {showStorage ? (
                    <td className="tw-p-3 tw-text-iron-300">
                      {parameter.storageLocation ?? "—"}
                    </td>
                  ) : null}
                  {showIndexed ? (
                    <td className="tw-p-3 tw-text-iron-300">
                      {getIndexedLabel(parameter.indexed)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DeclarationSemanticProperties({
  declaration,
}: {
  readonly declaration: SolidityDisplayDeclaration;
}) {
  return (
    <>
      {"functionKind" in declaration ? (
        <KeyValue
          label={t(DEFAULT_LOCALE, "publicReview.reference.functionKind")}
        >
          {declaration.functionKind}
        </KeyValue>
      ) : null}
      {"modifiers" in declaration ? (
        <KeyValue label={t(DEFAULT_LOCALE, "publicReview.reference.modifiers")}>
          {declaration.modifiers.length > 0
            ? declaration.modifiers.join(", ")
            : t(DEFAULT_LOCALE, "publicReview.reference.none")}
        </KeyValue>
      ) : null}
      {"virtual" in declaration ? (
        <KeyValue label={t(DEFAULT_LOCALE, "publicReview.reference.virtual")}>
          {getBooleanLabel(declaration.virtual)}
        </KeyValue>
      ) : null}
      {"syntheticGetter" in declaration ? (
        <KeyValue
          label={t(DEFAULT_LOCALE, "publicReview.reference.syntheticGetter")}
        >
          {getBooleanLabel(declaration.syntheticGetter)}
        </KeyValue>
      ) : null}
      {"anonymous" in declaration ? (
        <KeyValue
          label={t(DEFAULT_LOCALE, "publicReview.reference.anonymousEvent")}
        >
          {getBooleanLabel(declaration.anonymous)}
        </KeyValue>
      ) : null}
    </>
  );
}

export function SolidityDeclarationView({
  declaration,
  definition,
  feedbackSlot,
  source,
}: {
  readonly declaration: SolidityDisplayDeclaration;
  readonly definition?: SolidityDefinitionIndexEntry | undefined;
  readonly feedbackSlot?: ReactNode | undefined;
  readonly source: SoliditySourceDocument;
}) {
  const selectorOrTopic =
    "topic0" in declaration ? declaration.topic0 : declaration.selector;
  const outputs = "outputs" in declaration ? declaration.outputs : [];
  const signature =
    declaration.canonicalSignature ?? declaration.displaySignature;
  const excerptLineStart = Math.max(
    1,
    declaration.range.lineStart - DECLARATION_SOURCE_CONTEXT_LINES
  );
  const excerptLineEnd = Math.min(
    source.file.lineCount,
    declaration.range.lineEnd + DECLARATION_SOURCE_CONTEXT_LINES
  );

  return (
    <div className="tw-space-y-8">
      <section className={CARD_CLASSES} aria-labelledby="declaration-signature">
        <h2
          id="declaration-signature"
          className="tw-m-0 tw-break-all tw-font-mono tw-text-xl tw-font-semibold tw-text-white sm:tw-text-2xl"
        >
          {signature}
        </h2>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-5 sm:tw-grid-cols-2">
          <KeyValue
            label={
              "topic0" in declaration
                ? t(DEFAULT_LOCALE, "publicReview.reference.topic")
                : t(DEFAULT_LOCALE, "publicReview.reference.selector")
            }
          >
            <code>{selectorOrTopic ?? "—"}</code>
          </KeyValue>
          {"stateMutability" in declaration ? (
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.mutability")}
            >
              {declaration.stateMutability}
            </KeyValue>
          ) : null}
          {"visibility" in declaration ? (
            <KeyValue
              label={t(DEFAULT_LOCALE, "publicReview.reference.visibility")}
            >
              {declaration.visibility}
            </KeyValue>
          ) : null}
          <DeclarationSemanticProperties declaration={declaration} />
          <KeyValue label={t(DEFAULT_LOCALE, "publicReview.reference.natspec")}>
            {declaration.natspec ||
              t(DEFAULT_LOCALE, "publicReview.reference.noNatspec")}
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceChecksum")}
          >
            <code>{declaration.range.sourceSha256}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.snippetChecksum")}
          >
            <code>{declaration.range.snippetSha256}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.byteRange")}
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.byteRangeValue", {
              length: formatInteger(
                DEFAULT_LOCALE,
                declaration.range.byteLength
              ),
              start: formatInteger(DEFAULT_LOCALE, declaration.range.byteStart),
            })}
          </KeyValue>
        </dl>
        <SoliditySemanticIdentity
          routeKey={declaration.key}
          semanticId={declaration.id}
        />
      </section>
      <div className="tw-grid tw-gap-8 xl:tw-grid-cols-2">
        <ParameterTable
          label={t(DEFAULT_LOCALE, "publicReview.reference.parameters")}
          parameters={declaration.inputs}
        />
        <ParameterTable
          label={t(DEFAULT_LOCALE, "publicReview.reference.outputs")}
          parameters={outputs}
        />
      </div>
      <SoliditySourceReview
        feedbackSlot={feedbackSlot}
        source={{
          ...(definition ? { contract: definition.name } : {}),
          declaration: signature,
          firstLineNumber: excerptLineStart,
          githubUrl: declaration.range.githubUrl,
          initialLineEnd: declaration.range.lineEnd,
          initialLineStart: declaration.range.lineStart,
          lines: source.lines.slice(excerptLineStart - 1, excerptLineEnd),
          path: source.file.path,
          sourceSha256: source.file.sha256,
        }}
      />
    </div>
  );
}

export function SolidityInterfaceView({
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
  return (
    <div className="tw-space-y-8">
      <section className={CARD_CLASSES} aria-labelledby="interface-identity">
        <h2
          id="interface-identity"
          className="tw-m-0 tw-font-mono tw-text-2xl tw-font-semibold tw-text-white"
        >
          {indexEntry.name}
        </h2>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-5 sm:tw-grid-cols-2">
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.interfaceId")}
          >
            <code>{indexEntry.interface.interfaceId ?? "—"}</code>
          </KeyValue>
          <KeyValue
            label={t(
              DEFAULT_LOCALE,
              "publicReview.reference.interfaceIdSource"
            )}
          >
            {indexEntry.interface.interfaceIdSource ?? "—"}
          </KeyValue>
          <KeyValue
            label={t(
              DEFAULT_LOCALE,
              "publicReview.reference.interfaceAbiChecksum"
            )}
          >
            <code>{indexEntry.interface.abiSha256 ?? "—"}</code>
          </KeyValue>
        </dl>
      </section>
      <SolidityDefinitionView
        hrefContext={hrefContext}
        indexEntry={indexEntry}
        manifest={manifest}
        shard={shard}
      />
    </div>
  );
}

export function SoliditySourceView({
  document,
  feedbackSlot,
  hrefContext,
  manifest,
}: {
  readonly document: SoliditySourceDocument;
  readonly feedbackSlot?: ReactNode | undefined;
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
}) {
  return (
    <div className="tw-space-y-8">
      <section className={CARD_CLASSES} aria-labelledby="source-file-identity">
        <h2
          id="source-file-identity"
          className="tw-m-0 tw-break-all tw-font-mono tw-text-xl tw-font-semibold tw-text-white"
        >
          {document.file.path}
        </h2>
        <dl className="tw-mb-0 tw-mt-5 tw-grid tw-gap-5 sm:tw-grid-cols-2">
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceChecksum")}
          >
            <code>{document.file.sha256}</code>
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.sourceScope")}
          >
            {document.file.scope}
          </KeyValue>
          <KeyValue
            label={t(DEFAULT_LOCALE, "publicReview.reference.lineCount")}
          >
            {formatInteger(DEFAULT_LOCALE, document.file.lineCount)}
          </KeyValue>
          <KeyValue
            label={t(
              DEFAULT_LOCALE,
              "publicReview.reference.sourceDefinitions"
            )}
          >
            <span className="tw-flex tw-flex-wrap tw-gap-2">
              {document.file.definitionIds.map((definitionId) => {
                const definition = manifest.definitionIndex.find(
                  (candidate) => candidate.id === definitionId
                );
                if (!definition) {
                  return null;
                }
                const href = definition.interface.published
                  ? getSolidityInterfaceHref({
                      ...hrefContext,
                      definitionKey: definition.key,
                    })
                  : getSolidityDefinitionHref({
                      ...hrefContext,
                      definitionKey: definition.key,
                    });
                return (
                  <Link
                    key={definition.id}
                    className="tw-rounded-lg tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-font-mono tw-text-xs tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                    href={href}
                  >
                    {definition.name}
                  </Link>
                );
              })}
            </span>
          </KeyValue>
        </dl>
      </section>
      <SolidityFileScopeDeclarations
        declarations={document.file.topLevelDeclarations}
      />
      <SoliditySourceReview
        feedbackSlot={feedbackSlot}
        source={{
          githubUrl: document.file.githubUrl,
          initialLineEnd: 1,
          initialLineStart: 1,
          lines: document.lines,
          path: document.file.path,
          sourceSha256: document.file.sha256,
        }}
      />
    </div>
  );
}
