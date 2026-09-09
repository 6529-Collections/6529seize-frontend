"use client";

import { usePathname } from "next/navigation";
import type {
  MuseumPageSourceCatalog,
  MuseumRelatedPageSourceLabel,
} from "@/lib/museum/publication/pageSources";
import { resolveMuseumPageSource } from "@/lib/museum/publication/pageSources";
import { MUSEUM_CONTRIBUTOR_GUIDE_PATH } from "@/lib/museum/publication/openMuseum";
import {
  buildImmutableMuseumBlobUrl,
  buildMuseumMainEditUrl,
} from "@/lib/museum/publication/security";
import type { MuseumPublicationIdentity } from "@/lib/museum/publication/types";
import type { MuseumSourceState } from "@/lib/museum/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

interface MuseumSourceContributionProps {
  readonly identity: MuseumPublicationIdentity | null;
  readonly pageSources: MuseumPageSourceCatalog;
  readonly sourceState: MuseumSourceState;
}

function sourceMayBeInspected(sourceState: MuseumSourceState): boolean {
  return sourceState === "fresh" || sourceState === "stale";
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
  if (identity === null || !sourceMayBeInspected(sourceState)) {
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
  "tw-inline-flex tw-min-h-11 tw-min-w-0 tw-max-w-full tw-items-center tw-break-words tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const RELATED_SOURCE_LABEL_KEYS = {
  accessionRecord:
    "museum.network.openMuseum.strip.relatedLabels.accessionRecord",
  accessionRegister:
    "museum.network.openMuseum.strip.relatedLabels.accessionRegister",
  applicationProfile:
    "museum.network.openMuseum.strip.relatedLabels.applicationProfile",
  collectionEssay:
    "museum.network.openMuseum.strip.relatedLabels.collectionEssay",
  foundingPrinciples:
    "museum.network.openMuseum.strip.relatedLabels.foundingPrinciples",
  giftNarrative: "museum.network.openMuseum.strip.relatedLabels.giftNarrative",
  keysAndGates: "museum.network.openMuseum.strip.relatedLabels.keysAndGates",
  machineRecord: "museum.network.openMuseum.strip.relatedLabels.machineRecord",
  institutionalStudy:
    "museum.network.openMuseum.strip.relatedLabels.institutionalStudy",
  implementationAudit:
    "museum.network.openMuseum.strip.relatedLabels.implementationAudit",
  machineSchedule:
    "museum.network.openMuseum.strip.relatedLabels.machineSchedule",
  onchainTransition:
    "museum.network.openMuseum.strip.relatedLabels.onchainTransition",
  primarySourceRegister:
    "museum.network.openMuseum.strip.relatedLabels.primarySourceRegister",
  projectEssay: "museum.network.openMuseum.strip.relatedLabels.projectEssay",
  programRecord: "museum.network.openMuseum.strip.relatedLabels.programRecord",
  scholarshipStandard:
    "museum.network.openMuseum.strip.relatedLabels.scholarshipStandard",
  rightsRegistry:
    "museum.network.openMuseum.strip.relatedLabels.rightsRegistry",
  legalCode: "museum.network.openMuseum.strip.relatedLabels.legalCode",
  selectedWorks: "museum.network.openMuseum.strip.relatedLabels.selectedWorks",
  supportingRecord:
    "museum.network.openMuseum.strip.relatedLabels.supportingRecord",
} as const satisfies Record<MuseumRelatedPageSourceLabel, MessageKey>;

function relatedSourceLabel(label: MuseumRelatedPageSourceLabel): string {
  return t(DEFAULT_LOCALE, RELATED_SOURCE_LABEL_KEYS[label]);
}

export function MuseumSourceContribution({
  identity,
  pageSources,
  sourceState,
}: MuseumSourceContributionProps) {
  const pathname = usePathname();
  const hasInspectableSource =
    identity !== null && sourceMayBeInspected(sourceState);
  const pageSource = hasInspectableSource
    ? resolveMuseumPageSource(pathname, pageSources)
    : null;
  const commit = hasInspectableSource ? identity.commit : null;
  const exactSourceUrl =
    pageSource === null
      ? null
      : buildImmutableMuseumBlobUrl(commit, pageSource.primaryPath);
  const improvementUrl =
    pageSource === null ? null : buildMuseumMainEditUrl(pageSource.primaryPath);
  const contributionUrl = buildImmutableMuseumBlobUrl(
    commit,
    MUSEUM_CONTRIBUTOR_GUIDE_PATH
  );
  const relatedSources =
    commit === null || pageSource === null
      ? []
      : pageSource.relatedSources.flatMap(({ path, label }) => {
          const href = buildImmutableMuseumBlobUrl(commit, path);
          return href === null ? [] : [{ href, label, path }];
        });
  return (
    <aside
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
      aria-labelledby="museum-open-source-title"
    >
      <div className="tw-mx-auto tw-flex tw-w-full tw-min-w-0 tw-max-w-[1324px] tw-flex-col tw-gap-2 tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-gap-8 lg:tw-px-8">
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-baseline sm:tw-gap-3">
          <h2
            id="museum-open-source-title"
            className="tw-m-0 tw-shrink-0 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-200"
          >
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.title")}
          </h2>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-500">
            {t(
              DEFAULT_LOCALE,
              sourceCopyKey(identity, sourceState, pageSource !== null)
            )}
          </p>
        </div>
        <nav
          className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1 lg:tw-items-end"
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.openMuseum.strip.actions"
          )}
        >
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-x-4 tw-gap-y-0 lg:tw-justify-end">
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
            <details className="tw-min-w-0 tw-text-xs tw-text-iron-500 lg:tw-text-right">
              <summary className="tw-min-h-9 tw-cursor-pointer tw-font-medium tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
                {t(
                  DEFAULT_LOCALE,
                  "museum.network.openMuseum.strip.relatedTitle"
                )}
              </summary>
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-x-4 tw-gap-y-0 lg:tw-justify-end">
                {relatedSources.map(({ href, label, path }) => {
                  const visibleLabel = relatedSourceLabel(label);
                  return (
                    <a
                      key={path}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LINK_CLASS}
                    >
                      {visibleLabel}
                    </a>
                  );
                })}
              </div>
            </details>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
