import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  MuseumMedia,
  MuseumPublicDocument,
} from "@/lib/museum/publication/types";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { museumResearchHref } from "@/lib/museum/publication/routes";
import { MuseumPublicMediaFigure } from "../MuseumPublicMediaFigure";

export interface MuseumResearchDocumentCardEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly document?: MuseumPublicDocument;
  readonly media?: MuseumMedia;
}

function excerpt(markdown: string | undefined): string | undefined {
  if (markdown === undefined) return undefined;
  const value = markdown
    .replace(/^#{1,6}\s+/gmu, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/[*_>`]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  if (value.length === 0) return undefined;
  return value.length > 190 ? `${value.slice(0, 187).trimEnd()}…` : value;
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
    (entry.document === undefined
      ? t(DEFAULT_LOCALE, "museum.network.research.documentKind.sourceRecord")
      : t(
          DEFAULT_LOCALE,
          museumDocumentKindLabelKey(entry.document.kind) as MessageKey
        ));
  const summary = excerpt(entry.document?.markdown);
  const Heading = headingLevel === 4 ? "h4" : "h3";

  return (
    <article className="tw-flex tw-h-full tw-min-w-0 tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-p-5">
      {entry.media === undefined ? null : (
        <MuseumPublicMediaFigure
          src={entry.media.url}
          width={entry.media.width}
          height={entry.media.height}
          alt={entry.media.altText ?? entry.title}
          href={href}
          title={entry.title}
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
        />
      )}
      <div
        className={
          entry.media === undefined
            ? "tw-flex tw-flex-1 tw-flex-col"
            : "tw-mt-5"
        }
      >
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
        {summary === undefined ? null : (
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {summary}
          </p>
        )}
      </div>
    </article>
  );
}
