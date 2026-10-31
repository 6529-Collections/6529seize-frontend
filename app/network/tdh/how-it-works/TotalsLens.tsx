"use client";

import { useFact } from "@/components/explained/facts/FactsProvider";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import ValueTable from "./_kit/ValueTable";
import { ht } from "./copy";
import { identityValues } from "./models/identity";

const B = "tw-font-semibold tw-text-iron-50";

/**
 * The network, step 14: adding it up (P26 §7.3, §8.5). The example is "An
 * identity"'s: wallets A and B, linked. Each wallet keeps its own record,
 * with its own boost; the identity's record has one boost on everything.
 * The total adds identity finals. The Break it adds the wallets' finals
 * instead and shows the difference. Every value is the engine's.
 */
export default function TotalsLens({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const rate = useFact<number>("engine.rate.310");
  const count = useFact<number>("memes.count");
  const model = useBreakable<{ wallets: boolean }>({ wallets: false }, () => ({
    wallets: true,
  }));
  const values =
    rate && count
      ? identityValues(Math.round(rate.value * 100), count.value)
      : null;
  if (!values) {
    return (
      <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {ht(locale, "explained.tdh.how.model.unavailable")}
      </p>
    );
  }
  const n = (value: number) => formatCount(locale, value);
  const cents = (value: number) => formatCents(locale, value / 100);
  const wallets = model.broken;
  const walletSum = values.aTdh + values.bTdh;
  const short = values.linkedTdh - walletSum;

  return (
    <Lens
      id="totals"
      label={ht(locale, "explained.tdh.how.totals.label")}
      question={ht(locale, "explained.tdh.how.totals.question")}
      broken={wallets}
      locale={locale}
      stage={
        <ValueTable
          caption={ht(locale, "explained.tdh.how.totals.caption")}
          head={[
            ht(locale, "explained.tdh.how.totals.record"),
            ht(locale, "explained.tdh.how.totals.cards"),
            ht(locale, "explained.tdh.how.totals.boost"),
            ht(locale, "explained.tdh.how.totals.tdh"),
          ]}
          rows={[
            {
              key: "a",
              label: ht(locale, "explained.tdh.how.totals.walletA"),
              values: [
                n(values.inA),
                cents(values.apartBoostCents),
                n(values.aTdh),
              ],
              tone: wallets ? "on" : "off",
            },
            {
              key: "b",
              label: ht(locale, "explained.tdh.how.totals.walletB"),
              values: [
                n(values.inB),
                cents(values.apartBoostCents),
                n(values.bTdh),
              ],
              tone: wallets ? "on" : "off",
            },
            {
              key: "identity",
              label: ht(locale, "explained.tdh.how.totals.identity"),
              values: [
                n(values.cards),
                cents(values.boostCents),
                n(values.linkedTdh),
              ],
              tone: wallets ? "off" : "on",
            },
          ]}
        />
      }
      rule={{
        lines: [
          {
            text: ht(locale, "explained.tdh.how.totals.ruleTotal"),
            on: !wallets,
          },
          { text: ht(locale, "explained.tdh.how.totals.ruleIdentity") },
          {
            text: ht(locale, "explained.tdh.how.totals.ruleWallets"),
            on: wallets,
          },
          { text: ht(locale, "explained.tdh.how.totals.ruleSinks") },
        ],
        source: ht(locale, "explained.tdh.how.totals.ruleSource"),
      }}
      readout={
        wallets ? (
          <Readout
            big={n(walletSum)}
            unit={ht(locale, "explained.tdh.how.identity.unit")}
            say={
              <>
                <b className={B}>
                  {ht(locale, "explained.tdh.how.totals.sayWalletsLead", {
                    short: n(short),
                  })}
                </b>{" "}
                {ht(locale, "explained.tdh.how.totals.sayWallets")}
              </>
            }
          />
        ) : (
          <Readout
            big={n(values.linkedTdh)}
            unit={ht(locale, "explained.tdh.how.identity.unit")}
            say={ht(locale, "explained.tdh.how.totals.say")}
          />
        )
      }
      breakIt={
        <BreakIt
          id="wallets"
          pressed={wallets}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.totals.break")
          )}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            {
              maturity: "live",
              label: ht(locale, "explained.tdh.how.firstday.stamp"),
            },
          ]}
          tag={{
            kind: "example",
            text: ht(locale, "explained.tdh.how.identity.tag"),
          }}
        />
      }
    />
  );
}
