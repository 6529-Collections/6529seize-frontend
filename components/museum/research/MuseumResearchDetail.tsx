import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumEntityContextModel,
  MuseumEntityRef,
} from "@/lib/museum/publication/ia";
import type {
  MuseumMedia,
  MuseumPublicDocument,
} from "@/lib/museum/publication/types";
import { MuseumBreadcrumbs } from "../MuseumBreadcrumbs";
import { MuseumEntityContext } from "../MuseumEntityContext";
import { MuseumMarkdown } from "../MuseumMarkdown";
import { MuseumPublicMediaFigure } from "../MuseumPublicMediaFigure";
import { MuseumRelatedEntities } from "../MuseumRelatedEntities";

export interface MuseumResearchDetailEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly categoryLabel: string;
  readonly categoryDescription: string;
  readonly kindLabel: string;
  readonly sourcePath: string;
  readonly document?: MuseumPublicDocument;
  readonly publicationUri?: string;
  readonly media?: MuseumMedia;
  readonly primaryRelations: readonly MuseumEntityRef[];
  readonly secondaryRelations: readonly MuseumEntityRef[];
}

export function MuseumResearchDetail({
  entry,
  context,
  workHrefs,
}: {
  readonly entry: MuseumResearchDetailEntry;
  readonly context: MuseumEntityContextModel;
  readonly workHrefs: Readonly<Record<string, string>>;
}) {
  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <header className="tw-mt-6 tw-max-w-4xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {entry.categoryLabel}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-4xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-5xl">
          {entry.title}
        </h1>
        <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-text-primary-200 tw-rounded-full tw-border tw-border-primary-400/40 tw-bg-primary-400/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold">
            {t(DEFAULT_LOCALE, "museum.network.research.detailEyebrow")}
          </span>
          <span className="tw-text-sm tw-text-iron-400">{entry.kindLabel}</span>
        </div>
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {entry.categoryDescription}
        </p>
      </header>

      {entry.media === undefined ? null : (
        <div className="tw-mt-10 tw-max-w-4xl">
          <MuseumPublicMediaFigure
            src={entry.media.url}
            width={entry.media.width}
            height={entry.media.height}
            alt={entry.media.altText ?? entry.title}
            title={entry.title}
            eager
            qualifier={entry.media.credit.creditLine}
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
        </div>
      )}

      <MuseumEntityContext
        context={context}
        labels={{
          ariaLabel: t(
            DEFAULT_LOCALE,
            "museum.network.accessibility.entityContext"
          ),
          source: t(DEFAULT_LOCALE, "museum.network.entity.sources"),
        }}
      />

      {entry.publicationUri === undefined ? null : (
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-text-sm">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.research.sourceContext")}
          </span>
          <a
            href={entry.publicationUri}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-11 tw-items-center tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(DEFAULT_LOCALE, "museum.network.research.openPublication")}
          </a>
        </div>
      )}

      {entry.document === undefined ? null : (
        <MuseumMarkdown
          className="tw-mt-10 tw-max-w-4xl"
          embeddedDocument
          sourceCommit={context.sourceCommit}
          sourcePath={entry.document.sourcePath}
          workHrefs={workHrefs}
        >
          {entry.document.markdown}
        </MuseumMarkdown>
      )}
      {entry.document === undefined && entry.publicationUri ? (
        <p className="tw-mt-10 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.research.typedRecordDescription")}
        </p>
      ) : null}

      <MuseumRelatedEntities
        entities={[...entry.primaryRelations, ...entry.secondaryRelations]}
        headingId="museum-research-related-title"
        title={t(DEFAULT_LOCALE, "museum.network.research.context")}
      />

      <Link
        href="/museum/network/research"
        className="hover:tw-text-primary-200 tw-mt-8 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.research.back")}
      </Link>
    </article>
  );
}
