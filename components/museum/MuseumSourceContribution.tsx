"use client";

import { usePathname } from "next/navigation";
import type {
  MuseumPageSourceCatalog,
  MuseumPublicationIdentity,
  MuseumRelatedPageSourceLabel,
} from "@/lib/museum/publication";
import {
  buildImmutableMuseumBlobUrl,
  buildMuseumMainBlobUrl,
  buildMuseumMainEditUrl,
  MUSEUM_CONTRIBUTOR_GUIDE_PATH,
  resolveMuseumPageSource,
} from "@/lib/museum/publication";
import type { MuseumSourceState } from "@/lib/museum/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface MuseumSourceContributionProps {
  readonly identity: MuseumPublicationIdentity | null;
  readonly pageSources: MuseumPageSourceCatalog;
  readonly sourceState: MuseumSourceState;
}

function sourceCopyKey(
  identity: MuseumPublicationIdentity | null,
  sourceState: MuseumSourceState,
  hasPageSource: boolean
):
  | "museum.network.openMuseum.strip.current"
  | "museum.network.openMuseum.strip.currentUnmapped"
  | "museum.network.openMuseum.strip.stale"
  | "museum.network.openMuseum.strip.staleUnmapped"
  | "museum.network.openMuseum.strip.unavailable" {
  if (identity === null || sourceState === "unavailable") {
    return "museum.network.openMuseum.strip.unavailable";
  }
  if (sourceState === "stale") {
    return hasPageSource
      ? "museum.network.openMuseum.strip.stale"
      : "museum.network.openMuseum.strip.staleUnmapped";
  }
  return hasPageSource
    ? "museum.network.openMuseum.strip.current"
    : "museum.network.openMuseum.strip.currentUnmapped";
}

const LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-min-w-0 tw-max-w-full tw-items-center tw-break-words tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

function relatedSourceLabel(label: MuseumRelatedPageSourceLabel): string {
  switch (label) {
    case "accessionRecord":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.accessionRecord"
      );
    case "accessionRegister":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.accessionRegister"
      );
    case "collectionEssay":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.collectionEssay"
      );
    case "foundingPrinciples":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.foundingPrinciples"
      );
    case "giftNarrative":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.giftNarrative"
      );
    case "keysAndGates":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.keysAndGates"
      );
    case "machineRecord":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.machineRecord"
      );
    case "onchainTransition":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.onchainTransition"
      );
    case "programRecord":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.programRecord"
      );
    case "selectedWorks":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.selectedWorks"
      );
    case "supportingRecord":
      return t(
        DEFAULT_LOCALE,
        "museum.network.openMuseum.strip.relatedLabels.supportingRecord"
      );
  }
}

export function MuseumSourceContribution({
  identity,
  pageSources,
  sourceState,
}: MuseumSourceContributionProps) {
  const pathname = usePathname();
  const pageSource = resolveMuseumPageSource(pathname, pageSources);
  const commit = identity?.commit ?? null;
  const exactSourceUrl =
    pageSource === null
      ? null
      : buildImmutableMuseumBlobUrl(commit, pageSource.primaryPath);
  const improvementUrl =
    pageSource === null ? null : buildMuseumMainEditUrl(pageSource.primaryPath);
  const contributionUrl = buildMuseumMainBlobUrl(MUSEUM_CONTRIBUTOR_GUIDE_PATH);
  const relatedSources =
    commit === null || pageSource === null
      ? []
      : pageSource.relatedSources.flatMap(({ path, label }) => {
          const href = buildImmutableMuseumBlobUrl(commit, path);
          return href === null ? [] : [{ href, label, path }];
        });
  const copyValues = commit === null ? {} : { commit: commit.slice(0, 12) };

  return (
    <aside
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
      aria-labelledby="museum-open-source-title"
    >
      <div className="tw-mx-auto tw-grid tw-w-full tw-max-w-[1324px] tw-gap-6 tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:tw-items-end lg:tw-gap-10 lg:tw-px-8">
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.eyebrow")}
          </p>
          <h2
            id="museum-open-source-title"
            className="tw-m-0 tw-mt-2 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.title")}
          </h2>
          <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(
              DEFAULT_LOCALE,
              sourceCopyKey(identity, sourceState, pageSource !== null),
              copyValues
            )}
          </p>
        </div>
        <nav
          className="tw-grid tw-min-w-0 tw-gap-3"
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.openMuseum.strip.actions"
          )}
        >
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-x-5 tw-gap-y-1 lg:tw-justify-end">
            {exactSourceUrl !== null ? (
              <a
                href={exactSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.openMuseum.strip.exactSource"
                )}
              </a>
            ) : null}
            {improvementUrl !== null ? (
              <a
                href={improvementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.improve")}
              </a>
            ) : null}
            {contributionUrl !== null ? (
              <a
                href={contributionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.guide")}
              </a>
            ) : null}
          </div>
          {relatedSources.length > 0 ? (
            <div className="tw-grid tw-min-w-0 tw-gap-1 lg:tw-justify-items-end">
              <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.openMuseum.strip.relatedTitle"
                )}
              </p>
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-x-5 tw-gap-y-1 lg:tw-justify-end">
                {relatedSources.map(({ href, label, path }) => {
                  const visibleLabel = relatedSourceLabel(label);
                  return (
                    <a
                      key={path}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={path}
                      aria-label={t(
                        DEFAULT_LOCALE,
                        "museum.network.openMuseum.strip.relatedAccessible",
                        { label: visibleLabel, path }
                      )}
                      className={LINK_CLASS}
                    >
                      {visibleLabel}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
