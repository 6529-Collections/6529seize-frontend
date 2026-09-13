"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import type { CollectPurchaseReviewView } from "./collect.types";
import { resolveCollectContractIdentity } from "./collect-contract-identity";
import CollectReviewContract from "./CollectReviewContract";
import {
  CollectReviewAmountRow as AmountRow,
  CollectReviewDisclosure,
  CollectReviewMoney as Money,
} from "./CollectReviewPrimitives";
import CollectReviewWallet from "./CollectReviewWallet";

export default function CollectPurchaseSummary({
  purchase,
  title,
  media,
  actionSlot,
}: {
  readonly purchase: CollectPurchaseReviewView;
  readonly title: string;
  readonly media?: ReactNode;
  readonly actionSlot?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const { amounts } = purchase;
  const maximum = purchase.currency === "ETH" ? amounts.maximumTotalWei : null;
  let totalNote = t(locale, "collect.review.gasUnknownNote");
  if (purchase.currency === "WETH")
    totalNote = t(locale, "collect.review.separateCurrencies");
  if (maximum !== null) totalNote = t(locale, "collect.review.maximumNote");
  const feeRecipients = [
    ...new Set(purchase.fees.map((fee) => fee.recipient.toLowerCase())),
  ];
  return (
    <section
      aria-label={t(locale, "collect.review.summary")}
      className="tw-min-w-0 tw-space-y-5"
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        {media !== undefined && media !== null && (
          <div className="tw-relative tw-flex tw-size-16 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
            {media}
          </div>
        )}
        <div className="tw-min-w-0 tw-space-y-1">
          <h2 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-snug tw-tracking-tight tw-text-iron-100">
            {title}
          </h2>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {purchase.artworkLabel} ·{" "}
            {t(locale, "collect.review.copies", {
              quantity: purchase.quantity,
            })}
          </p>
        </div>
      </div>
      <dl className="tw-m-0 tw-space-y-3">
        <AmountRow
          label={t(locale, "collect.review.price")}
          prominent={maximum === null}
        >
          <Money wei={amounts.purchaseWei} currency={purchase.currency} />
        </AmountRow>
        <AmountRow label={t(locale, "collect.review.networkCap")}>
          {amounts.networkFeeCapWei === null ? (
            t(locale, "collect.review.gasUnknown")
          ) : (
            <Money wei={amounts.networkFeeCapWei} currency="ETH" cap />
          )}
        </AmountRow>
      </dl>
      <div>
        <CollectReviewWallet
          label={t(locale, "collect.review.payWith")}
          address={purchase.payerAddress}
          name={purchase.payerName}
        />
        <CollectReviewWallet
          label={t(locale, "collect.review.deliverTo")}
          address={purchase.recipientAddress}
          name={purchase.recipientName}
          detail={
            !purchase.recipientInProfile
              ? t(locale, "collect.review.otherRecipient")
              : undefined
          }
        />
      </div>
      <div className="tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
        {maximum !== null && (
          <dl className="tw-m-0">
            <AmountRow prominent label={t(locale, "collect.review.maximum")}>
              <Money wei={maximum} currency="ETH" cap capDecimals={5} />
            </AmountRow>
          </dl>
        )}
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {totalNote}
        </p>
      </div>
      {actionSlot}
      <div>
        <CollectReviewDisclosure
          label={t(locale, "collect.review.priceDetails")}
        >
          <dl className="tw-m-0 tw-space-y-3">
            <AmountRow label={t(locale, "collect.trade.sellerReceives")}>
              <Money wei={purchase.netWei} currency={purchase.currency} />
            </AmountRow>
            {purchase.fees.map((fee, index) => (
              <AmountRow
                key={`${fee.recipient}:${index}`}
                label={t(
                  locale,
                  resolveCollectContractIdentity(
                    purchase.chainId,
                    fee.recipient,
                    "fee"
                  ).name === "OpenSea"
                    ? "collect.review.openSeaFee"
                    : "collect.review.fee"
                )}
              >
                <Money wei={fee.amountWei} currency={purchase.currency} />
              </AmountRow>
            ))}
          </dl>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.review.feesIncluded")}
          </p>
          <CollectReviewDisclosure
            label={t(locale, "collect.review.exactAmounts")}
            nested
          >
            <dl className="tw-m-0 tw-space-y-3">
              {amounts.networkFeeCapWei !== null && (
                <AmountRow label={t(locale, "collect.review.exactGas")}>
                  <Money wei={amounts.networkFeeCapWei} currency="ETH" />
                </AmountRow>
              )}
              {purchase.approvalFeeCaps.map((approval) => (
                <AmountRow key={approval.label} label={approval.label}>
                  {approval.amountWei === null ? (
                    t(locale, "collect.review.gasUnknown")
                  ) : (
                    <Money wei={approval.amountWei} currency="ETH" />
                  )}
                </AmountRow>
              ))}
              {maximum !== null && (
                <AmountRow label={t(locale, "collect.review.exactMaximum")}>
                  <Money wei={maximum} currency="ETH" />
                </AmountRow>
              )}
            </dl>
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
              {t(locale, "collect.review.exactNote")}
            </p>
          </CollectReviewDisclosure>
        </CollectReviewDisclosure>
        <CollectReviewDisclosure
          label={t(locale, "collect.review.contractDetails")}
        >
          {purchase.nftContract && (
            <CollectReviewContract
              chainId={purchase.chainId}
              address={purchase.nftContract}
              role="nft"
            />
          )}
          {purchase.exchangeContract && (
            <CollectReviewContract
              chainId={purchase.chainId}
              address={purchase.exchangeContract}
              role="exchange"
            />
          )}
          {feeRecipients.map((recipient) => (
            <CollectReviewContract
              key={recipient}
              chainId={purchase.chainId}
              address={recipient}
              role="fee"
            />
          ))}
          <dl className="tw-m-0 tw-space-y-3">
            {purchase.contractFacts.map((fact) => (
              <AmountRow key={fact.label} label={fact.label}>
                {fact.value}
              </AmountRow>
            ))}
          </dl>
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.review.liveCheck")}
          </p>
        </CollectReviewDisclosure>
      </div>
    </section>
  );
}
