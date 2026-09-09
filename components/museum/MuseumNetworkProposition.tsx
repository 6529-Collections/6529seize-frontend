import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumPublicDocument,
  MuseumPublicWork,
} from "@/lib/museum/publication";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication";
import { museumWorkHref } from "@/lib/museum/publication/routes";
import { selectMuseumStillMedia } from "@/lib/museum/publication/mediaSelection";
import {
  MUSEUM_REPOSITORY_URL,
  MUSEUM_SAFE_ETHERSCAN_URL,
} from "@/lib/museum/types";
import { MuseumPublicMediaFigure } from "./MuseumPublicMediaFigure";

const TEXT_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const PRIMARY_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";

const SECONDARY_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-border-iron-500 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";

const OPERATING_RECORDS = [
  {
    titleKey: "museum.network.proposition.today.governance.title",
    bodyKey: "museum.network.proposition.today.governance.body",
    actionKey: "museum.network.proposition.today.governance.action",
    href: "/museum/network/about/governance",
  },
  {
    titleKey: "museum.network.proposition.today.record.title",
    bodyKey: "museum.network.proposition.today.record.body",
    actionKey: "museum.network.proposition.today.record.action",
    href: MUSEUM_REPOSITORY_URL,
  },
  {
    titleKey: "museum.network.proposition.today.rights.title",
    bodyKey: "museum.network.proposition.today.rights.body",
    actionKey: "museum.network.proposition.today.rights.action",
    href: "/museum/network/research/rights",
  },
] as const;

const NEXT_STAGE = [
  {
    titleKey: "museum.network.proposition.next.decisions.title",
    bodyKey: "museum.network.proposition.next.decisions.body",
  },
  {
    titleKey: "museum.network.proposition.next.custody.title",
    bodyKey: "museum.network.proposition.next.custody.body",
  },
  {
    titleKey: "museum.network.proposition.next.execution.title",
    bodyKey: "museum.network.proposition.next.execution.body",
  },
] as const;

interface MuseumNetworkPropositionProps {
  readonly commit: string;
  readonly missionSourceUrl: string;
  readonly openMuseum: MuseumPublicDocument;
  readonly transition: MuseumPublicDocument;
  readonly featuredWorks?: readonly {
    readonly work: MuseumPublicWork;
    readonly artistName?: string;
  }[];
}

function ExactDocumentLink({
  commit,
  document,
  children,
}: {
  readonly commit: string;
  readonly document: MuseumPublicDocument;
  readonly children: string;
}) {
  const href = buildImmutableMuseumBlobUrl(commit, document.sourcePath);
  return href === null ? null : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={TEXT_LINK_CLASS}
    >
      {children}
    </a>
  );
}

function MuseumAboutArtworkFigure({
  work,
  artistName,
  eager,
}: {
  readonly work: MuseumPublicWork;
  readonly artistName?: string;
  readonly eager: boolean;
}) {
  const media = selectMuseumStillMedia(work.media);
  const presentation = work.presentationMedia?.[0];
  const delivery =
    presentation?.variants?.find((variant) => variant.width >= 1280) ??
    presentation?.variants?.at(-1);
  if (media === undefined && presentation === undefined) return null;
  const src = media?.url ?? delivery?.url ?? presentation?.mediaUrl;
  if (src === undefined) return null;
  const width = media?.width ?? delivery?.width ?? presentation?.width ?? null;
  const height =
    media?.height ?? delivery?.height ?? presentation?.height ?? null;
  const retainedAlt = media?.altText?.trim();
  const presentationAlt = presentation?.altText.trim();
  const displayTitle = /^6529NM[-.]/u.test(work.title.trim())
    ? t(DEFAULT_LOCALE, "museum.network.collection.untitledWork")
    : work.title;
  let alt = displayTitle;
  if (presentationAlt !== undefined && presentationAlt.length > 0) {
    alt = presentationAlt;
  }
  if (retainedAlt !== undefined && retainedAlt.length > 0) {
    alt = retainedAlt;
  }
  return (
    <MuseumPublicMediaFigure
      src={src}
      width={width}
      height={height}
      alt={alt}
      href={museumWorkHref(work.id)}
      title={displayTitle}
      {...(artistName === undefined ? {} : { byline: artistName })}
      eager={eager}
      sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
    />
  );
}

export function MuseumNetworkProposition({
  commit,
  missionSourceUrl,
  openMuseum,
  transition,
  featuredWorks = [],
}: MuseumNetworkPropositionProps) {
  return (
    <div className="tw-min-w-0 tw-space-y-20 sm:tw-space-y-28">
      <header className="tw-max-w-5xl">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.proposition.eyebrow")}
        </p>
        <h1 className="tw-m-0 tw-mt-4 tw-max-w-4xl tw-text-4xl tw-font-semibold tw-leading-[1.06] tw-tracking-tight tw-text-iron-50 sm:tw-text-5xl xl:tw-text-6xl">
          {t(DEFAULT_LOCALE, "museum.network.proposition.title")}
        </h1>
        <p className="tw-m-0 tw-mt-7 tw-max-w-4xl tw-text-lg tw-leading-8 tw-text-iron-200 sm:tw-text-xl sm:tw-leading-9">
          {t(DEFAULT_LOCALE, "museum.network.proposition.intro")}
        </p>
        <p className="tw-m-0 tw-mt-5 tw-max-w-4xl tw-text-lg tw-leading-8 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
          {t(DEFAULT_LOCALE, "museum.network.proposition.principle")}
        </p>
      </header>

      {featuredWorks.length === 0 ? null : (
        <section aria-labelledby="museum-about-art-title">
          <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-5">
            <div>
              <p className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
                {t(DEFAULT_LOCALE, "museum.network.proposition.art.eyebrow")}
              </p>
              <h2
                id="museum-about-art-title"
                className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
              >
                {t(DEFAULT_LOCALE, "museum.network.proposition.art.title")}
              </h2>
            </div>
            <Link href="/museum/network/collection" className={TEXT_LINK_CLASS}>
              {t(DEFAULT_LOCALE, "museum.network.proposition.art.action")}
            </Link>
          </div>
          <div className="tw-mt-8 tw-grid tw-gap-x-6 tw-gap-y-10 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
            {featuredWorks.map(({ work, artistName }, index) => (
              <MuseumAboutArtworkFigure
                key={work.id}
                work={work}
                {...(artistName === undefined ? {} : { artistName })}
                eager={index === 0}
              />
            ))}
          </div>
        </section>
      )}

      <section
        aria-labelledby="museum-collection-purpose-title"
        className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:tw-gap-16"
      >
        <h2
          id="museum-collection-purpose-title"
          className="tw-m-0 tw-max-w-md tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.collection.title")}
        </h2>
        <div className="tw-max-w-3xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-100">
            {t(DEFAULT_LOCALE, "museum.network.proposition.collection.body")}
          </p>
          <p className="tw-m-0">
            {t(
              DEFAULT_LOCALE,
              "museum.network.proposition.collection.acquisitions"
            )}
          </p>
          <div className="tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2">
            <Link href="/museum/network/collection" className={TEXT_LINK_CLASS}>
              {t(
                DEFAULT_LOCALE,
                "museum.network.proposition.collection.action"
              )}
            </Link>
            <Link
              href="/museum/network/acquisition-programs"
              className={TEXT_LINK_CLASS}
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.proposition.collection.programsAction"
              )}
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="museum-scholarship-title"
        className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:tw-gap-16"
      >
        <h2
          id="museum-scholarship-title"
          className="tw-m-0 tw-max-w-md tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.scholarship.title")}
        </h2>
        <div className="tw-max-w-3xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-100">
            {t(DEFAULT_LOCALE, "museum.network.proposition.scholarship.body")}
          </p>
          <Link href="/museum/network/research" className={TEXT_LINK_CLASS}>
            {t(DEFAULT_LOCALE, "museum.network.proposition.scholarship.action")}
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="museum-public-purpose-title"
        className="tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:tw-gap-16"
      >
        <h2
          id="museum-public-purpose-title"
          className="tw-m-0 tw-max-w-md tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.public.title")}
        </h2>
        <div className="tw-max-w-3xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-100">
            {t(DEFAULT_LOCALE, "museum.network.proposition.public.body1")}
          </p>
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.public.body2")}
          </p>
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            <Link
              href="/museum/network/collection"
              className={PRIMARY_LINK_CLASS}
            >
              {t(
                DEFAULT_LOCALE,
                "museum.network.proposition.actions.collection"
              )}
            </Link>
            <Link href="/network" className={SECONDARY_LINK_CLASS}>
              {t(DEFAULT_LOCALE, "museum.network.proposition.actions.network")}
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="museum-works-title"
        className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 sm:tw-pt-14"
      >
        <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:tw-gap-16">
          <div>
            <p className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
              {t(DEFAULT_LOCALE, "museum.network.proposition.working.eyebrow")}
            </p>
            <h2
              id="museum-works-title"
              className="tw-m-0 tw-mt-3 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
            >
              {t(DEFAULT_LOCALE, "museum.network.proposition.working.title")}
            </h2>
          </div>
          <div className="tw-max-w-3xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
            <p className="tw-m-0">
              {t(DEFAULT_LOCALE, "museum.network.proposition.working.intro")}
            </p>
            <div className="tw-grid tw-gap-x-8 tw-gap-y-8 md:tw-grid-cols-2">
              {OPERATING_RECORDS.map((item) => {
                const external = item.href.startsWith("http");
                return (
                  <article
                    key={item.titleKey}
                    className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5"
                  >
                    <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
                      {t(DEFAULT_LOCALE, item.titleKey)}
                    </h3>
                    <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
                      {t(DEFAULT_LOCALE, item.bodyKey)}
                    </p>
                    {external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${TEXT_LINK_CLASS} tw-mt-3`}
                      >
                        {t(DEFAULT_LOCALE, item.actionKey)}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`${TEXT_LINK_CLASS} tw-mt-3`}
                      >
                        {t(DEFAULT_LOCALE, item.actionKey)}
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="museum-next-title"
        className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      >
        <h2
          id="museum-next-title"
          className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-3xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.next.title")}
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.proposition.next.intro")}
        </p>
        <div className="tw-mt-8 tw-grid tw-gap-x-8 tw-gap-y-8 lg:tw-grid-cols-3">
          {NEXT_STAGE.map((item) => (
            <article
              key={item.titleKey}
              className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5"
            >
              <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, item.titleKey)}
              </h3>
              <p className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-400">
                {t(DEFAULT_LOCALE, item.bodyKey)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="museum-permanence-title"
        className="tw-grid tw-gap-8 tw-border-y tw-border-solid tw-border-iron-800 tw-py-10 lg:tw-grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:tw-gap-16"
      >
        <h2
          id="museum-permanence-title"
          className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.permanence.title")}
        </h2>
        <div className="tw-max-w-3xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.permanence.body1")}
          </p>
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.permanence.body2")}
          </p>
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.permanence.body3")}
          </p>
        </div>
      </section>

      <nav
        className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
        aria-labelledby="museum-proposition-sources-title"
      >
        <h2
          id="museum-proposition-sources-title"
          className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.sources.title")}
        </h2>
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-1">
          <a
            href={missionSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={TEXT_LINK_CLASS}
          >
            {t(DEFAULT_LOCALE, "museum.network.proposition.sources.founding")}
          </a>
          <ExactDocumentLink commit={commit} document={openMuseum}>
            {t(DEFAULT_LOCALE, "museum.network.proposition.sources.open")}
          </ExactDocumentLink>
          <ExactDocumentLink commit={commit} document={transition}>
            {t(DEFAULT_LOCALE, "museum.network.proposition.sources.transition")}
          </ExactDocumentLink>
          <a
            href={MUSEUM_SAFE_ETHERSCAN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={TEXT_LINK_CLASS}
          >
            {t(DEFAULT_LOCALE, "museum.network.proposition.sources.safe")}
          </a>
          <a
            href={MUSEUM_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={TEXT_LINK_CLASS}
          >
            {t(DEFAULT_LOCALE, "museum.network.proposition.actions.record")}
          </a>
        </div>
      </nav>
    </div>
  );
}
