import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBullhorn,
  faCalendarDays,
  faChartLine,
  faCircleInfo,
  faEarthAmericas,
  faGlobe,
  faListCheck,
  faSliders,
  faTag,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import AboutMintingReference from "./AboutMintingReference";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";
import {
  SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS,
  SUBSCRIPTIONS_SECTION_HEADING_CLASS,
} from "./aboutSubscriptionsStyles";

type MintingMessageKey = Extract<MessageKey, `about.minting.${string}`>;

type SummaryCard = {
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly id: string;
  readonly content: ReactNode;
};

type PhilosophyCard = {
  readonly className?: string;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly title: string;
  readonly content: ReactNode;
};

const locale = DEFAULT_LOCALE;

const m = (key: MintingMessageKey, params: Parameters<typeof t>[2] = {}) =>
  t(locale, key, params);

const TOC_ITEMS = [
  {
    href: "#minting-overview",
    labelKey: "about.minting.summary.label",
  },
  {
    href: "#minting-philosophy",
    labelKey: "about.minting.toc.philosophy",
  },
  {
    href: "#allowlist-background",
    labelKey: "about.minting.toc.background",
  },
  {
    href: "#allowlist-current-practices",
    labelKey: "about.minting.toc.currentPractices",
  },
  {
    href: "#minting-provability",
    labelKey: "about.minting.toc.provability",
  },
  {
    href: "#minting-improvements",
    labelKey: "about.minting.toc.improvements",
  },
  {
    href: "#minting-tools",
    labelKey: "about.minting.toc.tools",
  },
  {
    href: "#minting-technical-issues",
    labelKey: "about.minting.toc.technicalIssues",
  },
] as const satisfies readonly {
  readonly href: `#${string}`;
  readonly labelKey: MintingMessageKey;
}[];

export default function AboutMinting() {
  return (
    <article
      className={`tw-w-full tw-pb-12 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <MintingHeader />
      <MintingOverview />
      <MintingPhilosophy />
      <AboutMintingReference locale={locale} />
    </article>
  );
}

function MintingHeader() {
  return (
    <header className="tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8">
      <div className="tw-max-w-3xl">
        <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
          {m("about.minting.hero.title")}
        </h1>
        <div className="tw-mt-8">
          <h2
            className={SUBSCRIPTIONS_SECTION_HEADING_CLASS}
            id="minting-summary-heading"
          >
            {m("about.minting.summary.label")}
          </h2>
          <div className="tw-mt-2 tw-space-y-2 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
            <p className="tw-m-0">
              Meme Cards are minted (primary sale) when the art for the next
              Meme Card is ready.
            </p>
            <p className="tw-m-0">
              Currently, this is about 3 times per week, but the frequency has
              varied in the past and will vary in the future.
            </p>
          </div>
        </div>
      </div>

      <nav
        aria-label={m("about.minting.hero.title")}
        className="tw-mt-8 tw-scroll-px-2 tw-overflow-x-auto tw-overscroll-x-contain tw-border-0 tw-border-y tw-border-solid tw-border-white/[0.07] tw-py-3 sm:tw-mt-10"
      >
        <ul className="tw-m-0 tw-flex tw-w-max tw-min-w-full tw-list-none tw-flex-nowrap tw-gap-x-1 tw-p-0">
          {TOC_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                className="tw-flex tw-min-h-10 tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-px-2 tw-py-2 tw-text-sm tw-leading-5 tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-bg-white/[0.05] hover:tw-text-iron-50 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[#00f0ff]/60"
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

function MintingOverview() {
  const summaryCards: readonly SummaryCard[] = [
    {
      icon: faGlobe,
      iconClassName: "tw-text-[#00f0ff]",
      id: "website",
      content: (
        <div className="tw-space-y-3">
          <p className="tw-m-0">
            The minting website for The Memes is:{" "}
            <Link
              className="tw-break-all tw-rounded-sm tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
              href="/the-memes/mint"
            >
              https://6529.io/the-memes/mint
            </Link>
          </p>
          <p className="tw-m-0 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-3 tw-text-iron-500">
            There is no other minting website for The Memes
          </p>
        </div>
      ),
    },
    {
      icon: faTag,
      iconClassName: "tw-text-[#8f5cff]",
      id: "price",
      content: (
        <p className="tw-m-0">
          The current minting price is 0.06529ETH + gas costs
        </p>
      ),
    },
    {
      icon: faBullhorn,
      iconClassName: "tw-text-iron-300",
      id: "announcements",
      content: (
        <p className="tw-m-0">
          Minting time and dates are announced on{" "}
          <a
            className="tw-break-all tw-rounded-sm tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
            href="https://x.com/6529collections"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://x.com/6529collections
          </a>
        </p>
      ),
    },
    {
      icon: faCalendarDays,
      iconClassName: "tw-text-orange-400",
      id: "schedule",
      content: (
        <div className="tw-space-y-3">
          <p className="tw-m-0">
            Currently, the mints are happening Mon/Wed/Fri at 11am ET (4pm UTC),
            but times may vary.
          </p>
          <p className="tw-m-0 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-3 tw-text-iron-500">
            Please follow{" "}
            <a
              className="tw-rounded-sm tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-[#00f0ff]/60"
              href="https://x.com/6529collections"
              target="_blank"
              rel="noopener noreferrer"
            >
              @6529collections
            </a>{" "}
            for details
          </p>
        </div>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="minting-summary-heading"
      className="tw-px-1 tw-pb-8 sm:tw-px-2 sm:tw-pb-12"
      id="minting-overview"
    >
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4 lg:tw-gap-4">
        {summaryCards.map((card) => (
          <li
            className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-p-4 sm:tw-p-5`}
            key={card.id}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className={`tw-shrink-0 tw-text-sm ${card.iconClassName}`}
              icon={card.icon}
            />
            <div className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              {card.content}
            </div>
          </li>
        ))}
      </ul>

      <p className="tw-mb-0 tw-mt-6 tw-max-w-4xl tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
        The Memes generally mint using an allowlist model. The purpose of the
        allowlist is to avoid gas wars / bot wars and to give as broad a range
        of people as possible a chance to mint.
      </p>

      <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <aside className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-[#00f0ff]/20 tw-bg-[#00f0ff]/[0.06] tw-p-4 sm:tw-p-6">
          <FontAwesomeIcon
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute -tw-bottom-4 -tw-right-4 tw-text-6xl tw-text-[#00f0ff]/[0.05]"
            icon={faCircleInfo}
          />
          <div className="tw-relative tw-z-10">
            <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-[#00f0ff]">
              A collector of one or more The Memes NFT should not assume they
              receive an allowlist spot for multiple reasons:
            </h3>
            <ul className="tw-m-0 tw-mt-3 tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-400 marker:tw-text-[#00f0ff]/60 sm:tw-space-y-3">
              <li>
                There are many more collectors of The Memes NFTs than there are
                allowlist spots.
              </li>
              <li>
                The allowlist approach is constantly changing and may, in the
                future, move to a completely different model, if a better
                approach emerges.
              </li>
            </ul>
          </div>
        </aside>

        <aside className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-orange-500/20 tw-bg-orange-500/10 tw-p-4 sm:tw-p-6">
          <FontAwesomeIcon
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute -tw-bottom-4 -tw-right-4 tw-text-6xl tw-text-orange-500/[0.05]"
            icon={faTriangleExclamation}
          />
          <p className="tw-relative tw-z-10 tw-m-0 tw-text-base tw-font-medium tw-leading-7 tw-text-orange-300/90">
            Buy The Memes that you like, because you like holding the art or
            feel a sense of identity with the mission. Do not buy them for an
            allowlist spot.
          </p>
        </aside>
      </div>

      <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-font-light tw-italic tw-leading-6 tw-text-iron-500">
        There is quite a bit of thought that goes into the allowlist process.
        Read below to learn more.
      </p>
    </section>
  );
}

function MintingPhilosophy() {
  const philosophyCards: readonly PhilosophyCard[] = [
    {
      icon: faEarthAmericas,
      iconClassName: "tw-text-orange-400",
      iconWrapperClassName: "tw-bg-orange-500/10",
      title: m("about.minting.philosophy.publicMints.title"),
      content: (
        <p className="tw-m-0">
          Public unrestricted mints will be won by a small number of parties
          using bots and paying high gas fees. We have rejected this approach
          because it is obviously a terrible idea.
        </p>
      ),
    },
    {
      icon: faChartLine,
      iconClassName: "tw-text-[#8f5cff]",
      iconWrapperClassName: "tw-bg-[#7000ff]/20",
      title: m("about.minting.philosophy.raisePrices.title"),
      content: (
        <p className="tw-m-0">
          The benefit of higher prices is that they help avoid gas wars and
          return much more money to the artists and creators. The downside is
          that it makes the project accessible only to wealthy collectors. We do
          not want The Memes to be accessible only to wealthy collectors, so we
          have rejected this approach too.
        </p>
      ),
    },
    {
      className: "tw-border-l-2 tw-border-l-[#00f0ff]/50",
      icon: faListCheck,
      iconClassName: "tw-text-[#00f0ff]",
      iconWrapperClassName: "tw-bg-[#00f0ff]/10",
      title: m("about.minting.philosophy.allowlists.title"),
      content: (
        <p className="tw-m-0">
          Allowlists work on a technical basis by restricting which addresses
          can mint on primary. Gas wars can be avoided (mostly) by correctly
          predicting how many addresses to allowlist relative to the edition
          size. One can also maintain low primary prices with this model. This
          is the model we feel is most suitable for the project mission of The
          Memes.
        </p>
      ),
    },
    {
      icon: faSliders,
      iconClassName: "tw-text-iron-300",
      iconWrapperClassName: "tw-bg-iron-900",
      title: m("about.minting.philosophy.openEditions.title"),
      content: (
        <p className="tw-m-0">
          Open editions absorb all demand by having unlimited size editions.
          This is an intriguing and relevant model for The Memes. Our current
          approach is to use this model approximately once per SZN. The cultural
          factors in the NFT space generally appear to preclude against ongoing
          use of Open Editions, and most artists are not comfortable with open
          editions (they prefer to use their &quot;one&quot; or
          &quot;occasional&quot; Open Edition for themselves).
        </p>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="minting-philosophy"
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-px-1 tw-py-8 sm:tw-px-2 sm:tw-py-12"
    >
      <div className="tw-max-w-3xl">
        <h2
          className={`${SUBSCRIPTIONS_SECTION_HEADING_CLASS} tw-scroll-mt-24`}
          id="minting-philosophy"
        >
          {m("about.minting.philosophy.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
          Mints for well-known collections where demand may exceed supply are
          very difficult to manage effectively. The main approaches and our
          views on them are highlighted below.
        </p>
      </div>

      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-mt-6 md:tw-grid-cols-2 md:tw-gap-6">
        {philosophyCards.map((card) => (
          <li
            className={`${SUBSCRIPTIONS_INTERACTIVE_PANEL_CLASS} tw-p-4 sm:tw-p-6 ${card.className ?? ""}`}
            key={card.title}
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              <span
                className={`tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full ${card.iconWrapperClassName}`}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={`tw-text-sm ${card.iconClassName}`}
                  icon={card.icon}
                />
              </span>
              <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
                {card.title}
              </h3>
            </div>
            <div className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              {card.content}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
