import type { ReactNode } from "react";
import { EX_FOCUS, EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { CARD, type DcId, type TierId } from "./_lib/card";
import { hw, hwRich, type HwSuffix } from "./_lib/copy";
import { CardText, Hw, nb } from "./_lib/facts";
import { CardHead, Chip, OpenMark, READ, SMALL, TAP_LINK } from "./parts";

/**
 * The owner's card, in its order and its words: Home / Office with its
 * three tiers (and why home comes first), Datacenter with its two options,
 * Large TDH holders, and what holds for every validator. Today's prices
 * replace the card's, each with its source.
 */
const CARD_BOX =
  "tw-relative tw-flex tw-flex-col tw-rounded-2xl tw-border tw-border-solid tw-p-5 md:tw-p-6";

/**
 * The line under a card's price. Side by side, every card keeps room for
 * two lines (three for the datacenter's), so the price rows of a row of
 * cards line up.
 */
const COST_LINE = `tw-m-0 tw-mt-1 tw-text-iron-300 ${READ}`;

function OptionCard({
  id,
  name,
  what,
  chips,
  data,
  tip,
  cost,
  recommended,
  locale,
}: {
  readonly id: string;
  readonly name: string;
  readonly what: string;
  readonly chips: readonly string[];
  readonly data?: string;
  /** A buying note under the card's own words. */
  readonly tip?: ReactNode;
  readonly cost: ReactNode;
  readonly recommended?: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <article
      id={id}
      aria-labelledby={`${id}-name`}
      className={`${CARD_BOX} tw-scroll-mt-24 ${recommended ? "tw-border-primary-400/70 tw-bg-[linear-gradient(180deg,rgba(82,139,255,0.08),rgba(82,139,255,0.02))] tw-shadow-[0_0_0_1px_rgba(82,139,255,0.22),0_24px_60px_-32px_rgba(63,105,252,0.6)]" : "tw-border-iron-800 tw-bg-iron-950"}`}
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <h3
          id={`${id}-name`}
          className="tw-m-0 tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-iron-50"
        >
          {name}
        </h3>
        {recommended && (
          <span className="tw-mt-1 tw-flex-none tw-rounded-full tw-bg-primary-500 tw-px-2.5 tw-py-1 tw-text-xs tw-font-bold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-white">
            {CARD.recommended}
          </span>
        )}
      </div>
      <CardText
        id={`${id}.what`}
        locale={locale}
        className={`tw-mt-2 tw-block tw-text-iron-300 md:tw-min-h-[52px] ${READ}`}
      >
        {nb(what)}
      </CardText>
      <CardText id={`${id}.chips`} locale={locale} as="div" className="tw-mt-4">
        <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
          {chips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </ul>
      </CardText>
      {data !== undefined && (
        <CardText
          id={`${id}.data`}
          locale={locale}
          className="tw-mt-4 tw-block tw-text-sm tw-leading-[22px] tw-text-iron-400"
        >
          <b className="tw-font-semibold tw-text-iron-300">{CARD.dataLabel}</b>{" "}
          {data}
        </CardText>
      )}
      {tip !== undefined && (
        <p className={`tw-m-0 tw-mt-3 tw-text-iron-300 ${SMALL}`}>{tip}</p>
      )}
      <div className="tw-mt-auto tw-pt-5">
        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
          {cost}
        </div>
      </div>
    </article>
  );
}

function TierCost({
  tier,
  locale,
}: {
  readonly tier: TierId;
  readonly locale: SupportedLocale;
}) {
  const month = <Hw id={`tier.${tier}.month`} locale={locale} />;
  return (
    <>
      <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
        <Hw
          id={`tier.${tier}.buy`}
          locale={locale}
          className="tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-iron-50"
        />
        <span className="tw-text-[15px] tw-text-iron-400 md:tw-text-sm">
          {hw(locale, "tier.buy")}
        </span>
      </p>
      <p className={`${COST_LINE} md:tw-min-h-[52px]`}>
        {tier === "acceptable"
          ? hwRich(locale, "tier.acceptableMonth", { month })
          : hwRich(locale, "tier.month", { month })}
      </p>
    </>
  );
}

function DcCost({
  id,
  locale,
}: {
  readonly id: DcId;
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
        <Hw
          id={`dc.${id}.month`}
          locale={locale}
          className="tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-iron-50"
        />
        <span className="tw-text-[15px] tw-text-iron-400 md:tw-text-sm">
          {hw(locale, "tier.perMonth")}
        </span>
      </p>
      <p className={`${COST_LINE} md:tw-min-h-[78px]`}>
        {id === "rack"
          ? hwRich(locale, "dc.rackCost", {
              spec: <Hw id="dc.rack.spec" locale={locale} />,
              colo: <Hw id="dc.colo.month" locale={locale} />,
              server: <Hw id="dc.colo.server" locale={locale} />,
            })
          : hwRich(locale, "dc.cloudCost", {
              ram: <Hw id="spec.cloud.ram8" locale={locale} />,
            })}
      </p>
    </>
  );
}

/**
 * Why home and office come first: three one-line claims, each with its
 * reasons behind a disclosure, so the tiers start close to the top.
 */
function WhyHome({ locale }: { readonly locale: SupportedLocale }) {
  const items = [
    {
      key: "spread",
      label: hw(locale, "home.spreadLabel"),
      claim: hw(locale, "home.spreadClaim"),
      body: hw(locale, "home.spread"),
    },
    {
      key: "privacy",
      label: hw(locale, "home.privacyLabel"),
      claim: hw(locale, "home.privacyClaim"),
      body: hw(locale, "home.privacy"),
    },
    {
      key: "cost",
      label: hw(locale, "home.costLabel"),
      claim: hwRich(locale, "home.costClaim", {
        good: <Hw id="tier.good.month" locale={locale} />,
      }),
      body: hwRich(locale, "home.cost", {
        fourYears: <Hw id="tier.good.fourYears" locale={locale} />,
        cloud: <Hw id="dc.cloud.bigThree" locale={locale} />,
        cloudFourYears: <Hw id="dc.cloud.bigThreeFourYears" locale={locale} />,
        ovh: <Hw id="dc.cloud.ovh" locale={locale} />,
      }),
    },
  ];
  return (
    <div className="tw-mb-6 md:tw-mb-8" id="why-home">
      <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-50">
        {hw(locale, "home.why")}
      </h3>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-items-start tw-gap-x-8 tw-gap-y-2 tw-p-0 md:tw-mt-4 md:tw-grid-cols-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-pl-4"
            data-why={item.key}
          >
            <details className="tw-group">
              <summary
                className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-start tw-justify-between tw-gap-3 tw-py-1 [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
              >
                <span>
                  <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.12em] tw-text-primary-300">
                    {item.label}
                  </span>
                  <span
                    className={`tw-mt-0.5 tw-block tw-font-semibold tw-text-iron-50 ${READ}`}
                  >
                    {item.claim}
                  </span>
                </span>
                <OpenMark className="tw-mt-1" />
              </summary>
              <p
                className={`tw-m-0 tw-mt-1.5 tw-hidden tw-pb-1 tw-text-iron-300 group-open:tw-block ${READ}`}
              >
                {item.body}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The words the tier cards use, each in one line, under the cards. */
function Terms({ locale }: { readonly locale: SupportedLocale }) {
  const terms = [
    { key: "reads", term: "tier.terms.reads", body: "tier.terms.readsBody" },
    { key: "nvme", term: "tier.terms.nvme", body: "tier.terms.nvmeBody" },
    { key: "ups", term: "tier.terms.ups", body: "tier.terms.upsBody" },
  ] as const satisfies readonly {
    key: string;
    term: HwSuffix;
    body: HwSuffix;
  }[];
  return (
    <dl
      className="tw-m-0 tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-2 md:tw-grid-cols-3"
      aria-label={hw(locale, "tier.terms")}
    >
      {terms.map((item) => (
        <div key={item.key} className={`tw-text-iron-400 ${SMALL}`}>
          <dt className="tw-inline tw-font-semibold tw-text-iron-300">
            {hw(locale, item.term)}.
          </dt>{" "}
          <dd className="tw-m-0 tw-inline">{hw(locale, item.body)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HomeOffice({ locale }: { readonly locale: SupportedLocale }) {
  const tiers: readonly TierId[] = ["acceptable", "good", "great"];
  return (
    <section
      aria-labelledby="home-title"
      className={`${EX_LAYOUT.sectionTight} tw-scroll-mt-24`}
      id="home"
    >
      <CardHead
        id="home-title"
        kicker={CARD.home.kicker}
        title={CARD.home.title}
        note={CARD.home.note}
      />
      <WhyHome locale={locale} />
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3 md:tw-gap-[18px]">
        {tiers.map((tier) => {
          const def = CARD.tiers[tier];
          return (
            <OptionCard
              key={tier}
              id={`tier-${tier}`}
              name={def.name}
              what={def.what}
              chips={def.chips}
              data={def.data}
              {...(tier === "good"
                ? {
                    tip: hwRich(locale, "tier.goodDrive", {
                      min: <Hw id="spec.good.driveMin" locale={locale} />,
                      range: <Hw id="spec.good.drive" locale={locale} />,
                      node: <Hw id="spec.great.disk" locale={locale} />,
                    }),
                  }
                : {})}
              cost={<TierCost tier={tier} locale={locale} />}
              recommended={tier === "good"}
              locale={locale}
            />
          );
        })}
      </div>
      <Terms locale={locale} />
      <p className="tw-m-0 tw-mt-4 tw-max-w-[760px] tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
        <CardText id="fine" locale={locale}>
          {CARD.fine}
        </CardText>{" "}
        {hwRich(locale, "tier.basis", {
          date: <Hw id="read.day" locale={locale} />,
          year: <Hw id="price.riseYear" locale={locale} />,
          kwh: <Hw id="power.kwh" locale={locale} />,
          month: <Hw id="power.month" locale={locale} />,
        })}
      </p>
      <p className={`tw-m-0 tw-mt-1 ${READ}`}>
        <a href="#spec" className={`${TAP_LINK} tw-font-semibold`}>
          {hw(locale, "tier.full")}
        </a>
      </p>
    </section>
  );
}

export function Datacenter({ locale }: { readonly locale: SupportedLocale }) {
  const options: readonly DcId[] = ["rack", "cloud"];
  return (
    <section
      aria-labelledby="datacenter-title"
      className={`${EX_LAYOUT.sectionTight} tw-scroll-mt-24`}
      id="datacenter"
    >
      <CardHead
        id="datacenter-title"
        kicker={CARD.datacenter.kicker}
        title={CARD.datacenter.title}
        note={CARD.datacenter.note}
      />
      <p
        className={`${EX_LAYOUT.paragraph} tw-mb-6 tw-text-iron-300 md:tw-mb-8 ${READ}`}
      >
        {hw(locale, "dc.intro")}
      </p>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 md:tw-gap-[18px]">
        {options.map((id) => {
          const def = CARD.dc[id];
          return (
            <OptionCard
              key={id}
              id={`dc-${id}`}
              name={def.name}
              what={def.what}
              chips={def.chips}
              cost={<DcCost id={id} locale={locale} />}
              locale={locale}
            />
          );
        })}
      </div>
    </section>
  );
}

export function LargeHolders({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="holders-title"
      className={`${EX_LAYOUT.sectionTight} tw-scroll-mt-24`}
      id="large-holders"
    >
      <CardHead
        id="holders-title"
        kicker={CARD.holders.kicker}
        title={CARD.holders.title}
        note={CARD.holders.note}
      />
      <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-0 tw-p-0 sm:tw-grid-cols-2 sm:tw-gap-4 lg:tw-grid-cols-4">
        {CARD.holders.items.map((item, index) => {
          const warn = index === CARD.holders.items.length - 1;
          return (
            <li
              key={item.title}
              className={`tw-grid tw-grid-cols-[32px_minmax(0,1fr)] tw-gap-x-3.5 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-4 first:tw-border-t-0 first:tw-pt-0 sm:tw-block sm:tw-rounded-2xl sm:tw-border sm:tw-bg-iron-950 sm:tw-p-5 sm:first:tw-border-t sm:first:tw-pt-5 ${warn ? "sm:tw-border-error/40" : ""}`}
            >
              <span
                className={`tw-grid tw-size-8 tw-place-items-center tw-rounded-lg tw-border tw-border-solid tw-text-sm tw-font-bold ${warn ? "tw-border-error/40 tw-bg-error/[0.1] tw-text-error" : "tw-border-primary-300/30 tw-bg-primary-400/[0.12] tw-text-primary-300"}`}
                aria-hidden="true"
                data-ex-allow-number=""
              >
                {index + 1}
              </span>
              <div className="tw-min-w-0">
                <h3 className="tw-m-0 tw-pt-1 tw-text-lg tw-font-semibold tw-leading-6 tw-tracking-[-0.01em] tw-text-iron-50 sm:tw-mt-3 sm:tw-pt-0">
                  {item.title}
                </h3>
                <CardText
                  id={`holders.${index + 1}`}
                  locale={locale}
                  className={`tw-mt-1 tw-block tw-text-iron-300 sm:tw-mt-2 ${READ}`}
                >
                  {item.body}
                </CardText>
              </div>
            </li>
          );
        })}
      </ol>
      <p className={`tw-m-0 tw-mt-3 ${READ}`}>
        <a href="#several-machines" className={TAP_LINK}>
          {hw(locale, "holders.title")}
        </a>
      </p>
    </section>
  );
}

export function EveryValidator({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="every-title"
      className={`${EX_LAYOUT.sectionTight} tw-scroll-mt-24`}
      id="every-validator"
    >
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-8">
        <h2 id="every-title" className={EX_TEXT.h2}>
          {CARD.every.label}
        </h2>
        <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-8 tw-gap-y-4 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
          {CARD.every.facts.map((fact, index) => (
            <li
              key={fact.bold}
              className="tw-flex tw-items-start tw-gap-3 tw-text-base tw-leading-6 tw-text-iron-300"
            >
              <span
                className="tw-mt-[7px] tw-size-2.5 tw-flex-none tw-rounded-full tw-bg-green tw-shadow-[0_0_0_4px_rgba(60,203,127,0.15)]"
                aria-hidden="true"
              />
              <CardText id={`every.${index + 1}`} locale={locale}>
                <b className="tw-font-semibold tw-text-iron-50">{fact.bold}</b>
                {fact.rest}
              </CardText>
            </li>
          ))}
        </ul>
        <p className={`tw-m-0 tw-mt-5 tw-text-iron-300 ${READ}`}>
          {hwRich(locale, "every.wire", {
            wire: <Hw id="use.wire" locale={locale} />,
          })}{" "}
          <a href="#part-network" className={TAP_LINK}>
            {hw(locale, "every.more")}
          </a>
        </p>
      </div>
    </section>
  );
}

/**
 * At the foot of the header: where things are, one tap away. The page is
 * long on a phone, so the card's sections and the tables people come back
 * for are named here.
 */
const JUMPS: readonly { readonly href: string; readonly label: HwSuffix }[] = [
  { href: "#home", label: "jump.home" },
  { href: "#datacenter", label: "jump.datacenter" },
  { href: "#parts", label: "jump.parts" },
  { href: "#instance-types", label: "jump.cloud" },
  { href: "#own-node", label: "jump.node" },
  { href: "#questions", label: "jump.questions" },
];

export function JumpRow({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <nav
      aria-label={hw(locale, "jump.label")}
      className="tw-scroll-mt-24 tw-border-0 tw-border-y tw-border-solid tw-border-iron-900 tw-py-3"
      data-jumps=""
      id="jumps"
    >
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-1 tw-gap-y-1.5 tw-p-0">
        {JUMPS.map((jump) => (
          <li key={jump.href}>
            <a
              href={jump.href}
              className={`tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-full tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-300 tw-no-underline hover:tw-bg-iron-900 hover:tw-text-iron-50 ${EX_FOCUS}`}
            >
              {hw(locale, jump.label)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
