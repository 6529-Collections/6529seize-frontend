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
  readonly title: string;
  readonly document?: MuseumPublicDocument;
  readonly media?: MuseumMedia;
  readonly kindLabel?: string;
  readonly subjectLabels?: readonly string[];
  readonly description?: string;
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
  const href = museumResearchHref(entry.slug);
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
  const subject = entry.subjectLabels?.join(" / ");
  const byline = [label, subject].filter(Boolean).join(" / ");
  const mediaStatus: { status?: string } = {};
  if (entry.description !== undefined) {
    mediaStatus.status = entry.description;
  }
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

  return (
    <article className="tw-min-w-0">
      {entry.media === undefined ? null : (
        <MuseumPublicMediaFigure
          src={entry.media.url}
          width={entry.media.width}
          height={entry.media.height}
          alt={entry.media.altText ?? entry.title}
          href={href}
          title={entry.title}
          byline={byline}
          {...mediaStatus}
          {...mediaAspectRatioProps}
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
        />
      )}
      {entry.media === undefined ? (
        <div>
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
        </div>
      ) : null}
    </article>
  );
}
