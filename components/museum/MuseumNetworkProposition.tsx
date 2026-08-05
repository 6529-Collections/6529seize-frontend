import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumPublicDocument } from "@/lib/museum/publication";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication";
import {
  MUSEUM_REPOSITORY_URL,
  MUSEUM_SAFE_ETHERSCAN_URL,
} from "@/lib/museum/types";

const TEXT_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

const PRIMARY_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";

const SECONDARY_LINK_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-border-iron-500 hover:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";

const NETWORK_NATIVE_PILLARS = [
  {
    titleKey: "museum.network.proposition.pillars.held.title",
    bodyKeys: [
      "museum.network.proposition.pillars.held.body1",
      "museum.network.proposition.pillars.held.body2",
    ],
  },
  {
    titleKey: "museum.network.proposition.pillars.decentralized.title",
    bodyKeys: [
      "museum.network.proposition.pillars.decentralized.body1",
      "museum.network.proposition.pillars.decentralized.body2",
    ],
  },
  {
    titleKey: "museum.network.proposition.pillars.ethereum.title",
    bodyKeys: [
      "museum.network.proposition.pillars.ethereum.body1",
      "museum.network.proposition.pillars.ethereum.body2",
      "museum.network.proposition.pillars.ethereum.body3",
    ],
  },
  {
    titleKey: "museum.network.proposition.pillars.open.title",
    bodyKeys: [
      "museum.network.proposition.pillars.open.body1",
      "museum.network.proposition.pillars.open.body2",
      "museum.network.proposition.pillars.open.body3",
    ],
  },
  {
    titleKey: "museum.network.proposition.pillars.machine.title",
    bodyKeys: [
      "museum.network.proposition.pillars.machine.body1",
      "museum.network.proposition.pillars.machine.body2",
    ],
  },
] as const;

const PRESENT_STATE = [
  {
    titleKey: "museum.network.proposition.today.collection.title",
    bodyKey: "museum.network.proposition.today.collection.body",
    actionKey: "museum.network.proposition.today.collection.action",
    href: "/museum/network/collection",
    external: false,
  },
  {
    titleKey: "museum.network.proposition.today.governance.title",
    bodyKey: "museum.network.proposition.today.governance.body",
    actionKey: "museum.network.proposition.today.governance.action",
    href: "/museum/network/governance",
    external: false,
  },
  {
    titleKey: "museum.network.proposition.today.record.title",
    bodyKey: "museum.network.proposition.today.record.body",
    actionKey: "museum.network.proposition.today.record.action",
    href: MUSEUM_REPOSITORY_URL,
    external: true,
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

export function MuseumNetworkProposition({
  commit,
  missionSourceUrl,
  openMuseum,
  transition,
}: MuseumNetworkPropositionProps) {
  return (
    <div className="tw-min-w-0">
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
        <p className="tw-m-0 tw-mt-5 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-400">
          {t(DEFAULT_LOCALE, "museum.network.proposition.principle")}
        </p>
      </header>

      <section
        aria-labelledby="museum-of-network-title"
        className="tw-mt-16 tw-grid tw-gap-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-16"
      >
        <h2
          id="museum-of-network-title"
          className="tw-m-0 tw-max-w-md tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.ofNetwork.title")}
        </h2>
        <div className="tw-max-w-3xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-100">
            {t(DEFAULT_LOCALE, "museum.network.proposition.ofNetwork.body1")}
          </p>
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.ofNetwork.body2")}
          </p>
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.ofNetwork.body3")}
          </p>
          <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-400">
            {t(DEFAULT_LOCALE, "museum.network.proposition.ofNetwork.body4")}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="network-native-title"
        className="tw-mt-20 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      >
        <h2
          id="network-native-title"
          className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.pillars.title")}
        </h2>
        <div className="tw-mt-10 tw-grid tw-gap-x-12 tw-gap-y-10 lg:tw-grid-cols-2">
          {NETWORK_NATIVE_PILLARS.map((pillar) => (
            <article
              key={pillar.titleKey}
              className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6"
            >
              <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-100">
                {t(DEFAULT_LOCALE, pillar.titleKey)}
              </h3>
              <div className="tw-mt-4 tw-space-y-4 tw-text-base tw-leading-7 tw-text-iron-400">
                {pillar.bodyKeys.map((bodyKey) => (
                  <p key={bodyKey} className="tw-m-0">
                    {t(DEFAULT_LOCALE, bodyKey)}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="museum-today-title"
        className="tw-mt-20 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      >
        <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-16">
          <h2
            id="museum-today-title"
            className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
          >
            {t(DEFAULT_LOCALE, "museum.network.proposition.today.title")}
          </h2>
          <div className="tw-max-w-3xl tw-space-y-4 tw-text-base tw-leading-7 tw-text-iron-300">
            <p className="tw-m-0 tw-text-lg tw-leading-8 tw-text-iron-100">
              {t(DEFAULT_LOCALE, "museum.network.proposition.today.body1")}
            </p>
            <p className="tw-m-0">
              {t(DEFAULT_LOCALE, "museum.network.proposition.today.body2")}
            </p>
          </div>
        </div>
        <div className="tw-mt-10 tw-grid tw-gap-8 lg:tw-grid-cols-3">
          {PRESENT_STATE.map((item) => (
            <article
              key={item.titleKey}
              className="tw-flex tw-flex-col tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-6"
            >
              <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
                {t(DEFAULT_LOCALE, item.titleKey)}
              </h3>
              <p className="tw-m-0 tw-mt-3 tw-flex-1 tw-text-base tw-leading-7 tw-text-iron-400">
                {t(DEFAULT_LOCALE, item.bodyKey)}
              </p>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${TEXT_LINK_CLASS} tw-mt-4 tw-self-start`}
                >
                  {t(DEFAULT_LOCALE, item.actionKey)}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={`${TEXT_LINK_CLASS} tw-mt-4 tw-self-start`}
                >
                  {t(DEFAULT_LOCALE, item.actionKey)}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="museum-next-title"
        className="tw-mt-20 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
      >
        <h2
          id="museum-next-title"
          className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.next.title")}
        </h2>
        <p className="tw-m-0 tw-mt-4 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.proposition.next.intro")}
        </p>
        <div className="tw-mt-10 tw-grid tw-gap-8 lg:tw-grid-cols-3">
          {NEXT_STAGE.map((item) => (
            <article
              key={item.titleKey}
              className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6"
            >
              <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-iron-100">
                {t(DEFAULT_LOCALE, item.titleKey)}
              </h3>
              <p className="tw-m-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-400">
                {t(DEFAULT_LOCALE, item.bodyKey)}
              </p>
            </article>
          ))}
        </div>
        <p className="tw-m-0 tw-mt-8 tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "museum.network.proposition.next.conclusion")}
        </p>
      </section>

      <section
        aria-labelledby="museum-permanence-title"
        className="tw-mt-20 tw-grid tw-gap-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-10 lg:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:tw-gap-16"
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

      <section
        aria-labelledby="public-institution-title"
        className="tw-mt-20 tw-max-w-5xl"
      >
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "museum.network.proposition.final.eyebrow")}
        </p>
        <h2
          id="public-institution-title"
          className="tw-m-0 tw-mt-3 tw-max-w-3xl tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-4xl"
        >
          {t(DEFAULT_LOCALE, "museum.network.proposition.final.title")}
        </h2>
        <div className="tw-mt-6 tw-max-w-4xl tw-space-y-5 tw-text-base tw-leading-7 tw-text-iron-300">
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.final.body1")}
          </p>
          <p className="tw-m-0">
            {t(DEFAULT_LOCALE, "museum.network.proposition.final.body2")}
          </p>
          <p className="tw-m-0 tw-text-xl tw-leading-8 tw-text-iron-100">
            {t(DEFAULT_LOCALE, "museum.network.proposition.final.closing")}
          </p>
        </div>
        <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-3">
          <Link
            href="/museum/network/collection"
            className={PRIMARY_LINK_CLASS}
          >
            {t(DEFAULT_LOCALE, "museum.network.proposition.actions.collection")}
          </Link>
          <a
            href={MUSEUM_REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_LINK_CLASS}
          >
            {t(DEFAULT_LOCALE, "museum.network.proposition.actions.record")}
          </a>
          <Link href="/network" className={SECONDARY_LINK_CLASS}>
            {t(DEFAULT_LOCALE, "museum.network.proposition.actions.network")}
          </Link>
        </div>
      </section>

      <nav
        className="tw-mt-16 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
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
        </div>
      </nav>
    </div>
  );
}
