"use client";

import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import { ApiMarketBatchOperationKindEnum } from "@/generated/models/ApiMarketBatchOperation";

import Button from "@/components/utils/button/Button";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { collectAssetIdentity } from "./collect.adapters";
import {
  collectReceiptArtworkHref,
  collectReceiptHeading,
  collectReceiptTransactionHref,
  hasCollectKnownSubmission,
  type CollectReceiptArtwork,
  type CollectReceiptOperation,
} from "./collect-receipt.helpers";
import CollectReceiptDetails from "./CollectReceiptDetails";
import {
  CollectReviewAmountRow as AmountRow,
  CollectReviewDisclosure,
  CollectReviewMoney as Money,
} from "./CollectReviewPrimitives";
import CollectReviewWallet from "./CollectReviewWallet";
import CollectSubmittedNotice from "./CollectSubmittedNotice";
import { MARKET_ZERO } from "./market-validation";
import { claimMarketCelebration } from "./market-activity-store";
import { useCollectReceiptMetadata } from "./useCollectReceiptMetadata";

interface CollectTransactionReceiptProps {
  readonly operation: CollectReceiptOperation;
  readonly artworks: readonly CollectReceiptArtwork[];
  readonly walletNames?: Readonly<Record<string, string>> | undefined;
  readonly spacious?: boolean;
  readonly knownTransactionHash?: string | undefined;
  readonly onClose: () => void;
}

function ReceiptArtwork({
  artwork,
  delivered,
  names,
  showRecipients = true,
}: {
  readonly artwork: CollectReceiptArtwork;
  readonly delivered: boolean;
  readonly names: Readonly<Record<string, string>> | undefined;
  readonly showRecipients?: boolean;
}) {
  const locale = useBrowserLocale();
  const identity = collectAssetIdentity(artwork.assetKey);
  const href = collectReceiptArtworkHref(artwork.assetKey);
  const collection = identity
    ? t(locale, `collect.collection.${identity.family}`)
    : "";
  const title =
    artwork.title ||
    (identity
      ? `${collection} #${identity.tokenId}`
      : t(locale, "collect.trade.asset"));
  return (
    <li className="tw-min-w-0 tw-space-y-3">
      <div className="tw-relative tw-flex tw-aspect-square tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
        {artwork.media ?? (
          <span className="tw-p-4 tw-text-center tw-text-xs tw-text-iron-400">
            {t(locale, "collect.art.unavailable")}
          </span>
        )}
      </div>
      <div className="tw-space-y-1">
        <h3 className="tw-m-0 tw-break-words tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
          {href ? (
            <Link
              href={href}
              className="tw-rounded-sm tw-text-inherit tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {identity && `${collection} #${identity.tokenId} · `}
          <span className="tw-inline-block">
            {t(locale, "collect.receipt.quantity", {
              quantity: formatDecimalString(locale, artwork.quantity),
            })}
          </span>
        </p>
      </div>
      {showRecipients &&
        artwork.recipients.map((recipient) => (
          <CollectReviewWallet
            key={`${recipient.address}:${recipient.quantity}`}
            label={t(
              locale,
              delivered
                ? "collect.receipt.deliveredQuantity"
                : "collect.receipt.deliveryQuantity",
              { quantity: formatDecimalString(locale, recipient.quantity) }
            )}
            address={recipient.address}
            name={names?.[recipient.address.toLowerCase()]}
          />
        ))}
    </li>
  );
}

interface ReceiptState {
  readonly pending: boolean;
  readonly live: boolean;
  readonly confirmed: boolean;
  readonly offering: boolean;
  readonly sale: boolean;
  readonly cancel: boolean;
}
function receiptState(
  operation: CollectReceiptOperation,
  knownHash?: string
): ReceiptState {
  const status = operation.state.toString();
  return {
    pending:
      ["SUBMITTED", "MINED"].includes(status) ||
      hasCollectKnownSubmission(operation, knownHash),
    live: status === "LIVE",
    confirmed: status === "CONFIRMED",
    offering: operation.kind === ApiMarketKind.Offer,
    sale:
      operation.kind === ApiMarketKind.Accept ||
      operation.kind === ApiMarketKind.List,
    cancel: operation.kind === ApiMarketKind.Cancel || status === "CANCELLED",
  };
}
interface ReceiptSectionProps extends CollectTransactionReceiptProps {
  readonly state: ReceiptState;
}
function receiptStatusLabel(state: ReceiptState) {
  if (state.pending) return "collect.receipt.waiting";
  if (state.live)
    return state.offering
      ? "collect.receipt.offerPublished"
      : "collect.receipt.published";
  return "collect.receipt.confirmed";
}
function ReceiptHeader({
  operation,
  state,
  knownTransactionHash,
}: Pick<ReceiptSectionProps, "operation" | "state" | "knownTransactionHash">) {
  const locale = useBrowserLocale();
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmationMark = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [operation.id]);
  useEffect(() => {
    const mark = confirmationMark.current;
    if (
      !mark ||
      state.pending ||
      state.cancel ||
      (operation.kind === ApiMarketKind.List && !state.live)
    )
      return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (!claimMarketCelebration(operation.profile_id, operation.id)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (typeof mark.animate !== "function") return;
      mark.animate(
        [
          { opacity: 0.3, transform: "scale(0.85)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        { duration: 400, easing: "ease-out" }
      );
    });
    observer.observe(mark);
    return () => observer.disconnect();
  }, [
    operation.profile_id,
    operation.id,
    operation.kind,
    state.pending,
    state.live,
    state.cancel,
  ]);
  return (
    <header className="tw-space-y-3">
      <output className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-300">
        <span ref={confirmationMark} className="tw-inline-flex">
          {state.pending ? (
            <ClockIcon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
          ) : (
            <CheckIcon
              aria-hidden="true"
              className="tw-size-4 tw-shrink-0 tw-text-success"
            />
          )}
        </span>
        {t(locale, receiptStatusLabel(state))}
      </output>
      <h2
        ref={heading}
        tabIndex={-1}
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight focus:tw-outline-none sm:tw-text-3xl"
      >
        {t(locale, collectReceiptHeading(operation, knownTransactionHash))}
      </h2>
      {operation.state.toString() === "MINED" && (
        <p className="tw-m-0 tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.receipt.included")}
        </p>
      )}
      {state.pending && <CollectSubmittedNotice />}
    </header>
  );
}
function uniformDelivery(artworks: readonly CollectReceiptArtwork[]) {
  const first = artworks.flatMap((artwork) => artwork.recipients)[0];
  if (!first) return undefined;
  return artworks.every((artwork) =>
    artwork.recipients.every(
      (recipient) =>
        recipient.address.toLowerCase() === first.address.toLowerCase()
    )
  )
    ? first
    : undefined;
}
function ReceiptArtworks({
  artworks,
  walletNames,
  spacious,
  state,
}: Pick<
  ReceiptSectionProps,
  "artworks" | "walletNames" | "spacious" | "state"
>) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-min-w-0 tw-space-y-5">
      <ul
        className={`tw-m-0 tw-grid tw-min-w-0 tw-list-none tw-gap-5 tw-p-0 ${spacious && artworks.length > 1 ? "tw-grid-cols-2" : ""}`}
      >
        {artworks.map((artwork) => (
          <ReceiptArtwork
            key={`${artwork.assetKey}:${artwork.orderHash ?? ""}`}
            artwork={artwork}
            names={walletNames}
            delivered={state.confirmed && !state.cancel}
            showRecipients={!spacious}
          />
        ))}
      </ul>
      {spacious && !uniformDelivery(artworks) && (
        <CollectReviewDisclosure
          label={t(locale, "collect.receipt.deliveryDetails")}
        >
          {artworks.map((artwork) => (
            <div
              key={`${artwork.assetKey}:${artwork.orderHash ?? ""}`}
              className="tw-space-y-1"
            >
              <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
                {artwork.title || t(locale, "collect.trade.asset")}
              </p>
              {artwork.recipients.map((recipient) => (
                <CollectReviewWallet
                  key={`${recipient.address}:${recipient.quantity}`}
                  label={t(
                    locale,
                    state.confirmed
                      ? "collect.receipt.deliveredQuantity"
                      : "collect.receipt.deliveryQuantity",
                    {
                      quantity: formatDecimalString(locale, recipient.quantity),
                    }
                  )}
                  address={recipient.address}
                  name={walletNames?.[recipient.address.toLowerCase()]}
                />
              ))}
            </div>
          ))}
        </CollectReviewDisclosure>
      )}
    </div>
  );
}
function networkCost(operation: CollectReceiptOperation) {
  const fees =
    operation.receipt?.transactions
      .filter(
        (transaction) =>
          transaction.payer_wallet.toLowerCase() ===
          operation.wallet.toLowerCase()
      )
      .flatMap((transaction) =>
        transaction.network_fee_wei === undefined
          ? []
          : [transaction.network_fee_wei]
      ) ?? [];
  return fees.length > 0
    ? fees.reduce((sum, fee) => sum + BigInt(fee), 0n).toString()
    : null;
}
function receiptTransactionHash(
  operation: CollectReceiptOperation,
  knownHash?: string
) {
  return (
    operation.transaction_hash ??
    operation.settlement?.transaction_hash ??
    knownHash
  );
}
function paymentUnavailable(
  operation: CollectReceiptOperation,
  state: ReceiptState,
  knownHash?: string
) {
  return (
    state.confirmed &&
    operation.kind === ApiMarketKind.List &&
    !collectReceiptTransactionHref(receiptTransactionHash(operation, knownHash))
  );
}
function receiptPriceLabel(
  operation: CollectReceiptOperation,
  state: ReceiptState
) {
  if (state.pending) return "collect.receipt.submittedAmount";
  if (state.live) {
    if (state.offering) return "collect.receipt.offerPrice";
    if (partialListing(operation))
      return "collect.receipt.originalListingTotal";
    return operation.kind === ApiMarketKind.List &&
      BigInt(operation.quantity) > 1n
      ? "collect.receipt.listingTotal"
      : "collect.receipt.listingPrice";
  }
  return state.sale
    ? "collect.receipt.proceeds"
    : "collect.receipt.purchasePaid";
}
function partialListing(operation: CollectReceiptOperation) {
  return (
    operation.kind === ApiMarketKind.List &&
    BigInt(operation.settlement?.filled_quantity ?? "0") > 0n
  );
}
function ListingPrice({
  operation,
}: {
  readonly operation: CollectReceiptOperation;
}) {
  const locale = useBrowserLocale();
  if (operation.kind !== ApiMarketKind.List) return null;
  const quantity = BigInt(operation.quantity);
  const total = BigInt(operation.total_wei);
  const currency =
    operation.currency.toLowerCase() === MARKET_ZERO ? "ETH" : "WETH";
  return (
    <>
      {quantity > 1n && total % quantity === 0n && (
        <AmountRow label={t(locale, "collect.receipt.unitPrice")}>
          <Money
            wei={(total / quantity).toString()}
            currency={currency}
            compact
          />
        </AmountRow>
      )}
      <AmountRow
        label={t(
          locale,
          partialListing(operation)
            ? "collect.receipt.originalProceedsIfSold"
            : "collect.receipt.proceedsIfSold"
        )}
      >
        <Money wei={operation.net_wei} currency={currency} compact />
      </AmountRow>
    </>
  );
}
function ReceiptAmounts({
  operation,
  state,
  knownTransactionHash,
}: Pick<ReceiptSectionProps, "operation" | "state" | "knownTransactionHash">) {
  const locale = useBrowserLocale();
  const payment = operation.receipt?.payment;
  const paymentValue = state.sale ? payment?.net_wei : payment?.total_wei;
  const priceValue =
    state.live || state.pending ? operation.total_wei : paymentValue;
  const priceCurrency =
    state.live || state.pending
      ? operation.currency
      : (payment?.currency ?? operation.currency);
  const currency = priceCurrency.toLowerCase() === MARKET_ZERO ? "ETH" : "WETH";
  const recordedFee = networkCost(operation);
  const unavailable = paymentUnavailable(
    operation,
    state,
    knownTransactionHash
  );
  return (
    <>
      <dl className="tw-m-0 tw-space-y-4">
        {!state.cancel && (
          <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
            <dt className="tw-text-sm tw-font-medium tw-text-iron-100">
              {t(locale, receiptPriceLabel(operation, state))}
            </dt>
            <dd className="tw-m-0 tw-min-w-0 tw-max-w-full tw-text-right tw-text-2xl tw-font-medium tw-leading-tight tw-tracking-tight [overflow-wrap:anywhere]">
              {priceValue === undefined ? (
                <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                  {t(
                    locale,
                    unavailable
                      ? "collect.receipt.notRecorded"
                      : "collect.receipt.costUnavailable"
                  )}
                </span>
              ) : (
                <Money wei={priceValue} currency={currency} compact />
              )}
            </dd>
          </div>
        )}
        {state.live && <ListingPrice operation={operation} />}
        {recordedFee !== null && (
          <AmountRow label={t(locale, "collect.receipt.recordedNetworkFee")}>
            <Money wei={recordedFee} currency="ETH" compact />
          </AmountRow>
        )}
      </dl>
      {!state.pending && !state.live && !state.cancel && !payment && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(
            locale,
            unavailable
              ? "collect.receipt.paymentUnavailable"
              : "collect.receipt.paymentPending"
          )}
        </p>
      )}
      {state.confirmed &&
        recordedFee === null &&
        operation.kind !== ApiMarketKind.List && (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.receipt.costPending")}
          </p>
        )}
    </>
  );
}
function walletLabel(state: ReceiptState) {
  if (state.sale)
    return state.live
      ? "collect.receipt.listedFrom"
      : "collect.receipt.proceedsTo";
  if (state.cancel) return "collect.receipt.signedBy";
  return state.pending || state.live
    ? "collect.review.payWith"
    : "collect.receipt.paidWith";
}
function ReceiptWallets({
  operation,
  state,
  artworks,
  walletNames,
  spacious,
}: Pick<
  ReceiptSectionProps,
  "operation" | "state" | "artworks" | "walletNames" | "spacious"
>) {
  const locale = useBrowserLocale();
  const address = state.sale
    ? (operation.receipt?.payment?.payout_wallet ?? operation.wallet)
    : operation.wallet;
  const recipient = uniformDelivery(artworks);
  return (
    <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-2">
      <CollectReviewWallet
        label={t(locale, walletLabel(state))}
        address={address}
        name={walletNames?.[address.toLowerCase()]}
      />
      {spacious && recipient && (
        <CollectReviewWallet
          label={t(
            locale,
            state.confirmed
              ? "collect.receipt.deliveredTo"
              : "collect.review.deliverTo"
          )}
          address={recipient.address}
          name={walletNames?.[recipient.address.toLowerCase()]}
        />
      )}
    </div>
  );
}
function ListingTerms({
  operation,
  state,
}: Pick<ReceiptSectionProps, "operation" | "state">) {
  const locale = useBrowserLocale();
  if (!state.live) return null;
  const listing =
    operation.kind !== ApiMarketBatchOperationKindEnum.BuyBatch
      ? operation
      : undefined;
  let conditionalLabel:
    | "collect.receipt.offerConditional"
    | "collect.receipt.listingConditional"
    | "collect.receipt.originalListingConditional" =
    "collect.receipt.listingConditional";
  if (state.offering) conditionalLabel = "collect.receipt.offerConditional";
  else if (partialListing(operation))
    conditionalLabel = "collect.receipt.originalListingConditional";
  return (
    <>
      {listing?.order && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.receipt.expires", {
            date: formatDate(
              locale,
              Number(listing.order.components.end_time) * 1000,
              { dateStyle: "medium", timeStyle: "short" }
            ),
          })}
        </p>
      )}
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, conditionalLabel)}
      </p>
      {listing?.settlement &&
        BigInt(listing.settlement.filled_quantity) > 0n && (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
            {t(locale, "collect.receipt.soldQuantity", {
              quantity: formatDecimalString(
                locale,
                listing.settlement.filled_quantity
              ),
            })}{" "}
            ·{" "}
            {t(locale, "collect.receipt.remaining", {
              quantity: formatDecimalString(
                locale,
                listing.settlement.remaining_quantity
              ),
            })}
          </p>
        )}
    </>
  );
}
function ReceiptActions({
  operation,
  state,
  artworks,
  spacious,
  knownTransactionHash,
  onClose,
}: Pick<
  ReceiptSectionProps,
  | "operation"
  | "state"
  | "artworks"
  | "spacious"
  | "knownTransactionHash"
  | "onClose"
>) {
  const locale = useBrowserLocale();
  const transactionHref = collectReceiptTransactionHref(
    receiptTransactionHash(operation, knownTransactionHash)
  );
  const singleArtwork = artworks.length === 1 ? artworks[0] : undefined;
  const artworkHref = singleArtwork
    ? collectReceiptArtworkHref(singleArtwork.assetKey)
    : null;
  const orderHash =
    operation.kind !== ApiMarketBatchOperationKindEnum.BuyBatch
      ? (operation.order_hash ?? operation.order?.order_hash ?? "")
      : "";
  return (
    <div className="tw-space-y-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
      <Button variant="action" size="lg" fullWidth onClick={onClose}>
        {t(locale, spacious ? "collect.receipt.back" : "collect.receipt.done")}
      </Button>
      <Link
        href={`/collect/orders?operation=${encodeURIComponent(operation.id)}&kind=${operation.kind}`}
        className={getButtonClasses({
          variant: "secondary",
          size: "md",
          fullWidth: true,
          className: "tw-no-underline",
        })}
      >
        {t(locale, "collect.receipt.viewOrders")}
      </Link>
      {artworkHref && state.live && (
        <Link
          href={`${artworkHref}?focus=listings-and-offers&order=${encodeURIComponent(orderHash)}`}
          className="tw-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-sm tw-text-[13px] tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "collect.receipt.viewListing")}
        </Link>
      )}
      {transactionHref && (
        <a
          href={transactionHref}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-sm tw-text-[13px] tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "collect.receipt.transaction")}
          <ArrowTopRightOnSquareIcon
            aria-hidden="true"
            className="tw-size-3.5"
          />
        </a>
      )}
    </div>
  );
}
/** Immutable operation terms and confirmed execution evidence; never a refreshed listing quote. */
export default function CollectTransactionReceipt(
  props: CollectTransactionReceiptProps
) {
  const locale = useBrowserLocale();
  const artworks = useCollectReceiptMetadata(props.artworks);
  const state = receiptState(props.operation, props.knownTransactionHash);
  const sections = { ...props, artworks, state };
  return (
    <section
      aria-label={t(
        locale,
        collectReceiptHeading(props.operation, props.knownTransactionHash)
      )}
      className={`tw-min-w-0 tw-space-y-7 tw-text-iron-100 ${props.spacious ? "tw-pb-8" : ""}`}
    >
      <ReceiptHeader {...sections} />
      <div
        className={
          props.spacious
            ? "tw-grid tw-min-w-0 tw-items-start tw-gap-8 lg:tw-grid-cols-[minmax(0,1fr)_340px] lg:tw-gap-12"
            : "tw-space-y-6"
        }
      >
        <ReceiptArtworks {...sections} />
        <div
          className={`tw-min-w-0 tw-space-y-5 ${props.spacious ? "tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.02] tw-p-5 sm:tw-p-6" : ""}`}
        >
          <ReceiptAmounts {...sections} />
          <ReceiptWallets {...sections} />
          <ListingTerms {...sections} />
          <ReceiptActions {...sections} />
        </div>
      </div>
      <CollectReceiptDetails operation={props.operation} />
    </section>
  );
}
