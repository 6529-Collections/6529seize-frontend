"use client";

import { useFact } from "@/components/explained/facts/FactsProvider";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import type { SupportedLocale } from "@/i18n/locales";
import { ENGINE } from "@/lib/explained/engine";
import { formatCents, formatCount } from "@/lib/explained/format";
import ValueTable from "./_kit/ValueTable";
import { ht } from "./copy";
import { identityValues, rateFromEditions } from "./models/identity";

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
  const editions = useFact<number[][]>("memes.editions");
  const h = useFact<number>("engine.H");
  const count = useFact<number>("memes.count");
  const model = useBreakable<{ wallets: boolean }>({ wallets: false }, () => ({
    wallets: true,
  }));
  const values =
    editions && h && count
      ? identityValues(
          rateFromEditions(editions.value, h.value, ENGINE.rateCents),
          count.value
        )
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
  /** A record's name, with its cards and its boost on a second line. */
  const record = (
    name: "walletA" | "walletB" | "identity",
    cards: number,
    boostCents: number
  ) => (
    <>
      <span className="tw-block">
        {ht(locale, `explained.tdh.how.totals.${name}`)}
      </span>
      <span className="tw-block tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {ht(locale, "explained.tdh.how.totals.recordLine", {
          count: n(cards),
          boost: cents(boostCents),
        })}
      </span>
    </>
  );
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
            ht(locale, "explained.tdh.how.totals.tdh"),
          ]}
          rows={[
            {
              key: "a",
              label: record("walletA", values.inA, values.apartBoostCents),
              values: [n(values.aTdh)],
              tone: wallets ? "on" : "off",
            },
            {
              key: "b",
              label: record("walletB", values.inB, values.apartBoostCents),
              values: [n(values.bTdh)],
              tone: wallets ? "on" : "off",
            },
            {
              key: "identity",
              label: record("identity", values.cards, values.boostCents),
              values: [n(values.linkedTdh)],
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
