"use client";

import { useFact } from "@/components/explained/facts/FactsProvider";
import IdentityBlock from "@/components/explained/figures/IdentityBlock";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout, RuleValue } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { ENGINE } from "@/lib/explained/engine";
import { formatCents, formatCount } from "@/lib/explained/format";
import { ht } from "./copy";
import { identityValues, rateFromEditions } from "./models/identity";

const B = "tw-font-semibold tw-text-iron-50";

/**
 * Model D: an identity (TDH-DESIGN.md §5.7). Linked or not: one boost band
 * across both wallets' cards, or none. Each card is at its own rate (the
 * facts layer's editions); the boost and every total are the engine's (P26 §7.3, §8.3, §8.4). The Break it links one way only: a pair
 * groups only when both wallets register it (§6.2).
 */
export default function IdentityModel({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const editions = useFact<number[][]>("memes.editions");
  const h = useFact<number>("engine.H");
  const count = useFact<number>("memes.count");
  const max = useFact<number>("rules.maxWallets");
  const model = useBreakable<{ linked: boolean }>({ linked: true }, () => ({
    linked: false,
  }));
  const values =
    editions && h && count
      ? identityValues(
          rateFromEditions(editions.value, h.value, ENGINE.rateCents),
          count.value
        )
      : null;
  if (!values || !max) {
    return (
      <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {ht(locale, "explained.tdh.how.model.unavailable")}
      </p>
    );
  }
  const n = (value: number) => formatCount(locale, value);
  const boost = formatCents(locale, values.boostCents / 100);
  const oneWay = model.broken;
  const linked = model.state.linked && !oneWay;
  const tdh = linked ? values.linkedTdh : values.aTdh + values.bTdh;
  const linkedValue = model.state.linked ? "1" : "0";

  let say;
  if (oneWay) {
    say = (
      <>
        <b className={B}>
          {ht(locale, "explained.tdh.how.identity.sayOneWayLead")}
        </b>{" "}
        {ht(locale, "explained.tdh.how.identity.sayOneWay", {
          a: n(values.aTdh),
          b: n(values.bTdh),
        })}
      </>
    );
  } else if (linked) {
    const others = values.cards - values.typical.cards;
    say = (
      <>
        {ht(locale, "explained.tdh.how.identity.sayLinked", {
          count: n(values.cards),
          season: n(values.season),
          boost,
        })}{" "}
        {ht(
          locale,
          others > 0
            ? "explained.tdh.how.identity.sayPerCard"
            : "explained.tdh.how.identity.sayPerCardAll",
          {
            typical: n(values.typical.cards),
            rate: formatCents(locale, values.typical.rateCents / 100),
            days: n(values.days),
            base: n(values.typical.base),
            boost,
            final: n(values.typical.linkedFinal),
            others: n(others),
          }
        )}
      </>
    );
  } else {
    say = ht(locale, "explained.tdh.how.identity.sayApart", {
      a: n(values.aTdh),
      b: n(values.bTdh),
    });
  }

  return (
    <Lens
      id="identity"
      label={ht(locale, "explained.tdh.how.identity.label")}
      question={ht(locale, "explained.tdh.how.identity.question")}
      broken={oneWay}
      locale={locale}
      stage={
        <>
          <Seg
            label={ht(locale, "explained.tdh.how.identity.group")}
            attr="l"
            value={oneWay ? null : linkedValue}
            onChange={(value) => model.set({ linked: value === "1" })}
            options={[
              {
                value: "1",
                label: ht(locale, "explained.tdh.how.identity.linked"),
              },
              {
                value: "0",
                label: ht(locale, "explained.tdh.how.identity.apart"),
              },
            ]}
          />
          <div className="tw-mt-[18px]">
            <IdentityBlock
              wallets={[
                {
                  name: ht(locale, "explained.tdh.how.identity.walletA"),
                  cards: values.inA,
                },
                {
                  name: ht(locale, "explained.tdh.how.identity.walletB"),
                  cards: values.inB,
                },
              ]}
              linked={linked}
              boostCents={values.boostCents}
              tdh={tdh}
              locale={locale}
              hatchId="how-identity-band"
            />
          </div>
        </>
      }
      rule={{
        lines: [
          {
            text: ht(locale, "explained.tdh.how.identity.rulePair"),
            on: oneWay,
          },
          {
            text: ht(locale, "explained.tdh.how.identity.ruleGroup", {
              max: n(max.value),
            }),
          },
          { text: ht(locale, "explained.tdh.how.identity.ruleBase") },
          {
            text: (
              <>
                {ht(locale, "explained.tdh.how.identity.ruleBeta")}
                {" = "}
                <RuleValue>
                  {formatCents(
                    locale,
                    (linked ? values.boostCents : values.apartBoostCents) / 100
                  )}
                </RuleValue>
              </>
            ),
            on: !oneWay,
          },
          { text: ht(locale, "explained.tdh.how.identity.ruleFinal") },
        ],
        source: ht(locale, "explained.tdh.how.identity.ruleSource"),
      }}
      readout={
        <Readout
          big={n(tdh)}
          unit={ht(locale, "explained.tdh.how.identity.unit")}
          say={say}
        />
      }
      breakIt={
        <BreakIt
          id="oneway"
          pressed={oneWay}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.identity.break")
          )}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[{ kind: "decided", refText: "D136" }]}
          tag={{
            kind: "example",
            text: ht(locale, "explained.tdh.how.identity.tag"),
          }}
        />
      }
    />
  );
}
