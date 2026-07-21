"use client";

import Link from "next/link";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import {
  formatDistributionRelativeTime,
  getDistributionCollectionLabel,
  getDistributionTokenLinkLabel,
} from "./distributions.messages";
import type { DistributionTableItem } from "./distributions.types";
import { useEffect, useState } from "react";

export default function UserPageStatsActivityDistributionsTableItem({
  item,
  formatNumber,
  locale = DEFAULT_LOCALE,
}: {
  readonly item: DistributionTableItem;
  readonly formatNumber: (value: number) => string;
  readonly locale?: SupportedLocale | undefined;
}) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  useEffect(() => {
    setTimeAgo(formatDistributionRelativeTime(item.date, Date.now(), locale));
  }, [item.date, locale]);

  const collectionLabel = getDistributionCollectionLabel(
    item.collection,
    locale
  );

  return (
    <tr>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-base lg:tw-pr-4">
        {collectionLabel}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-right tw-text-sm tw-font-medium sm:tw-px-6 sm:tw-text-base lg:tw-pl-4">
        <Link
          aria-label={getDistributionTokenLinkLabel({
            collection: item.collection,
            tokenId: item.tokenId,
            locale,
          })}
          className="tw-text-iron-50 tw-no-underline hover:tw-underline"
          href={`${getCollectionPath(item.collection)}/${item.tokenId}`}
        >
          # {item.tokenId}
        </Link>
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-sm tw-font-medium tw-text-iron-50 sm:tw-px-6 sm:tw-text-base lg:tw-pl-4">
        {item.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-px-6 sm:tw-text-base lg:tw-pl-4">
        {item.wallet}
      </td>
      {item.phases.map((phase) => (
        <td
          key={`${item.collection}-${item.tokenId}-${item.wallet}-phase-${phase.phase}`}
          className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-right tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-px-6 sm:tw-text-base lg:tw-pl-4"
        >
          {formatNumber(phase.amount)}
        </td>
      ))}
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-right tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-px-6 sm:tw-text-base lg:tw-pl-4">
        {formatNumber(item.amountMinted)}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-right tw-text-sm tw-font-normal tw-text-iron-400 sm:tw-px-6 sm:tw-text-base lg:tw-pl-4">
        {formatNumber(item.amountTotal)}
      </td>
      <td className="tw-whitespace-nowrap tw-px-4 tw-py-3.5 tw-text-right tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-px-6 sm:tw-text-base lg:tw-pl-4">
        {timeAgo}
      </td>
    </tr>
  );
}

function getCollectionPath(collection: DistributionTableItem["collection"]) {
  const COLLECTION_TO_PATH: Record<
    DistributionTableItem["collection"],
    string
  > = {
    MEMES: "/the-memes",
    GRADIENTS: "/6529-gradient",
    MEMELAB: "/meme-lab",
  };

  return COLLECTION_TO_PATH[collection];
}
