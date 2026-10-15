"use client";

import { useState } from "react";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  EDITION_FLOOR_THRESHOLD,
  EXAMPLE_NETWORK,
  effectiveEdition,
  isRateHalfCentTie,
  rateCents,
} from "@/lib/tdh/tdhV1Arithmetic";
import ExplorableFrame from "./ExplorableFrame";
import IntegerField from "./IntegerField";

const DEFAULT_MINTED = 149;
const DEFAULT_CLAIM = 332;
const H = EXAMPLE_NETWORK.largestEdition;

/** Steps 6 and 7: from minted copies and a claim limit to the card's rate. */
export default function RateExplorer({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [minted, setMinted] = useState(DEFAULT_MINTED);
  const [claim, setClaim] = useState(DEFAULT_CLAIM);
  const { edition, floorApplied } = effectiveEdition(minted, claim);
  const cents = rateCents(H, edition) ?? 0;
  const tie = isRateHalfCentTie(H, edition);
  const rate = formatNumber(locale, cents / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let note: string;
  if (minted >= EDITION_FLOOR_THRESHOLD) {
    note = t(locale, "network.tdh.how.rate.thresholdNote");
  } else if (floorApplied) {
    note = t(locale, "network.tdh.how.rate.floorNote");
  } else {
    note = t(locale, "network.tdh.how.rate.noFloorNote");
  }

  const label = (key: "minted" | "claim") =>
    t(locale, `network.tdh.how.rate.${key}`);

  return (
    <ExplorableFrame
      locale={locale}
      title={t(locale, "network.tdh.how.rate.title")}
      onReset={() => {
        setMinted(DEFAULT_MINTED);
        setClaim(DEFAULT_CLAIM);
      }}
    >
      <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <IntegerField
          label={label("minted")}
          value={minted}
          min={1}
          max={5_000}
          onChange={setMinted}
          increaseLabel={t(locale, "network.tdh.shared.increase", {
            name: label("minted"),
          })}
          decreaseLabel={t(locale, "network.tdh.shared.decrease", {
            name: label("minted"),
          })}
        />
        <IntegerField
          label={label("claim")}
          value={claim}
          min={0}
          max={400}
          onChange={setClaim}
          increaseLabel={t(locale, "network.tdh.shared.increase", {
            name: label("claim"),
          })}
          decreaseLabel={t(locale, "network.tdh.shared.decrease", {
            name: label("claim"),
          })}
        />
      </div>
      <output aria-live="polite" className="tw-mt-4 tw-block">
        <dl className="tw-m-0 tw-grid tw-grid-cols-3 tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-center">
          <div className="tw-flex tw-flex-col tw-justify-between">
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, "network.tdh.how.rate.edition")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {formatInteger(locale, edition)}
            </dd>
          </div>
          <div className="tw-flex tw-flex-col tw-justify-between">
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, "network.tdh.how.rate.exact")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {formatNumber(locale, H / edition, { maximumFractionDigits: 4 })}
            </dd>
          </div>
          <div className="tw-flex tw-flex-col tw-justify-between">
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, "network.tdh.how.rate.rounded")}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-primary-300">
              {rate}
            </dd>
          </div>
        </dl>
        <span className="tw-mt-2 tw-block tw-min-h-[3rem] tw-text-sm tw-leading-6 tw-text-iron-300">
          {note} {tie && t(locale, "network.tdh.how.rate.tieNote")}
        </span>
        <span className="tw-sr-only">
          {t(locale, "network.tdh.how.rate.result", {
            edition: formatInteger(locale, edition),
            rate,
          })}
        </span>
      </output>
    </ExplorableFrame>
  );
}
