import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { CASEY_ARTIST_NAME } from "@/lib/museum/casey";
import {
  MUSEUM_REPOSITORY_URL,
  MUSEUM_SAFE_ETHERSCAN_URL,
} from "@/lib/museum/types";

const TEXT_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const INSTITUTIONAL_FACTS = [
  "museum.network.home.fact.held",
  "museum.network.home.fact.governed",
  "museum.network.home.fact.ethereum",
  "museum.network.home.fact.open",
] as const;

const COLLECTION_PATHS = [
  {
    titleKey: "museum.network.home.collection.allWorks",
    descriptionKey: "museum.network.home.collection.allWorksDescription",
    href: "/museum/network/collection",
  },
  {
    titleKey: "museum.network.home.collection.artists",
    descriptionKey: "museum.network.home.collection.artistsDescription",
    href: "/museum/network/artists",
  },
  {
    titleKey: "museum.network.home.collection.projects",
    descriptionKey: "museum.network.home.collection.projectsDescription",
    href: "/museum/network/projects",
  },
] as const;

export function MuseumNetworkHomeSecondarySections() {
  return (
    <>
      <MuseumInstitutionalFacts />
      <MuseumCollectionPaths />
      <MuseumEditorialPaths />
      <MuseumInstitution />
      <MuseumPublicRecord />
    </>
  );
}

function MuseumInstitutionalFacts() {
  return (
    <section
      aria-label={t(DEFAULT_LOCALE, "museum.network.home.institutionalFacts")}
      className="tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-6"
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-3 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        {INSTITUTIONAL_FACTS.map((key) => (
          <li
            key={key}
            className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100"
          >
            {t(DEFAULT_LOCALE, key)}
          </li>
        ))}
      </ul>
      <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-6">
        <p className="tw-m-0 tw-max-w-4xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.home.institutionalSummary")}
        </p>
        <Link
          href="/museum/network/about"
          className={`${TEXT_LINK_CLASS} tw-shrink-0`}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.readHowItWorks")}
        </Link>
      </div>
    </section>
  );
}

function MuseumCollectionPaths() {
  return (
    <section
      aria-labelledby="museum-collection-title"
      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:tw-gap-16">
        <div className="tw-max-w-xl">
          <h2
            id="museum-collection-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.home.collection.title")}
          </h2>
          <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(DEFAULT_LOCALE, "museum.network.home.collection.description")}
          </p>
        </div>
        <nav
          aria-label={t(
            DEFAULT_LOCALE,
            "museum.network.home.collection.navigation"
          )}
          className="tw-grid tw-gap-5 sm:tw-grid-cols-3"
        >
          {COLLECTION_PATHS.map((path) => (
            <Link
              key={path.href}
              href={path.href}
              className="hover:tw-text-primary-200 tw-block tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-5 tw-text-iron-100 tw-no-underline hover:tw-border-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              <span className="tw-block tw-text-base tw-font-semibold">
                {t(DEFAULT_LOCALE, path.titleKey)}
              </span>
              <span className="tw-mt-2 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(DEFAULT_LOCALE, path.descriptionKey)}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

function MuseumEditorialPaths() {
  return (
    <div className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-3 lg:tw-gap-10">
      <EditorialPath
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.artists")}
        title={CASEY_ARTIST_NAME}
        description={t(DEFAULT_LOCALE, "museum.network.home.artistSummary")}
        action={t(DEFAULT_LOCALE, "museum.network.home.readArtist")}
        href="/museum/network/artists/casey-reas"
        headingId="museum-home-artist-title"
      />
      <EditorialPath
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.acquisitions")}
        title={t(DEFAULT_LOCALE, "museum.network.programs.keysAndGates")}
        description={t(DEFAULT_LOCALE, "museum.network.home.keysSummary")}
        action={t(DEFAULT_LOCALE, "museum.network.home.readProgram")}
        href="/museum/network/acquisitions/keys-and-gates"
        headingId="museum-home-program-title"
      />
      <EditorialPath
        eyebrow={t(DEFAULT_LOCALE, "museum.network.nav.research")}
        title={t(DEFAULT_LOCALE, "museum.network.home.researchTitle")}
        description={t(DEFAULT_LOCALE, "museum.network.home.researchSummary")}
        action={t(DEFAULT_LOCALE, "museum.network.home.readResearch")}
        href="/museum/network/research"
        headingId="museum-home-research-title"
      />
    </div>
  );
}

function EditorialPath({
  eyebrow,
  title,
  description,
  action,
  href,
  headingId,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly action: string;
  readonly href: string;
  readonly headingId: string;
}) {
  return (
    <section aria-labelledby={headingId}>
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
      >
        {title}
      </h2>
      <p className="tw-m-0 tw-mt-3 tw-max-w-xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {description}
      </p>
      <Link href={href} className={`${TEXT_LINK_CLASS} tw-mt-4`}>
        {action}
      </Link>
    </section>
  );
}

function MuseumInstitution() {
  return (
    <section
      aria-labelledby="museum-institution-title"
      className="tw-grid tw-gap-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-10 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-16"
    >
      <div>
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.home.institution.eyebrow")}
        </p>
        <h2
          id="museum-institution-title"
          className="tw-m-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.home.institution.title")}
        </h2>
      </div>
      <div className="tw-max-w-3xl">
        <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.home.institution.description")}
        </p>
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.home.institution.objective")}
        </p>
        <Link
          href="/museum/network/about"
          className={`${TEXT_LINK_CLASS} tw-mt-5`}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.institution.action")}
        </Link>
      </div>
    </section>
  );
}

function MuseumPublicRecord() {
  return (
    <section aria-labelledby="museum-public-record-title">
      <h2
        id="museum-public-record-title"
        className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500"
      >
        {t(DEFAULT_LOCALE, "museum.network.home.publicRecord")}
      </h2>
      <nav
        aria-labelledby="museum-public-record-title"
        className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-1"
      >
        <a
          href={MUSEUM_SAFE_ETHERSCAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TEXT_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.museumSafe")}
        </a>
        <Link
          href="/museum/network/about/governance"
          className={TEXT_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.decisions")}
        </Link>
        <a
          href={MUSEUM_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={TEXT_LINK_CLASS}
        >
          {t(DEFAULT_LOCALE, "museum.network.home.publicRepository")}
        </a>
      </nav>
    </section>
  );
}
