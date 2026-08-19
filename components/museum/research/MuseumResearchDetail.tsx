import Link from "next/link";
import type { ReactNode } from "react";
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
import { MuseumPublicMediaFigure } from "../MuseumPublicMediaFigure";
import { MuseumRelatedEntities } from "../MuseumRelatedEntities";
import { museumResearchMediaAspectRatio } from "./museumResearchMediaAspectRatio";
import { MuseumResearchReading } from "./MuseumResearchReading";

export interface MuseumResearchDetailEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly categoryLabel: string;
  readonly categoryDescription: string;
  readonly description: string;
  readonly kindLabel: string;
  readonly statusLabel?: string;
  readonly sourcePath: string;
  readonly document?: MuseumPublicDocument;
  readonly publicationUri?: string;
  readonly media?: MuseumMedia;
  readonly mobileMedia?: MuseumMedia;
  readonly mediaSrcSet?: string;
  readonly mediaQualifier?: string;
  readonly institutionalDisplay?: {
    readonly statement: string;
    readonly href: string;
    readonly linkLabel: string;
  };
  readonly selectedMarkdown?: string;
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
  const mediaAspectRatioProps: { aspectRatio?: number } = {};
  if (entry.media !== undefined) {
    const aspectRatio = museumResearchMediaAspectRatio(
      entry.media.width,
      entry.media.height
    );
    if (aspectRatio !== undefined) {
      mediaAspectRatioProps.aspectRatio = aspectRatio;
    }
  }
  const mediaSrcSetProps: { srcSet?: string } = {};
  if (entry.mediaSrcSet !== undefined) {
    mediaSrcSetProps.srcSet = entry.mediaSrcSet;
  }
  const mobileMediaAspectRatioProps: { aspectRatio?: number } = {};
  if (entry.mobileMedia !== undefined) {
    const aspectRatio = museumResearchMediaAspectRatio(
      entry.mobileMedia.width,
      entry.mobileMedia.height
    );
    if (aspectRatio !== undefined) {
      mobileMediaAspectRatioProps.aspectRatio = aspectRatio;
    }
  }
  const allRelations = [...entry.primaryRelations, ...entry.secondaryRelations];
  let illustratedWorkLimit = 7;
  if (entry.slug === "conflict-at-its-edges") {
    illustratedWorkLimit = 5;
  } else if (entry.slug === "access-control-and-exit") {
    illustratedWorkLimit = 16;
  }
  const illustratedWorks = allRelations
    .filter(
      (relation) => relation.kind === "work" && relation.media !== undefined
    )
    .filter(
      (relation, index, relations) =>
        relations.findIndex((candidate) => candidate.id === relation.id) ===
        index
    )
    .slice(0, illustratedWorkLimit);
  const illustratedIds = new Set(
    illustratedWorks.map((relation) => relation.id)
  );
  const magnumDisplayNotes: Readonly<Record<string, string>> =
    entry.slug === "conflict-at-its-edges"
      ? Object.fromEntries(
          illustratedWorks.map((work) => [
            work.id,
            t(
              DEFAULT_LOCALE,
              "museum.network.research.magnumDisplayCaptionSuffix"
            ),
          ])
        )
      : {};
  const illustratedWorkNotes: Readonly<Record<string, string>> = {
    ...magnumDisplayNotes,
  };
  const contextualRelations = allRelations.filter(
    (relation) => !illustratedIds.has(relation.id)
  );
  let documentReading: ReactNode = null;
  if (entry.document !== undefined) {
    documentReading = (
      <MuseumResearchReading
        {...(entry.selectedMarkdown === undefined
          ? {}
          : { selectedMarkdown: entry.selectedMarkdown })}
        completeMarkdown={entry.document.markdown}
        sourceCommit={context.sourceCommit}
        sourcePath={entry.document.sourcePath}
        workHrefs={workHrefs}
        selectedTitle={t(
          DEFAULT_LOCALE,
          "museum.network.research.selectedReading"
        )}
        selectedDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.selectedReadingDescription"
        )}
        completeLabel={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeStudy"
        )}
        completeDescription={t(
          DEFAULT_LOCALE,
          "museum.network.research.completeStudyDescription"
        )}
      />
    );
  }

  return (
    <article className="tw-min-w-0">
      <MuseumBreadcrumbs
        ariaLabel={t(
          DEFAULT_LOCALE,
          "museum.network.accessibility.breadcrumbs"
        )}
        items={context.breadcrumbs}
      />
      <header className="tw-mt-6 tw-max-w-5xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {entry.kindLabel}
        </p>
        <h1 className="tw-m-0 tw-mt-3 tw-text-[2rem] tw-font-semibold tw-leading-[1.08] tw-text-iron-50 sm:tw-text-[2.75rem]">
          {entry.title}
        </h1>
        {entry.statusLabel === undefined ? null : (
          <p className="tw-m-0 tw-mt-5 tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200">
            {entry.statusLabel}
          </p>
        )}
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {entry.description}
        </p>
      </header>

      {entry.media === undefined ? null : (
        <div
          className={`tw-mt-10 tw-max-w-4xl ${entry.mobileMedia === undefined ? "" : "tw-hidden sm:tw-block"}`}
        >
          <MuseumPublicMediaFigure
            src={entry.media.url}
            width={entry.media.width}
            height={entry.media.height}
            alt={entry.media.altText ?? entry.title}
            title={entry.title}
            eager
            qualifier={[entry.mediaQualifier, entry.media.credit.creditLine]
              .filter(
                (value, index, values): value is string =>
                  value !== undefined && values.indexOf(value) === index
              )
              .join(" · ")}
            sizes="(min-width: 1024px) 60vw, 100vw"
            {...mediaSrcSetProps}
            {...mediaAspectRatioProps}
          />
        </div>
      )}

      {entry.mobileMedia === undefined ? null : (
        <div className="tw-mt-10 tw-max-w-4xl sm:tw-hidden">
          <MuseumPublicMediaFigure
            src={entry.mobileMedia.url}
            width={entry.mobileMedia.width}
            height={entry.mobileMedia.height}
            alt={entry.mobileMedia.altText ?? entry.title}
            title={entry.title}
            eager
            qualifier={[
              entry.mediaQualifier,
              entry.mobileMedia.credit.creditLine,
            ]
              .filter(
                (value, index, values): value is string =>
                  value !== undefined && values.indexOf(value) === index
              )
              .join(" · ")}
            sizes="100vw"
            {...mobileMediaAspectRatioProps}
          />
        </div>
      )}

      {entry.institutionalDisplay === undefined ? null : (
        <section
          aria-labelledby="museum-research-display-basis-title"
          className="tw-mt-6 tw-max-w-3xl"
        >
          <h2
            id="museum-research-display-basis-title"
            className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500"
          >
            {t(DEFAULT_LOCALE, "museum.network.research.displayBasisTitle")}
          </h2>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            {entry.institutionalDisplay.statement}{" "}
            <a
              href={entry.institutionalDisplay.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {entry.institutionalDisplay.linkLabel}
            </a>
          </p>
        </section>
      )}

      {illustratedWorks.length === 0 ? null : (
        <MuseumRelatedEntities
          entities={illustratedWorks}
          headingId="museum-research-works-title"
          title={t(DEFAULT_LOCALE, "museum.network.research.worksDiscussed")}
          entityNotes={illustratedWorkNotes}
        />
      )}

      {documentReading}
      {entry.document === undefined && entry.publicationUri ? (
        <p className="tw-mt-10 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.research.typedRecordDescription")}
        </p>
      ) : null}

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

      {contextualRelations.length === 0 ? null : (
        <details className="tw-group tw-mt-12 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-1">
          <summary className="hover:tw-text-primary-200 tw-flex tw-min-h-16 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-py-4 tw-text-base tw-font-semibold tw-text-primary-300 marker:tw-hidden focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden">
            <span>{t(DEFAULT_LOCALE, "museum.network.research.context")}</span>
            <span
              aria-hidden="true"
              className="tw-text-xl tw-text-iron-400 group-open:tw-rotate-45"
            >
              +
            </span>
          </summary>
          <MuseumRelatedEntities
            entities={contextualRelations}
            headingId="museum-research-related-title"
            title={t(DEFAULT_LOCALE, "museum.network.research.context")}
          />
        </details>
      )}

      <Link
        href="/museum/network/research"
        className="hover:tw-text-primary-200 tw-mt-8 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {t(DEFAULT_LOCALE, "museum.network.research.back")}
      </Link>
    </article>
  );
}
