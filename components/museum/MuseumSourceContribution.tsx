import type { MuseumPublicationIdentity } from "@/lib/museum/publication";
import {
  buildImmutableMuseumBlobUrl,
  buildImmutableMuseumCommitUrl,
  buildMuseumMainBlobUrl,
  MUSEUM_CONTRIBUTOR_GUIDE_PATH,
} from "@/lib/museum/publication";
import type { MuseumSourceState } from "@/lib/museum/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

interface MuseumSourceContributionProps {
  readonly identity: MuseumPublicationIdentity | null;
  readonly sourceState: MuseumSourceState;
}

function sourceCopyKey(
  identity: MuseumPublicationIdentity | null,
  sourceState: MuseumSourceState
):
  | "museum.network.openMuseum.strip.current"
  | "museum.network.openMuseum.strip.stale"
  | "museum.network.openMuseum.strip.unavailable" {
  if (identity === null || sourceState === "unavailable") {
    return "museum.network.openMuseum.strip.unavailable";
  }
  return sourceState === "stale"
    ? "museum.network.openMuseum.strip.stale"
    : "museum.network.openMuseum.strip.current";
}

const LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export function MuseumSourceContribution({
  identity,
  sourceState,
}: MuseumSourceContributionProps) {
  const commit = identity?.commit ?? null;
  const exactSourceUrl = buildImmutableMuseumCommitUrl(commit);
  const exactGuideUrl = buildImmutableMuseumBlobUrl(
    commit,
    MUSEUM_CONTRIBUTOR_GUIDE_PATH
  );
  const contributionUrl = buildMuseumMainBlobUrl(MUSEUM_CONTRIBUTOR_GUIDE_PATH);
  const copyValues = commit === null ? {} : { commit: commit.slice(0, 12) };

  return (
    <aside
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
      aria-labelledby="museum-open-source-title"
    >
      <div className="tw-mx-auto tw-grid tw-w-full tw-max-w-[1324px] tw-gap-6 tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-items-end lg:tw-gap-10 lg:tw-px-8">
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
              sourceCopyKey(identity, sourceState),
              copyValues
            )}
          </p>
        </div>
        <nav
          className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 lg:tw-justify-end"
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.openMuseum.strip.actions"
          )}
        >
          {exactSourceUrl !== null ? (
            <a
              href={exactSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.exactSource")}
            </a>
          ) : null}
          {exactGuideUrl !== null ? (
            <a
              href={exactGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.exactGuide")}
            </a>
          ) : null}
          {contributionUrl !== null ? (
            <a
              href={contributionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.contribute")}
            </a>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
