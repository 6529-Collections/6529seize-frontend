import Link from "next/link";
import { MuseumMarkdown } from "./MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication";
import type {
  MuseumPublicDocument,
  MuseumRightsAction,
  MuseumRightsExpression,
  MuseumRightsHandbook,
  MuseumRightsUseStatus,
} from "@/lib/museum/publication";

const TEXT_LINK_CLASS =
  "hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const ACTIONS: readonly MuseumRightsAction[] = [
  "display_the_work",
  "publish_online",
  "publish_in_print",
  "make_preservation_copies",
  "share_an_adaptation",
  "make_commercial_use",
];

const ACTION_LABEL_KEYS = {
  display_the_work: "museum.network.rights.actions.display_the_work",
  publish_online: "museum.network.rights.actions.publish_online",
  publish_in_print: "museum.network.rights.actions.publish_in_print",
  make_preservation_copies:
    "museum.network.rights.actions.make_preservation_copies",
  share_an_adaptation: "museum.network.rights.actions.share_an_adaptation",
  make_commercial_use: "museum.network.rights.actions.make_commercial_use",
} as const satisfies Record<MuseumRightsAction, MessageKey>;

const STATUS_LABEL_KEYS = {
  allowed: "museum.network.rights.status.allowed",
  allowed_with_conditions:
    "museum.network.rights.status.allowed_with_conditions",
  not_licensed: "museum.network.rights.status.not_licensed",
  status_only: "museum.network.rights.status.status_only",
  case_by_case: "museum.network.rights.status.case_by_case",
} as const satisfies Record<MuseumRightsUseStatus, MessageKey>;

const STATUS_CLASSES = {
  allowed: "tw-border-green-400/30 tw-bg-green-400/10 tw-text-green-100",
  allowed_with_conditions:
    "tw-border-primary-400/30 tw-bg-primary-400/10 tw-text-primary-100",
  not_licensed:
    "tw-border-orange-400/30 tw-bg-orange-400/10 tw-text-orange-100",
  status_only: "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200",
  case_by_case:
    "tw-border-yellow-400/30 tw-bg-yellow-400/10 tw-text-yellow-100",
} as const satisfies Record<MuseumRightsUseStatus, string>;

function expressionGroups(handbook: MuseumRightsHandbook) {
  return [
    {
      id: "creative-commons",
      titleKey: "museum.network.rights.groups.creativeCommons" as const,
      expressions: handbook.expressions.filter(
        (expression) => expression.group === "creative_commons_license"
      ),
    },
    {
      id: "public-domain-tools",
      titleKey: "museum.network.rights.groups.tools" as const,
      expressions: handbook.expressions.filter(
        (expression) =>
          expression.group === "creative_commons_tool" ||
          expression.id === "in-copyright-no-public-license"
      ),
    },
    {
      id: "rights-statements",
      titleKey: "museum.network.rights.groups.rightsStatements" as const,
      expressions: handbook.expressions.filter(
        (expression) => expression.group === "rights_statement"
      ),
    },
    {
      id: "other",
      titleKey: "museum.network.rights.groups.other" as const,
      expressions: handbook.expressions.filter(
        (expression) => expression.group === "custom_license"
      ),
    },
  ];
}

function RightsExpressionCard({
  expression,
}: {
  readonly expression: MuseumRightsExpression;
}) {
  return (
    <article className="tw-flex tw-min-w-0 tw-flex-col tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6">
      <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-100">
        {expression.shortLabel}
      </h3>
      <p className="tw-m-0 tw-mt-3 tw-flex-1 tw-text-base tw-leading-7 tw-text-iron-400">
        {expression.summary}
      </p>
      <Link
        href={`/museum/network/rights/${expression.id}`}
        prefetch={false}
        className={`${TEXT_LINK_CLASS} tw-mt-4 tw-self-start`}
      >
        {t(DEFAULT_LOCALE, "museum.network.rights.openEntry")}
      </Link>
    </article>
  );
}

export function MuseumRightsDirectory({
  handbook,
}: {
  readonly handbook: MuseumRightsHandbook;
}) {
  return (
    <section
      aria-labelledby="museum-rights-directory-title"
      className="tw-mt-16 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <div className="tw-max-w-4xl">
        <h2
          id="museum-rights-directory-title"
          className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.rights.directoryTitle")}
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.rights.directoryDescription")}
        </p>
      </div>
      <div className="tw-mt-12 tw-space-y-14">
        {expressionGroups(handbook).map((group) => (
          <section key={group.id} aria-labelledby={`rights-group-${group.id}`}>
            <h3
              id={`rights-group-${group.id}`}
              className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100"
            >
              {t(DEFAULT_LOCALE, group.titleKey)}
            </h3>
            <div className="tw-mt-6 tw-grid tw-gap-x-8 tw-gap-y-8 md:tw-grid-cols-2 xl:tw-grid-cols-3">
              {group.expressions.map((expression) => (
                <RightsExpressionCard
                  key={expression.id}
                  expression={expression}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

export function MuseumRightsGuideCards({
  handbook,
}: {
  readonly handbook: MuseumRightsHandbook;
}) {
  const guides = [
    {
      document: handbook.artistGuide,
      href: "/museum/network/rights/artists",
      descriptionKey: "museum.network.rights.artistGuideDescription" as const,
    },
    {
      document: handbook.collectorGuide,
      href: "/museum/network/rights/collectors",
      descriptionKey:
        "museum.network.rights.collectorGuideDescription" as const,
    },
  ];
  return (
    <section
      aria-labelledby="museum-rights-guides-title"
      className="tw-mt-14 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <div className="tw-max-w-4xl">
        <h2
          id="museum-rights-guides-title"
          className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.rights.guidesTitle")}
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.rights.guidesDescription")}
        </p>
      </div>
      <div className="tw-mt-8 tw-grid tw-gap-8 md:tw-grid-cols-2">
        {guides.map(({ document, href, descriptionKey }) => (
          <article
            key={href}
            className="tw-flex tw-flex-col tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-7"
          >
            <h3 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-100">
              {document.title}
            </h3>
            <p className="tw-m-0 tw-mt-4 tw-flex-1 tw-text-base tw-leading-7 tw-text-iron-400">
              {t(DEFAULT_LOCALE, descriptionKey)}
            </p>
            <Link
              href={href}
              prefetch={false}
              className={`${TEXT_LINK_CLASS} tw-mt-5 tw-self-start`}
            >
              {t(DEFAULT_LOCALE, "museum.network.rights.readGuide")}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MuseumRightsGuideManuscript({
  document,
  sourceCommit,
}: {
  readonly document: MuseumPublicDocument;
  readonly sourceCommit: string;
}) {
  return (
    <div className="tw-mt-12 tw-max-w-4xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2">
      <MuseumMarkdown
        documentHeadings
        embeddedDocument
        sourceCommit={sourceCommit}
        sourcePath={document.sourcePath}
      >
        {document.markdown}
      </MuseumMarkdown>
    </div>
  );
}

function BulletSection({
  id,
  titleKey,
  values,
}: {
  readonly id: string;
  readonly titleKey: MessageKey;
  readonly values: readonly string[];
}) {
  if (values.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {t(DEFAULT_LOCALE, titleKey)}
      </h2>
      <ul className="tw-m-0 tw-mt-5 tw-list-disc tw-space-y-3 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300">
        {values.map((value) => (
          <li key={value} className="tw-pl-1">
            {value}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MuseumRightsExpressionPage({
  expression,
  handbook,
  sourceCommit,
}: {
  readonly expression: MuseumRightsExpression;
  readonly handbook: MuseumRightsHandbook;
  readonly sourceCommit: string;
}) {
  const sourceSnapshotUrl =
    expression.legalCode === null
      ? null
      : buildImmutableMuseumBlobUrl(sourceCommit, expression.legalCode.path);
  return (
    <article className="tw-min-w-0">
      <Link
        href="/museum/network/rights"
        prefetch={false}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-medium tw-text-iron-400 tw-underline tw-underline-offset-4 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.rights.backToHandbook")}
      </Link>

      <header className="tw-mt-6 tw-max-w-5xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.rights.detail.officialTerm")}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-4xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl">
          {expression.label}
        </h1>
        <p className="tw-m-0 tw-mt-6 tw-max-w-4xl tw-text-lg tw-leading-8 tw-text-iron-200">
          {expression.summary}
        </p>
        <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-2">
          {expression.version === null ? null : (
            <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-py-1 tw-text-sm tw-text-iron-300">
              {t(DEFAULT_LOCALE, "museum.network.rights.detail.version", {
                version: expression.version,
              })}
            </span>
          )}
          {expression.spdxId === null ? null : (
            <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-px-3 tw-py-1 tw-text-sm tw-text-iron-300">
              {t(DEFAULT_LOCALE, "museum.network.rights.detail.spdx", {
                spdx: expression.spdxId,
              })}
            </span>
          )}
        </div>
        {expression.canonicalUri === null ? null : (
          <a
            href={expression.canonicalUri}
            target="_blank"
            rel="license noopener noreferrer"
            className={`${TEXT_LINK_CLASS} tw-mt-5`}
          >
            {t(DEFAULT_LOCALE, "museum.network.rights.detail.openOfficial")}
          </a>
        )}
      </header>

      <section
        aria-labelledby="museum-rights-visitor-note"
        className="tw-mt-12 tw-max-w-4xl tw-border-l-2 tw-border-primary-400 tw-bg-iron-950 tw-p-6"
      >
        <h2
          id="museum-rights-visitor-note"
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100"
        >
          {t(DEFAULT_LOCALE, "museum.network.rights.detail.visitorNote")}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
          {expression.visitorNote}
        </p>
      </section>

      <section
        aria-labelledby="museum-rights-use-table"
        className="tw-mt-14 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      >
        <h2
          id="museum-rights-use-table"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.rights.detail.useTable")}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-400">
          {t(
            DEFAULT_LOCALE,
            "museum.network.rights.detail.useTableDescription"
          )}
        </p>
        <dl className="tw-m-0 tw-mt-7 tw-grid tw-gap-px tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 md:tw-grid-cols-2">
          {ACTIONS.map((action) => {
            const status = expression.useMatrix[action];
            return (
              <div key={action} className="tw-bg-black tw-p-5">
                <dt className="tw-text-base tw-font-semibold tw-text-iron-100">
                  {t(DEFAULT_LOCALE, ACTION_LABEL_KEYS[action])}
                </dt>
                <dd className="tw-m-0 tw-mt-3">
                  <span
                    className={`tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-px-3 tw-py-1 tw-text-sm tw-font-semibold ${STATUS_CLASSES[status]}`}
                  >
                    {t(DEFAULT_LOCALE, STATUS_LABEL_KEYS[status])}
                  </span>
                  <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
                    {handbook.useStatusDefinitions[status]}
                  </p>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <div className="tw-mt-14 tw-grid tw-gap-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-2">
        <BulletSection
          id="museum-rights-can-do"
          titleKey="museum.network.rights.detail.museumUse"
          values={expression.museumCan}
        />
        <BulletSection
          id="museum-rights-conditions"
          titleKey="museum.network.rights.detail.conditions"
          values={expression.conditions}
        />
        <BulletSection
          id="museum-rights-boundaries"
          titleKey="museum.network.rights.detail.boundaries"
          values={expression.boundaries}
        />
      </div>

      <section
        aria-labelledby="museum-rights-legal-code"
        className="tw-mt-14 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      >
        <h2
          id="museum-rights-legal-code"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.rights.detail.legalCode")}
        </h2>
        {expression.legalCode === null ? (
          <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.rights.detail.noLegalCode")}
          </p>
        ) : (
          <>
            <p className="tw-m-0 tw-mt-4 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-400">
              {t(
                DEFAULT_LOCALE,
                "museum.network.rights.detail.legalCodeDescription"
              )}
            </p>
            <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-1">
              <a
                href={expression.legalCode.publicationUri}
                target="_blank"
                rel="license noopener noreferrer"
                className={TEXT_LINK_CLASS}
              >
                {t(DEFAULT_LOCALE, "museum.network.rights.detail.openOfficial")}
              </a>
              {sourceSnapshotUrl === null ? null : (
                <a
                  href={sourceSnapshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={TEXT_LINK_CLASS}
                >
                  {t(
                    DEFAULT_LOCALE,
                    "museum.network.rights.detail.sourceSnapshot"
                  )}
                </a>
              )}
            </div>
            <details className="tw-mt-6 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
              <summary className="tw-cursor-pointer tw-px-5 tw-py-4 tw-text-base tw-font-semibold tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.rights.detail.showLegalCode"
                )}
              </summary>
              <pre className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-p-5 tw-text-sm tw-leading-6 tw-text-iron-300">
                {expression.legalCode.text}
              </pre>
            </details>
          </>
        )}
      </section>
    </article>
  );
}
