import Link from "next/link";
import { MuseumMarkdown } from "@/components/museum/MuseumMarkdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumPublicDocument } from "@/lib/museum/publication";
import {
  buildImmutableMuseumBlobUrl,
  buildMuseumMainBlobUrl,
  MUSEUM_CONTRIBUTOR_GUIDE_PATH,
  MUSEUM_RIGHTS_GUIDE_PATH,
  MUSEUM_TECHNICAL_DESIGN_PATHS,
} from "@/lib/museum/publication";

const EXTERNAL_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

interface MuseumOpenMuseumStatementProps {
  readonly commit: string;
  readonly openMuseum: MuseumPublicDocument;
  readonly transition: MuseumPublicDocument;
}

type ExactStatementLabelKey =
  | "museum.network.openMuseum.about.exactStatement"
  | "museum.network.openMuseum.transition.exactStatement";

const TECHNICAL_DESIGN_LINKS = [
  {
    path: MUSEUM_TECHNICAL_DESIGN_PATHS[0],
    labelKey: "museum.network.openMuseum.designSources.link1",
  },
  {
    path: MUSEUM_TECHNICAL_DESIGN_PATHS[1],
    labelKey: "museum.network.openMuseum.designSources.link2",
  },
  {
    path: MUSEUM_TECHNICAL_DESIGN_PATHS[2],
    labelKey: "museum.network.openMuseum.designSources.link3",
  },
] as const;

function ExactDocumentLink({
  commit,
  document,
  labelKey,
}: {
  readonly commit: string;
  readonly document: MuseumPublicDocument;
  readonly labelKey: ExactStatementLabelKey;
}) {
  const href = buildImmutableMuseumBlobUrl(commit, document.sourcePath);
  return href === null ? null : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={EXTERNAL_LINK_CLASS}
    >
      {t(DEFAULT_LOCALE, labelKey)}
    </a>
  );
}

export function MuseumOpenMuseumStatement({
  commit,
  openMuseum,
  transition,
}: MuseumOpenMuseumStatementProps) {
  const contributionUrl = buildMuseumMainBlobUrl(MUSEUM_CONTRIBUTOR_GUIDE_PATH);
  const exactRightsUrl = buildImmutableMuseumBlobUrl(
    commit,
    MUSEUM_RIGHTS_GUIDE_PATH
  );

  return (
    <section
      className="tw-mt-12 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      aria-labelledby="open-museum-statement-title"
    >
      <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-14">
        <header className="tw-max-w-md">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.eyebrow")}
          </p>
          <h2
            id="open-museum-statement-title"
            className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.about.title")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.about.description")}
          </p>
          <p className="tw-m-0 tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.about.status")}
          </p>
          <ExactDocumentLink
            commit={commit}
            document={openMuseum}
            labelKey="museum.network.openMuseum.about.exactStatement"
          />
        </header>
        <MuseumMarkdown
          embeddedDocument
          sourceCommit={commit}
          sourcePath={openMuseum.sourcePath}
        >
          {openMuseum.markdown}
        </MuseumMarkdown>
      </div>

      <div className="tw-mt-14 tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-14">
        <header className="tw-max-w-md">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.transition.eyebrow")}
          </p>
          <h2 className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.transition.title")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-200">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.transition.goal")}
          </p>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(
              DEFAULT_LOCALE,
              "museum.network.openMuseum.transition.notDeployed"
            )}
          </p>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(
              DEFAULT_LOCALE,
              "museum.network.openMuseum.transition.authority"
            )}
          </p>
          <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(
              DEFAULT_LOCALE,
              "museum.network.openMuseum.transition.verification"
            )}
          </p>
          <p className="tw-m-0 tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-500">
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.transition.status")}
          </p>
          <ExactDocumentLink
            commit={commit}
            document={transition}
            labelKey="museum.network.openMuseum.transition.exactStatement"
          />
        </header>
        <MuseumMarkdown
          embeddedDocument
          sourceCommit={commit}
          sourcePath={transition.sourcePath}
        >
          {transition.markdown}
        </MuseumMarkdown>
      </div>

      <nav
        className="tw-mt-14 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.openMuseum.designSources.title"
        )}
      >
        <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(DEFAULT_LOCALE, "museum.network.openMuseum.designSources.title")}
        </h3>
        <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(
            DEFAULT_LOCALE,
            "museum.network.openMuseum.designSources.description"
          )}
        </p>
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1">
          {TECHNICAL_DESIGN_LINKS.map(({ path, labelKey }) => {
            const href = buildImmutableMuseumBlobUrl(commit, path);
            return href === null ? null : (
              <a
                key={path}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL_LINK_CLASS}
              >
                {t(DEFAULT_LOCALE, labelKey)}
              </a>
            );
          })}
          {contributionUrl !== null ? (
            <a
              href={contributionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.contribute")}
            </a>
          ) : null}
          {exactRightsUrl !== null ? (
            <a
              href={exactRightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.openMuseum.designSources.rights"
              )}
            </a>
          ) : null}
        </div>
      </nav>
    </section>
  );
}

export function MuseumOpenSourceResearchContext({
  commit,
}: {
  readonly commit: string;
}) {
  const contributionUrl = buildMuseumMainBlobUrl(MUSEUM_CONTRIBUTOR_GUIDE_PATH);

  return (
    <section
      className="tw-mt-12 tw-grid tw-gap-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end sm:tw-gap-10"
      aria-labelledby="museum-public-source-context-title"
    >
      <div className="tw-max-w-3xl">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.openMuseum.eyebrow")}
        </p>
        <h2
          id="museum-public-source-context-title"
          className="tw-m-0 tw-mt-2 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.openMuseum.research.title")}
        </h2>
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.openMuseum.research.description", {
            commit: commit.slice(0, 12),
          })}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-500">
          {t(
            DEFAULT_LOCALE,
            "museum.network.openMuseum.transition.notDeployed"
          )}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-500">
          {t(
            DEFAULT_LOCALE,
            "museum.network.openMuseum.transition.verification"
          )}
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 sm:tw-justify-end">
        <Link
          href="/museum/network/about#open-museum-statement-title"
          className={EXTERNAL_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.openMuseum.research.about")}
        </Link>
        {contributionUrl !== null ? (
          <a
            href={contributionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={EXTERNAL_LINK_CLASS}
          >
            {t(DEFAULT_LOCALE, "museum.network.openMuseum.strip.contribute")}
          </a>
        ) : null}
      </div>
    </section>
  );
}
