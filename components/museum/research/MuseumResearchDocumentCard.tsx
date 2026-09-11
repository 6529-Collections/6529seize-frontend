import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { museumResearchHref } from "@/lib/museum/publication/routes";
import type {
  MuseumMedia,
  MuseumPublicDocument,
} from "@/lib/museum/publication/types";
import { MuseumPublicMediaFigure } from "../MuseumPublicMediaFigure";
import { museumResearchMediaAspectRatio } from "./museumResearchMediaAspectRatio";

export interface MuseumResearchDocumentCardEntry {
  readonly id: string;
  readonly slug: string;
  readonly href?: string;
  readonly title: string;
  readonly document?: MuseumPublicDocument;
  readonly media?: MuseumMedia;
  readonly kindLabel?: string;
  readonly subjectLabels?: readonly string[];
  readonly description?: string;
  readonly statusLabel?: string;
  readonly actionLabel?: string;
  readonly mediaQualifier?: string;
  readonly mediaSrcSet?: string;
  readonly mediaSourceHref?: string;
  readonly mediaSourceLabel?: string;
}

export function MuseumResearchDocumentCard({
  entry,
  kindLabel,
  headingLevel = 3,
}: {
  readonly entry: MuseumResearchDocumentCardEntry;
  readonly kindLabel?: string;
  readonly headingLevel?: 3 | 4;
}) {
  const href = entry.href ?? museumResearchHref(entry.slug);
  const label =
    kindLabel ??
    entry.kindLabel ??
    (entry.document === undefined
      ? t(DEFAULT_LOCALE, "museum.network.research.documentKind.sourceRecord")
      : t(
          DEFAULT_LOCALE,
          museumDocumentKindLabelKey(entry.document.kind) as MessageKey
        ));
  const Heading = headingLevel === 4 ? "h4" : "h3";
  const joinedSubject = entry.subjectLabels?.join(" / ");
  const subject = joinedSubject === "" ? undefined : joinedSubject;
  const byline = [label, subject].filter(Boolean).join(" / ");
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

  const altText = entry.media?.altText?.trim();
  const qualifier = [entry.mediaQualifier, entry.media?.credit.creditLine]
    .filter((value): value is string => value !== undefined && value.length > 0)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ");
  const qualifierProps = qualifier.length === 0 ? {} : { qualifier };
  const srcSetProps =
    entry.mediaSrcSet === undefined ? {} : { srcSet: entry.mediaSrcSet };
  const hasMediaSource =
    entry.mediaSourceHref !== undefined && entry.mediaSourceLabel !== undefined;

  return (
    <article className="tw-min-w-0">
      {entry.media === undefined ? null : (
        <MuseumPublicMediaFigure
          src={entry.media.url}
          width={entry.media.width}
          height={entry.media.height}
          alt={
            altText === undefined || altText.length === 0
              ? entry.title
              : altText
          }
          href={href}
          title={entry.title}
          byline={byline}
          {...qualifierProps}
          {...srcSetProps}
          {...mediaAspectRatioProps}
        />
      )}
      <div className={entry.media === undefined ? undefined : "tw-mt-4"}>
        {hasMediaSource ? (
          <a
            href={entry.mediaSourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:tw-text-primary-200 tw-mb-3 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {entry.mediaSourceLabel}
          </a>
        ) : null}
        {entry.media === undefined ? (
          <>
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
              {label}
            </p>
            <Heading className="tw-m-0 tw-mt-2 tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-50">
              <Link
                href={href}
                className="hover:tw-text-primary-200 tw-text-inherit tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                {entry.title}
              </Link>
            </Heading>
          </>
        ) : null}
        {entry.statusLabel === undefined ? null : (
          <p className="tw-m-0 tw-mb-3 tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200">
            {entry.statusLabel}
          </p>
        )}
        {subject === undefined ? null : (
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-300">
            {subject}
          </p>
        )}
        {entry.description === undefined ? null : (
          <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
            {entry.description}
          </p>
        )}
        {entry.actionLabel === undefined ? null : (
          <Link
            href={href}
            className="hover:tw-text-primary-200 tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {entry.actionLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
