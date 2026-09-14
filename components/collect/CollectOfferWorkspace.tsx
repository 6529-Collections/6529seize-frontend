"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { formatEther } from "viem";
import CollectTradeController from "./CollectTradeController";
import OfferPlanPanel from "./OfferPlanPanel";
import CollectAssetMedia from "./CollectAssetMedia";
import marketplaceFont from "./marketplace-font.module.css";
import { analyzeCollectOffers } from "./analyze-collect-offers";
import { collectProfileWallets } from "./collect-recipient.helpers";
import type {
  CollectOfferSelection,
  OfferPlanAcquisitionProps,
  OfferPlanReview,
} from "./collect-offer-plan.types";

interface Props extends OfferPlanAcquisitionProps {
  readonly items: readonly CollectOfferSelection[];
  readonly hasAlternatives?: boolean;
  readonly active: boolean;
  readonly onBack: () => void;
}

interface Commitment {
  readonly operation: ApiMarketOperation;
  readonly offer: ReviewedOffer;
  readonly published: boolean;
}
type ReviewedOffer = Omit<OfferPlanReview, "expiryHours"> & {
  readonly expiryHours: "24" | "168" | "720" | "custom";
};

const PENDING_PAGE_SIZE = 8;

export default function CollectOfferWorkspace(props: Props) {
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const scope = JSON.stringify([
    auth.connectedProfile?.id ?? "guest",
    connection.address?.toLowerCase() ?? "",
    collectProfileWallets(auth.connectedProfile)
      .map(({ wallet }) => wallet.toLowerCase())
      .sort((left, right) => left.localeCompare(right)),
  ]);
  return <OfferWorkspace key={scope} {...props} />;
}

function OfferWorkspace({
  items,
  hasAlternatives = false,
  active,
  onBack,
  initialMethod,
  strategySessionKey,
  blended,
  buyOptions,
  buyObservedAt,
  buyLockedAssetKeys,
  onReviewBuys,
}: Props) {
  const locale = useBrowserLocale();
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const workspace = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) workspace.current?.focus();
  }, [active]);
  const [review, setReview] = useState<{
    offer: ReviewedOffer;
    operation?: ApiMarketOperation;
  } | null>(null);
  const [commitments, setCommitments] = useState<readonly Commitment[]>([]);
  const [pendingPage, setPendingPage] = useState(0);
  const remember = (operation: ApiMarketOperation, published: boolean) => {
    if (!review) throw new Error("OFFER_REVIEW_MISSING");
    const offer = review.offer;
    setCommitments((current) => {
      const previous = current.find(
        (entry) => entry.operation.id === operation.id
      );
      const next: Commitment = {
        operation,
        offer: previous?.offer ?? offer,
        published: published || previous?.published === true,
      };
      return [
        ...current.filter((entry) => entry.operation.id !== operation.id),
        next,
      ];
    });
  };
  const reserve = (
    operation: ApiMarketOperation,
    expected: ApiMarketPrepareRequest
  ) => {
    if (
      expected.asset_key !== review?.offer.asset.asset_key ||
      expected.quantity !== review.offer.quantity ||
      expected.profile_id !== auth.connectedProfile?.id ||
      expected.wallet.toLowerCase() !== connection.address?.toLowerCase() ||
      operation.id.length === 0 ||
      operation.total_wei !== expected.amount_wei
    )
      throw new Error("OFFER_COMMITMENT_MISMATCH");
    remember(operation, false);
  };
  const pending = commitments.filter((entry) => !entry.published);
  const published = commitments.filter((entry) => entry.published);
  const lastPendingPage = Math.max(
    0,
    Math.ceil(pending.length / PENDING_PAGE_SIZE) - 1
  );
  const visiblePendingPage = Math.min(pendingPage, lastPendingPage);
  const reviewPending = (operationId: string) => {
    const entry = pending.find(({ operation }) => operation.id === operationId);
    if (entry) setReview({ offer: entry.offer, operation: entry.operation });
  };
  let disabledReason: string | undefined;
  if (auth.activeProfileProxy)
    disabledReason = t(locale, "collect.trade.proxyUnavailable");
  else if (!auth.isAuthenticated)
    disabledReason = t(locale, "collect.trade.connectSigner");
  return (
    <div
      ref={workspace}
      tabIndex={-1}
      role="region"
      aria-label={t(
        locale,
        blended === true ? "collect.blend.title" : "collect.offerPlan.title"
      )}
      className={`${marketplaceFont["surface"] ?? ""} tw-space-y-5 focus:tw-outline-none`}
    >
      <button
        type="button"
        onClick={onBack}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-text-iron-300 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <ArrowLeftIcon className="tw-size-4" aria-hidden="true" />
        {t(locale, "collect.offerWorkspace.back")}
      </button>
      {hasAlternatives && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.offerWorkspace.alternatives")}
        </p>
      )}
      {!auth.isAuthenticated && (
        <Button
          variant="secondary"
          onClick={() => {
            if (auth.connectedProfile) void auth.requestAuth();
            else connection.seizeConnect();
          }}
        >
          {t(locale, "collect.connect")}
        </Button>
      )}
      {pending.length > 0 && (
        <details className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-4">
          <summary className="tw-min-h-11 tw-cursor-pointer tw-rounded-md tw-py-3 tw-text-sm tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
            {t(locale, "collect.offerPlan.pending")} (
            {formatInteger(locale, pending.length)})
          </summary>
          <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/10 tw-p-0">
            {pending
              .slice(
                visiblePendingPage * PENDING_PAGE_SIZE,
                (visiblePendingPage + 1) * PENDING_PAGE_SIZE
              )
              .map(({ operation, offer }) => (
                <li
                  key={operation.id}
                  className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-py-3"
                >
                  {offer.asset.image_url && (
                    <div className="tw-relative tw-size-12 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-900">
                      <CollectAssetMedia
                        src={offer.asset.image_url}
                        name={offer.asset.name}
                      />
                    </div>
                  )}
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
                      {offer.asset.name}
                    </p>
                    <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-xs tw-tabular-nums tw-text-iron-400">
                      {t(locale, "collect.trade.quantity")}:{" "}
                      {formatDecimalString(locale, operation.quantity)} ·{" "}
                      {t(locale, "collect.offerPlan.weth", {
                        amount: formatDecimalString(
                          locale,
                          formatEther(BigInt(operation.total_wei))
                        ),
                      })}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="tw-min-h-11"
                    disabled={Boolean(disabledReason)}
                    onClick={() => reviewPending(operation.id)}
                  >
                    {t(locale, "collect.offerPlan.checkPending", {
                      token: operation.asset_key.split(":")[2] ?? "—",
                    })}
                  </Button>
                </li>
              ))}
          </ul>
          {lastPendingPage > 0 && (
            <nav
              aria-label={t(locale, "collect.offerPlan.pending")}
              className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-py-3"
            >
              <Button
                variant="tertiary"
                size="sm"
                className="tw-min-h-11"
                disabled={visiblePendingPage === 0}
                onClick={() => setPendingPage(visiblePendingPage - 1)}
              >
                {t(locale, "collect.offerPlan.previous")}
              </Button>
              <span className="tw-text-xs tw-text-iron-400">
                {t(locale, "collect.offerPlan.pageCount", {
                  current: formatInteger(locale, visiblePendingPage + 1),
                  total: formatInteger(locale, lastPendingPage + 1),
                })}
              </span>
              <Button
                variant="tertiary"
                size="sm"
                className="tw-min-h-11"
                disabled={visiblePendingPage === lastPendingPage}
                onClick={() => setPendingPage(visiblePendingPage + 1)}
              >
                {t(locale, "collect.offerPlan.next")}
              </Button>
            </nav>
          )}
        </details>
      )}
      <OfferPlanPanel
        items={items}
        initialMethod={initialMethod}
        strategySessionKey={strategySessionKey}
        blended={blended}
        buyOptions={buyOptions}
        buyObservedAt={buyObservedAt}
        buyLockedAssetKeys={buyLockedAssetKeys}
        onReviewBuys={onReviewBuys}
        profile={auth.connectedProfile}
        payingWallet={connection.address}
        disabledReason={disabledReason}
        analyze={analyzeCollectOffers}
        publishedOffers={published.map(({ operation }) => ({
          assetKey: operation.asset_key,
          amountWei: operation.total_wei,
        }))}
        pendingOffers={pending.map(({ operation }) => ({
          operationId: operation.id,
          assetKey: operation.asset_key,
          amountWei: operation.total_wei,
        }))}
        onReviewOffer={(offer) => {
          const expiryHours = (["24", "168", "720", "custom"] as const).find(
            (hours) => hours === offer.expiryHours
          );
          if (expiryHours) setReview({ offer: { ...offer, expiryHours } });
        }}
        onReviewPending={({ operationId }) => {
          reviewPending(operationId);
        }}
      />
      {review && (
        <CollectTradeController
          key={`${review.offer.asset.asset_key}:${review.operation?.id ?? "new"}`}
          asset={review.offer.asset}
          action="offer"
          initialQuantity={review.offer.quantity}
          fixedOfferQuantity={review.offer.quantity}
          initialUnitPriceEth={review.offer.unitPriceEth}
          initialExpiryHours={review.offer.expiryHours}
          {...(review.offer.expiryDateTime === undefined
            ? {}
            : { initialExpiryDateTime: review.offer.expiryDateTime })}
          {...(review.offer.maximumOfferAmountWei === undefined
            ? {}
            : {
                maximumOfferAmountWei: review.offer.maximumOfferAmountWei,
              })}
          {...(review.operation ? { initialOperation: review.operation } : {})}
          onCommitment={reserve}
          onPublished={(operation) => remember(operation, true)}
          onClose={() => setReview(null)}
        />
      )}
    </div>
  );
}
