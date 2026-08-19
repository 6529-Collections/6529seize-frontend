import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUpRightFromSquare,
  faCalendarDays,
  faGlobe,
  faListCheck,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

import ButtonLink from "@/components/utils/button/ButtonLink";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import AboutMintingReference from "./AboutMintingReference";
import {
  ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME,
  ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME,
  ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME,
  ABOUT_FRAMED_ICON_CLASS_NAME,
  ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME,
  ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS,
  ABOUT_SECTION_DIVIDER_CLASS_NAME,
} from "./AboutLayout";
import AboutSubscriptionsProfileButton from "./AboutSubscriptionsProfileButton";
import {
  SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS,
  SUBSCRIPTIONS_NESTED_HEADING_CLASS,
  SUBSCRIPTIONS_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type MintingMessageKey = Extract<MessageKey, `about.minting.${string}`>;

type PhaseCard = {
  readonly accentClassName: string;
  readonly badgeKey: MintingMessageKey;
  readonly descriptionKey: MintingMessageKey;
  readonly id: string;
  readonly titleKey: MintingMessageKey;
};

type MintMethodHeaderProps = {
  readonly headingId: string;
  readonly icon: IconDefinition;
  readonly iconWrapperClassName: string;
  readonly title: string;
};

const locale = DEFAULT_LOCALE;

const m = (key: MintingMessageKey, params: Parameters<typeof t>[2] = {}) =>
  t(locale, key, params);

const TOC_ITEMS = [
  {
    href: "#minting-start",
    labelKey: "about.minting.nav.start",
  },
  {
    href: "#minting-phases",
    labelKey: "about.minting.nav.phases",
  },
  {
    href: "#minting-eligibility",
    labelKey: "about.minting.nav.eligibility",
  },
  {
    href: "#minting-reference",
    labelKey: "about.minting.nav.reference",
  },
] as const satisfies readonly {
  readonly href: `#${string}`;
  readonly labelKey: MintingMessageKey;
}[];

const PHASES = [
  {
    accentClassName: "tw-border-orange-500/35 tw-text-orange-300",
    badgeKey: "about.minting.phases.phase0.badge",
    descriptionKey: "about.minting.phases.phase0.description",
    id: "0",
    titleKey: "about.minting.phases.phase0.title",
  },
  {
    accentClassName: "tw-border-[#00f0ff]/35 tw-text-[#00f0ff]",
    badgeKey: "about.minting.phases.phase1.badge",
    descriptionKey: "about.minting.phases.phase1.description",
    id: "1",
    titleKey: "about.minting.phases.phase1.title",
  },
  {
    accentClassName: "tw-border-[#8f5cff]/40 tw-text-[#a783ff]",
    badgeKey: "about.minting.phases.phase2.badge",
    descriptionKey: "about.minting.phases.phase2.description",
    id: "2",
    titleKey: "about.minting.phases.phase2.title",
  },
  {
    accentClassName: "tw-border-emerald-500/35 tw-text-emerald-300",
    badgeKey: "about.minting.phases.public.badge",
    descriptionKey: "about.minting.phases.public.description",
    id: "public",
    titleKey: "about.minting.phases.public.title",
  },
] as const satisfies readonly PhaseCard[];

export default function AboutMinting() {
  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <MintingHeader />
      <MintingStart />
      <MintingPhases />
      <MintingEligibility />
      <AboutMintingReference locale={locale} />
    </article>
  );
}

function MintingHeader() {
  return (
    <header
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-pb-8 tw-pt-4 sm:tw-pb-10 sm:tw-pt-8`}
    >
      <div className="tw-max-w-3xl">
        <h1 className={ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME}>
          {m("about.minting.hero.title")}
        </h1>
        <p className="tw-mb-0 tw-mt-3 tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300">
          {m("about.minting.hero.intro")}
        </p>
      </div>

      <nav
        aria-label={m("about.minting.nav.ariaLabel")}
        className={`tw-mt-7 tw-border-0 tw-border-y tw-border-solid tw-py-3 sm:tw-mt-8 ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
      >
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-1 tw-p-0">
          {TOC_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                className="tw-flex tw-min-h-10 tw-items-center tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-bg-white/[0.05] hover:tw-text-iron-50 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#00f0ff]/60"
                href={item.href}
              >
                {m(item.labelKey)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function MintingStart() {
  return (
    <section
      aria-labelledby="minting-start-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-scroll-mt-24 tw-pb-8 sm:tw-pb-12`}
      id="minting-start"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="minting-start-heading"
        >
          {m("about.minting.start.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
          {m("about.minting.start.intro")}
        </p>
      </div>

      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <section
          aria-labelledby="regular-mint-heading"
          className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-flex tw-flex-col tw-p-4 sm:tw-p-6`}
        >
          <MintMethodHeader
            headingId="regular-mint-heading"
            icon={faGlobe}
            iconWrapperClassName="tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/10 tw-text-[#00f0ff]"
            title={m("about.minting.start.regular.title")}
          />
          <p className="tw-mb-0 tw-mt-4 tw-flex-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m("about.minting.start.regular.description")}
          </p>
          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <ButtonLink href="/the-memes/mint" variant="action">
              {m("about.minting.start.regular.action")}
            </ButtonLink>
            <a
              className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-1.5 tw-rounded-lg tw-px-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
              href="https://thememes.6529.io/"
              rel="noopener noreferrer"
              target="_blank"
            >
              {m("about.minting.start.regular.standalone")}
              <FontAwesomeIcon
                aria-hidden="true"
                className="tw-text-[10px]"
                icon={faArrowUpRightFromSquare}
              />
            </a>
          </div>
        </section>

        <section
          aria-labelledby="subscription-mint-heading"
          className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-flex tw-flex-col tw-p-4 sm:tw-p-6`}
        >
          <MintMethodHeader
            headingId="subscription-mint-heading"
            icon={faRepeat}
            iconWrapperClassName="tw-border-[#8f5cff]/20 tw-bg-[#8f5cff]/10 tw-text-[#a783ff]"
            title={m("about.minting.start.subscription.title")}
          />
          <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m("about.minting.start.subscription.description")}
          </p>
          <p className="tw-mb-0 tw-mt-3 tw-flex-1 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-200">
            {m("about.minting.start.subscription.eligibility")}
          </p>
          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <AboutSubscriptionsProfileButton variant="white" />
            <Link
              className="tw-inline-flex tw-min-h-10 tw-items-center tw-rounded-lg tw-px-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
              href="/about/subscriptions"
            >
              {m("about.minting.start.subscription.learnMore")}
            </Link>
          </div>
        </section>
      </div>

      <div
        className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-mt-4 tw-flex tw-flex-col tw-gap-4 tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-p-5`}
      >
        <div className="tw-flex tw-min-w-0 tw-gap-3">
          <span
            className={`${ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME} tw-border-orange-500/20 tw-bg-orange-500/10 tw-text-orange-300`}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className={ABOUT_FRAMED_ICON_CLASS_NAME}
              icon={faCalendarDays}
            />
          </span>
          <div>
            <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
              {m("about.minting.start.schedule.title")}
            </h3>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {m("about.minting.start.schedule.description")}
            </p>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2 sm:tw-shrink-0 sm:tw-justify-end">
          <ButtonLink href="/meme-calendar" variant="secondary">
            {m("about.minting.start.schedule.calendarAction")}
          </ButtonLink>
          <ButtonLink
            href="https://x.com/6529collections"
            rel="noopener noreferrer"
            target="_blank"
            variant="secondary"
          >
            {m("about.minting.start.schedule.announcementsAction")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function MintMethodHeader({
  headingId,
  icon,
  iconWrapperClassName,
  title,
}: MintMethodHeaderProps) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <span
        className={`${ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME} ${iconWrapperClassName}`}
      >
        <FontAwesomeIcon
          aria-hidden="true"
          className={ABOUT_FRAMED_ICON_CLASS_NAME}
          icon={icon}
        />
      </span>
      <h3 className={SUBSCRIPTIONS_NESTED_HEADING_CLASS} id={headingId}>
        {title}
      </h3>
    </div>
  );
}

function MintingPhases() {
  return (
    <section
      aria-labelledby="minting-phases-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-py-8 sm:tw-py-12 ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
      id="minting-phases"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="minting-phases-heading"
        >
          {m("about.minting.phases.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
          {m("about.minting.phases.intro")}
        </p>
      </div>

      <ol className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        {PHASES.map((phase) => (
          <li
            className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-5`}
            key={phase.id}
          >
            <div
              className={`tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-black tw-text-xs tw-font-semibold ${phase.accentClassName}`}
            >
              {m(phase.badgeKey)}
            </div>
            <h3 className="tw-mb-0 tw-mt-4 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
              {m(phase.titleKey)}
            </h3>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
              {m(phase.descriptionKey)}
            </p>
          </li>
        ))}
      </ol>

      <aside className="tw-mt-4 tw-flex tw-w-full tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/[0.05] tw-p-4 sm:tw-p-5">
        <FontAwesomeIcon
          aria-hidden="true"
          className="tw-mt-1 tw-shrink-0 tw-text-[#00f0ff]"
          icon={faListCheck}
        />
        <div>
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {m("about.minting.phases.live.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {m("about.minting.phases.live.description")}
          </p>
        </div>
      </aside>
    </section>
  );
}

function MintingEligibility() {
  return (
    <section
      aria-labelledby="minting-eligibility-heading"
      className={`${ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME} tw-scroll-mt-24 tw-border-0 tw-border-t tw-border-solid tw-py-8 sm:tw-py-12 ${ABOUT_SECTION_DIVIDER_CLASS_NAME}`}
      id="minting-eligibility"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
          id="minting-eligibility-heading"
        >
          {m("about.minting.eligibility.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
          {m("about.minting.eligibility.intro")}
        </p>
      </div>

      <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-6`}>
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {m("about.minting.eligibility.wallet.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m("about.minting.eligibility.wallet.description")}
          </p>
        </div>
        <div className={`${SUBSCRIPTIONS_PANEL_CLASS} tw-p-4 sm:tw-p-6`}>
          <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {m("about.minting.eligibility.distribution.title")}
          </h3>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
            {m("about.minting.eligibility.distribution.description")}
          </p>
          <Link
            className="tw-mt-3 tw-inline-flex tw-min-h-10 tw-items-center tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
            href="/the-memes/mint"
          >
            {m("about.minting.eligibility.distribution.action")}
          </Link>
        </div>
      </div>

      <p className="tw-mb-0 tw-mt-5 tw-max-w-4xl tw-text-sm tw-font-medium tw-leading-6 tw-text-orange-300/90">
        {m("about.minting.eligibility.subscriptionNote")}
      </p>
    </section>
  );
}
