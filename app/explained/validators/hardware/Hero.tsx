import { FactText } from "@/components/explained/facts/FactText";
import { kt } from "@/components/explained/i18n";
import Mark, { MARK_TEXT } from "@/components/explained/marks/Mark";
import { TrackBar } from "@/components/explained/marks/Track";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { fmt, type Fact } from "@/lib/explained/facts";
import { CARD, type TierId } from "./_lib/card";
import type { Suggestion } from "./_lib/chooser";
import { hw, hwRich } from "./_lib/copy";
import { CardText, Hw } from "./_lib/facts";
import MachineChooser, { type ChooserResult } from "./MachineChooser";

/**
 * The top of the page: the eyebrow and title, the owner's lede as written,
 * where the guidance stands (decided, with no minimum) and the software
 * (built, in testing), the card's testing-period banner, and the chooser.
 */
function TestingBanner({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <aside
      className="tw-mt-8 tw-flex tw-flex-col tw-gap-3 tw-rounded-2xl tw-border tw-border-solid tw-border-green/45 tw-bg-green/[0.09] tw-px-5 tw-py-4 md:tw-mt-9 md:tw-flex-row md:tw-items-start md:tw-gap-5 md:tw-px-6 md:tw-py-5"
      aria-label={CARD.testing.tag}
      id="testing"
    >
      <span className="tw-inline-flex tw-flex-none tw-self-start tw-rounded-lg tw-bg-green tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-bold tw-uppercase tw-leading-4 tw-tracking-[0.14em] tw-text-[#0D0D0F]">
        {CARD.testing.tag}
      </span>
      <p className="tw-m-0 tw-text-base tw-leading-[26px] tw-text-iron-50 md:tw-text-[17px] md:tw-leading-[27px]">
        <CardText id="testing" locale={locale}>
          <b className="tw-font-semibold">{CARD.testing.lead}</b>{" "}
          {CARD.testing.body}
        </CardText>
      </p>
    </aside>
  );
}

function tierCost(
  locale: SupportedLocale,
  tier: TierId
): Pick<ChooserResult, "cost"> {
  const buy = (
    <Hw
      id={`tier.${tier}.buy`}
      locale={locale}
      className="tw-font-semibold tw-text-iron-50"
    />
  );
  return {
    cost: (
      <>
        {buy} {hw(locale, "tier.buy")}
      </>
    ),
  };
}

function results(
  locale: SupportedLocale
): Readonly<Record<Suggestion, ChooserResult>> {
  const f = (id: Parameters<typeof Hw>[0]["id"]) => (
    <Hw id={id} locale={locale} />
  );
  const strong = (id: Parameters<typeof Hw>[0]["id"]) => (
    <Hw id={id} locale={locale} className="tw-font-semibold tw-text-iron-50" />
  );
  const tierMore = hw(locale, "chooser.more.tier");
  return {
    acceptable: {
      name: CARD.tiers.acceptable.name,
      recommended: false,
      title: hw(locale, "chooser.acceptable.title"),
      body: hwRich(locale, "chooser.acceptable.body", {
        bits: f("spec.bits"),
        cores: f("spec.acceptable.cores"),
        ram: f("spec.acceptable.ram"),
      }),
      cost: hwRich(locale, "chooser.acceptable.cost", {
        zero: strong("tier.acceptable.own"),
      }),
      more: tierMore,
    },
    good: {
      name: CARD.tiers.good.name,
      recommended: true,
      title: hw(locale, "chooser.good.title"),
      body: hwRich(locale, "chooser.good.body", {
        watts: f("spec.good.watts"),
        month: f("tier.good.month"),
      }),
      ...tierCost(locale, "good"),
      more: tierMore,
    },
    great: {
      name: CARD.tiers.great.name,
      recommended: false,
      title: hw(locale, "chooser.great.title"),
      body: hwRich(locale, "chooser.great.body", {
        ram: f("spec.great.ram"),
        disk: f("spec.great.disk"),
        buy: f("tier.great.buy"),
      }),
      ...tierCost(locale, "great"),
      more: tierMore,
    },
    rack: {
      name: CARD.dc.rack.name,
      recommended: false,
      title: hw(locale, "chooser.rack.title"),
      body: hwRich(locale, "chooser.rack.body", {
        month: f("node.rented"),
        cloud: f("node.cloud"),
      }),
      cost: (
        <>
          {strong("dc.rack.month")} {hw(locale, "tier.perMonth")}
        </>
      ),
      more: hw(locale, "chooser.more.rack"),
    },
    cloud: {
      name: CARD.dc.cloud.name,
      recommended: false,
      title: hw(locale, "chooser.cloud.title"),
      body: hwRich(locale, "chooser.cloud.body", {
        vcpu: f("spec.cloud.vcpu"),
        ram: f("spec.cloud.ram"),
        ram8: f("spec.cloud.ram8"),
        month: f("dc.cloud.month"),
      }),
      cost: (
        <>
          {strong("dc.cloud.month")} {hw(locale, "tier.perMonth")}
        </>
      ),
      more: hw(locale, "chooser.more.cloud"),
    },
  };
}

export default function Hero({
  locale,
  version,
}: {
  readonly locale: SupportedLocale;
  /** The validator software's version, from the kit's facts. */
  readonly version: Fact | null;
}) {
  return (
    <header className="tw-grid tw-grid-cols-1 tw-gap-10 tw-pt-[30px] md:tw-pt-[52px] lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,452px)] lg:tw-gap-14">
      <div className="tw-min-w-0">
        <p className={`${EX_TEXT.label} tw-m-0 tw-mb-4`}>
          {hw(locale, "eyebrow", {
            chapter: kt(locale, "explained.kit.map.validators"),
          })}
        </p>
        <h1 className={EX_TEXT.h1}>{hw(locale, "title")}</h1>
        <p className={`${EX_TEXT.lede} tw-mt-5 md:tw-mt-6`}>
          <CardText id="lede" locale={locale}>
            {CARD.lede}
          </CardText>
        </p>
        <a
          href="#chooser"
          className={`tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-full tw-bg-primary-500 tw-px-4 tw-text-[15px] tw-font-semibold tw-text-white tw-no-underline hover:tw-bg-primary-400 lg:tw-hidden ${EX_FOCUS}`}
          data-jump="chooser"
        >
          {hw(locale, "jumpChooser")}
          <Icon kind="arrow" className="tw-size-[15px] tw-rotate-90" />
        </a>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-[18px] tw-gap-y-2">
          <Mark kind="decided" label={hw(locale, "guidance")} locale={locale} />
          <FactText fact={version} locale={locale}>
            <span
              className={`tw-inline-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-font-semibold tw-text-iron-50 ${MARK_TEXT.md}`}
              data-track="built"
            >
              <TrackBar maturity="built" />
              <span>
                {hw(locale, "software", {
                  version: version ? fmt(version, locale) : "",
                })}
              </span>
            </span>
          </FactText>
        </div>
        <TestingBanner locale={locale} />
      </div>
      <div className="tw-min-w-0 lg:tw-pt-1">
        <MachineChooser
          copy={{
            title: hw(locale, "chooser.title"),
            intro: hw(locale, "chooser.intro"),
            where: hw(locale, "chooser.where"),
            node: hw(locale, "chooser.node"),
            nodeHint: hw(locale, "chooser.nodeHint"),
            spare: hw(locale, "chooser.spare"),
            yes: hw(locale, "chooser.yes"),
            no: hw(locale, "chooser.no"),
            result: hw(locale, "chooser.result"),
            recommended: CARD.recommended,
          }}
          results={results(locale)}
        />
      </div>
    </header>
  );
}
