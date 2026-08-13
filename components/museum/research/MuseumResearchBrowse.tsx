import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumPublicDocument } from "@/lib/museum/publication/types";
import { museumDocumentKindLabelKey } from "@/lib/museum/publication/documentLabels";
import { museumResearchHref } from "@/lib/museum/publication/routes";

export interface MuseumResearchBrowseEntry {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly document?: MuseumPublicDocument;
}

export interface MuseumResearchBrowseGroup {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly entries: readonly MuseumResearchBrowseEntry[];
}

export function MuseumResearchBrowse({
  groups,
  title,
  description,
}: {
  readonly groups: readonly MuseumResearchBrowseGroup[];
  readonly title: string;
  readonly description: string;
}) {
  return (
    <section
      className="tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-pt-8"
      aria-labelledby="museum-research-complete-browse"
    >
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div className="tw-min-w-0">
          <h2
            id="museum-research-complete-browse"
            className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-200 sm:tw-text-2xl"
          >
            {title}
          </h2>
          <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-xs tw-leading-6 tw-text-iron-500 sm:tw-text-sm">
            {description}
          </p>
        </div>
      </div>
      <div className="tw-mt-6 tw-grid tw-min-w-0 tw-gap-4 lg:tw-grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`museum-research-library-${group.id}`}
            className="tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/30 tw-p-4 sm:tw-p-5"
          >
            <h3
              id={`museum-research-library-${group.id}`}
              className="tw-m-0 tw-min-w-0 tw-break-words tw-text-base tw-font-semibold tw-text-iron-200"
            >
              {group.title}
            </h3>
            <p className="tw-m-0 tw-mt-2 tw-min-w-0 tw-break-words tw-text-xs tw-leading-6 tw-text-iron-500 sm:tw-text-sm">
              {group.description}
            </p>
            <ul className="tw-m-0 tw-mt-4 tw-min-w-0 tw-list-none tw-divide-y tw-divide-iron-800 tw-p-0">
              {group.entries.map((entry) => (
                <li key={entry.id} className="tw-min-w-0">
                  <Link
                    href={museumResearchHref(entry.slug)}
                    className="tw-group tw-flex tw-min-h-20 tw-min-w-0 tw-flex-col tw-justify-center tw-gap-1 tw-py-4 tw-no-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    <span className="group-hover:tw-text-primary-200 tw-min-w-0 tw-break-words tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-200">
                      {entry.title}
                    </span>
                    <span className="tw-min-w-0 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-500 sm:tw-text-sm">
                      {entry.document === undefined
                        ? t(
                            DEFAULT_LOCALE,
                            "museum.network.research.documentKind.sourceRecord"
                          )
                        : t(
                            DEFAULT_LOCALE,
                            museumDocumentKindLabelKey(entry.document.kind)
                          )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
