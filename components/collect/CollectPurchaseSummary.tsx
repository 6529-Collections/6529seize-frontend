"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import { getAddress } from "viem";
import type { CollectPurchaseReviewView } from "./collect.types";
import {
  formatCollectNetworkFeeCap,
  formatCollectReviewWei,
} from "./collect-review-amounts";
import CollectReviewWallet from "./CollectReviewWallet";

function AmountRow({
  label,
  children,
  prominent = false,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly prominent?: boolean;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
      <dt
        className={
          prominent
            ? "tw-text-sm tw-font-medium tw-text-iron-100"
            : "tw-text-sm tw-text-iron-400"
        }
      >
        {label}
      </dt>
      <dd
        className={`tw-m-0 tw-min-w-0 tw-max-w-full tw-text-right tw-font-medium tw-tabular-nums tw-text-iron-100 [overflow-wrap:anywhere] ${prominent ? "tw-text-xl" : "tw-text-sm"}`}
      >
        {children}
      </dd>
    </div>
  );
}

export default function CollectPurchaseSummary({
  purchase,
  title,
  media,
}: {
  readonly purchase: CollectPurchaseReviewView;
  readonly title: string;
  readonly media?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const amount = (wei: string, currency = purchase.currency) =>
    `${formatCollectReviewWei(locale, wei)} ${currency}`;
  const cap = (wei: string) =>
    t(locale, "collect.review.upTo", {
      amount: `${formatCollectNetworkFeeCap(locale, wei)} ETH`,
    });
  const { amounts } = purchase;
  let totalNote = t(locale, "collect.review.gasUnknownNote");
  if (purchase.currency === "WETH")
    totalNote = t(locale, "collect.review.separateCurrencies");
  if (amounts.maximumTotalWei !== null)
    totalNote = t(locale, "collect.review.maximumNote");
  const sameWallet =
    purchase.payerAddress.toLowerCase() ===
    purchase.recipientAddress.toLowerCase();
  const walletDetail = t(
    locale,
    purchase.recipientInProfile
      ? "collect.review.profileWallet"
      : "collect.review.otherRecipient"
  );
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
          <h2 className="tw-m-0 tw-break-words tw-text-base tw-font-semibold tw-text-iron-100">
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
      <div className="tw-space-y-3">
        <CollectReviewWallet
          label={t(
            locale,
            sameWallet ? "collect.review.sameWallet" : "collect.review.payWith"
          )}
          address={purchase.payerAddress}
          name={purchase.payerName}
          detail={sameWallet ? walletDetail : undefined}
        />
        {!sameWallet && (
          <CollectReviewWallet
            label={t(locale, "collect.review.deliverTo")}
            address={purchase.recipientAddress}
            name={purchase.recipientName}
            detail={walletDetail}
          />
        )}
      </div>
      <div className="tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
        <dl className="tw-m-0">
          <AmountRow
            prominent={amounts.maximumTotalWei === null}
            label={t(locale, "collect.review.price")}
          >
            {amount(amounts.purchaseWei)}
          </AmountRow>
        </dl>
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {t(locale, "collect.review.includedFees", {
            amount: amount(amounts.feesWei),
          })}
        </p>
        <dl className="tw-m-0">
          <AmountRow label={t(locale, "collect.review.networkCap")}>
            {amounts.networkFeeCapWei === null
              ? t(locale, "collect.review.gasUnknown")
              : cap(amounts.networkFeeCapWei)}
          </AmountRow>
        </dl>
      </div>
      <div className="tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
        {amounts.maximumTotalWei !== null && (
          <dl className="tw-m-0">
            <AmountRow prominent label={t(locale, "collect.review.maximum")}>
              {cap(amounts.maximumTotalWei)}
            </AmountRow>
          </dl>
        )}
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {totalNote}
        </p>
      </div>
      <details>
        <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-py-3 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.trade.details")}
        </summary>
        <div className="tw-space-y-5 tw-py-3">
          <section className="tw-space-y-3">
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "collect.review.priceDetails")}
            </h3>
            <dl className="tw-m-0 tw-space-y-3">
              <AmountRow label={t(locale, "collect.trade.sellerReceives")}>
                {amount(purchase.netWei)}
              </AmountRow>
              {purchase.fees.map((fee, index) => (
                <AmountRow
                  key={`${fee.recipient}:${index}`}
                  label={t(locale, "collect.review.fee")}
                >
                  <span>{amount(fee.amountWei)}</span>
                  <span className="tw-mt-1 tw-block tw-font-mono tw-text-xs tw-font-normal tw-text-iron-400">
                    {t(locale, "collect.review.feeTo", {
                      address: getAddress(fee.recipient),
                    })}
                  </span>
                </AmountRow>
              ))}
              {amounts.networkFeeCapWei !== null && (
                <AmountRow label={t(locale, "collect.review.exactGas")}>
                  {amount(amounts.networkFeeCapWei, "ETH")}
                </AmountRow>
              )}
              {purchase.approvalFeeCaps.map((approval) => (
                <AmountRow key={approval.label} label={approval.label}>
                  {approval.amountWei === null
                    ? t(locale, "collect.review.gasUnknown")
                    : amount(approval.amountWei, "ETH")}
                </AmountRow>
              ))}
              {amounts.maximumTotalWei !== null && (
                <AmountRow label={t(locale, "collect.review.exactMaximum")}>
                  {amount(amounts.maximumTotalWei, "ETH")}
                </AmountRow>
              )}
            </dl>
            {amounts.networkFeeCapWei !== null && (
              <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                {t(locale, "collect.review.exactNote")}
              </p>
            )}
          </section>
          <section className="tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "collect.review.contractDetails")}
            </h3>
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
          </section>
        </div>
      </details>
    </section>
  );
}
