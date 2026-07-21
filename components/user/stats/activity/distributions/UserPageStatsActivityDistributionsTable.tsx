"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import type { Distribution } from "@/entities/IDistribution";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useMemo } from "react";
import {
  getDistributionPhaseLabel,
  getDistributionsMessage,
} from "./distributions.messages";
import {
  DistributionCollection,
  type DistributionTableItem,
} from "./distributions.types";
import UserPageStatsActivityDistributionsTableItem from "./UserPageStatsActivityDistributionsTableItem";

function getAvailablePhases(items: Distribution[]): string[] {
  const phases: Set<string> = new Set();
  for (const item of items) {
    for (const phase of item.phases) {
      phases.add(phase);
    }
  }
  return Array.from(phases);
}

function getCollectionEnum(contract: string): DistributionCollection {
  if (areEqualAddresses(contract, MEMES_CONTRACT)) {
    return DistributionCollection.MEMES;
  }
  if (areEqualAddresses(contract, GRADIENT_CONTRACT)) {
    return DistributionCollection.GRADIENTS;
  }

  if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
    return DistributionCollection.MEMELAB;
  }
  throw new Error(`Unknown contract ${contract}`);
}

function getItemPhaseAmount({
  phase,
  item,
}: {
  readonly phase: string;
  readonly item: Distribution;
}): number {
  if (phase.toUpperCase() === "AIRDROP") {
    return item.airdrops ?? 0;
  }

  const allowlistPhase = item.allowlist.find(
    (allowlistItem) => allowlistItem.phase === phase
  );
  return allowlistPhase?.spots ?? 0;
}

export default function UserPageStatsActivityDistributionsTable({
  items,
  profile,
  loading,
  locale = DEFAULT_LOCALE,
}: {
  readonly items: Distribution[];
  readonly profile: ApiIdentity;
  readonly loading: boolean;
  readonly locale?: SupportedLocale | undefined;
}) {
  const availablePhases = useMemo(() => getAvailablePhases(items), [items]);
  const results = useMemo<DistributionTableItem[]>(
    () =>
      items.map((item) => ({
        collection: getCollectionEnum(item.contract),
        tokenId: item.card_id,
        name: item.card_name,
        wallet:
          profile.wallets?.find(
            (w) => w.wallet.toLowerCase() === item.wallet.toLowerCase()
          )?.display ??
          item.wallet_display ??
          item.wallet,
        phases: availablePhases.map((phase) => ({
          phase,
          amount: getItemPhaseAmount({ phase, item }),
        })),
        amountMinted: item.minted,
        amountTotal: item.total_count,
        date: item.mint_date,
      })),
    [availablePhases, items, profile.wallets]
  );

  return (
    <table className="tw-min-w-full tw-divide-y tw-divide-white/[0.08]">
      <caption className="tw-sr-only">
        {getDistributionsMessage(
          "user.collected.stats.distributions.tableCaption",
          undefined,
          locale
        )}
      </caption>
      <thead className="tw-bg-white/[0.04]">
        <tr>
          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pr-4"
          >
            {getDistributionsMessage(
              "user.collected.stats.distributions.columns.collection",
              undefined,
              locale
            )}
          </th>
          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
          >
            {getDistributionsMessage(
              "user.collected.stats.distributions.columns.token",
              undefined,
              locale
            )}
          </th>
          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
          >
            {getDistributionsMessage(
              "user.collected.stats.distributions.columns.name",
              undefined,
              locale
            )}
          </th>

          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
          >
            {getDistributionsMessage(
              "user.collected.stats.distributions.columns.wallet",
              undefined,
              locale
            )}
          </th>
          {availablePhases.map((phase) => (
            <th
              key={phase}
              scope="col"
              className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
            >
              {getDistributionPhaseLabel(phase, locale)}
            </th>
          ))}
          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
          >
            {getDistributionsMessage(
              "user.collected.stats.distributions.columns.minted",
              undefined,
              locale
            )}
          </th>
          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
          >
            {getDistributionsMessage(
              "user.collected.stats.distributions.columns.total",
              undefined,
              locale
            )}
          </th>
          <th
            scope="col"
            className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md lg:tw-pl-4"
          >
            {loading ? (
              <div>
                <span className="tw-sr-only">
                  {getDistributionsMessage(
                    "user.collected.stats.distributions.loading",
                    undefined,
                    locale
                  )}
                </span>
                <CircleLoader />
              </div>
            ) : null}
          </th>
        </tr>
      </thead>
      <tbody className="tw-divide-y tw-divide-white/[0.06]">
        {results.map((item) => (
          <UserPageStatsActivityDistributionsTableItem
            key={`${item.collection}-${item.tokenId}-${item.wallet}`}
            item={item}
            formatNumber={(value) => formatInteger(locale, value)}
            locale={locale}
          />
        ))}
      </tbody>
    </table>
  );
}
