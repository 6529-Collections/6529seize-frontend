"use client";

import { useState } from "react";
import { useFact } from "@/components/explained/facts/FactsProvider";
import IdentityBlock from "@/components/explained/figures/IdentityBlock";
import { Seg } from "@/components/explained/lens/controls";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { ht } from "./copy";
import { identityValues } from "./models/identity";

/**
 * Model D: an identity (TDH-DESIGN.md §5.7). Linked or not: one boost band
 * across both wallets' cards, or none. The cards are drawn at a 310-copy
 * card's rate (the facts layer's); the boost and every total are the
 * engine's.
 */
export default function IdentityModel({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const rate = useFact<number>("engine.rate.310");
  const count = useFact<number>("memes.count");
  const [linked, setLinked] = useState(true);
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
  const boost = formatCents(locale, values.boostCents / 100);
  const B = "tw-font-semibold tw-text-iron-50";
  return (
    <div data-lens="identity">
      <Seg
        label={ht(locale, "explained.tdh.how.identity.group")}
        attr="l"
        value={linked ? "1" : "0"}
        onChange={(value) => setLinked(value === "1")}
        options={[
          {
            value: "1",
            label: ht(locale, "explained.tdh.how.identity.linked"),
          },
          { value: "0", label: ht(locale, "explained.tdh.how.identity.apart") },
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
          tdh={linked ? values.linkedTdh : values.aTdh + values.bTdh}
          locale={locale}
          hatchId="how-identity-band"
        />
      </div>
      <p
        className="tw-m-0 tw-mt-3 tw-max-w-[760px] tw-text-[15px] tw-leading-6 tw-text-iron-300"
        aria-live="polite"
      >
        {linked
          ? ht(locale, "explained.tdh.how.identity.sayLinked", {
              count: n(values.cards),
              season: n(values.season),
              boost,
              tdh: n(values.linkedTdh),
            })
          : ht(locale, "explained.tdh.how.identity.sayApart", {
              a: n(values.aTdh),
              b: n(values.bTdh),
            })}
      </p>
      <p className="tw-m-0 tw-mt-4 tw-max-w-[760px] tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
        <b className={B}>
          {ht(locale, "explained.tdh.how.identity.captionLead")}
        </b>{" "}
        {ht(locale, "explained.tdh.how.identity.caption", { boost })}
      </p>
    </div>
  );
}
