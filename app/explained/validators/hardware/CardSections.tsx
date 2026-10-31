import type { ReactNode } from "react";
import { EX_LAYOUT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { CARD, type DcId, type TierId } from "./_lib/card";
import { hw, hwRich } from "./_lib/copy";
import { CardText, Hw } from "./_lib/facts";
import { CardHead, Chip } from "./parts";

/**
 * The owner's card, in its order and its words: Home / Office with its
 * three tiers (and why home comes first), Datacenter with its two options,
 * Large TDH holders, and what holds for every validator. Today's prices
 * replace the card's, each with its source.
 */
const CARD_BOX =
  "tw-relative tw-flex tw-flex-col tw-rounded-2xl tw-border tw-border-solid tw-p-5 md:tw-p-6";

function OptionCard({
  id,
  name,
  what,
  chips,
  data,
  cost,
  recommended,
  locale,
}: {
  readonly id: string;
  readonly name: string;
  readonly what: string;
  readonly chips: readonly string[];
  readonly data?: string;
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
        className="tw-mt-2 tw-block tw-text-[15px] tw-leading-6 tw-text-iron-300 md:tw-min-h-12"
      >
        {what}
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
        <span className="tw-text-[15px] tw-text-iron-400">
          {hw(locale, "tier.buy")}
        </span>
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-6 tw-text-iron-300">
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
        <span className="tw-text-[15px] tw-text-iron-400">
          {hw(locale, "tier.perMonth")}
        </span>
      </p>
      <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {hw(locale, id === "rack" ? "dc.rackCost" : "dc.cloudCost")}
      </p>
    </>
  );
}

function WhyHome({ locale }: { readonly locale: SupportedLocale }) {
  const items = [
    {
      key: "spread",
      label: hw(locale, "home.spreadLabel"),
      body: hw(locale, "home.spread"),
    },
    {
      key: "privacy",
      label: hw(locale, "home.privacyLabel"),
      body: hw(locale, "home.privacy"),
    },
    {
      key: "cost",
      label: hw(locale, "home.costLabel"),
      body: hwRich(locale, "home.cost", {
        good: <Hw id="tier.good.month" locale={locale} />,
        cloud: <Hw id="dc.cloud.bigThree" locale={locale} />,
      }),
    },
  ];
  return (
    <div className="tw-mb-8 md:tw-mb-10" id="why-home">
      <h3 className="tw-m-0 tw-text-[17px] tw-font-semibold tw-leading-6 tw-text-iron-50">
        {hw(locale, "home.why")}
      </h3>
      <ul className="tw-m-0 tw-mt-4 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-8 tw-gap-y-4 tw-p-0 md:tw-grid-cols-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-pl-4"
          >
            <span className="tw-block tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50">
              {item.label}
            </span>
            <span className="tw-mt-1 tw-block tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {item.body}
            </span>
          </li>
        ))}
      </ul>
    </div>
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
              cost={<TierCost tier={tier} locale={locale} />}
              recommended={tier === "good"}
              locale={locale}
            />
          );
        })}
      </div>
      <p className="tw-m-0 tw-mt-4 tw-max-w-[760px] tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
        <CardText id="fine" locale={locale}>
          {CARD.fine}
        </CardText>{" "}
        {hwRich(locale, "tier.basis", {
          date: <Hw id="read.day" locale={locale} />,
          kwh: <Hw id="power.kwh" locale={locale} />,
        })}{" "}
        <a
          href="#spec"
          className="tw-text-primary-300 tw-no-underline hover:tw-underline"
        >
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
      <p className={`${EX_LAYOUT.paragraph} tw-mb-6 md:tw-mb-8`}>
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
      <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        {CARD.holders.items.map((item, index) => {
          const warn = index === CARD.holders.items.length - 1;
          return (
            <li
              key={item.title}
              className={`tw-rounded-2xl tw-border tw-border-solid tw-bg-iron-950 tw-p-5 ${warn ? "tw-border-error/40" : "tw-border-iron-800"}`}
            >
              <span
                className={`tw-grid tw-size-8 tw-place-items-center tw-rounded-lg tw-border tw-border-solid tw-text-sm tw-font-bold ${warn ? "tw-border-error/40 tw-bg-error/[0.1] tw-text-error" : "tw-border-primary-300/30 tw-bg-primary-400/[0.12] tw-text-primary-300"}`}
                aria-hidden="true"
                data-ex-allow-number=""
              >
                {index + 1}
              </span>
              <h3 className="tw-m-0 tw-mt-3 tw-text-lg tw-font-semibold tw-leading-6 tw-tracking-[-0.01em] tw-text-iron-50">
                {item.title}
              </h3>
              <CardText
                id={`holders.${index + 1}`}
                locale={locale}
                className="tw-mt-2 tw-block tw-text-[15px] tw-leading-6 tw-text-iron-300"
              >
                {item.body}
              </CardText>
            </li>
          );
        })}
      </ol>
      <p className="tw-m-0 tw-mt-4 tw-text-[15px] tw-leading-6">
        <a
          href="#several-machines"
          className="tw-text-primary-300 tw-no-underline hover:tw-underline"
        >
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
        <h2
          id="every-title"
          className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.14em] tw-text-primary-300"
        >
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
        <p className="tw-m-0 tw-mt-5 tw-text-[15px] tw-leading-6">
          <a
            href="#what-it-uses"
            className="tw-text-primary-300 tw-no-underline hover:tw-underline"
          >
            {hw(locale, "use.title")}
          </a>
        </p>
      </div>
    </section>
  );
}
