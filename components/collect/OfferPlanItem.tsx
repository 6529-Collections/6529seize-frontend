import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger, formatTime } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import { formatEther } from "viem";
import { useId } from "react";
import CollectAssetMedia from "./CollectAssetMedia";
import type { OfferPlanPrice, OfferPlanRow } from "./collect-offer-plan.types";
import {
  OFFER_EXPIRY_HOURS,
  offerRowIssue,
  offerRowTotal,
} from "./collect-offer-plan.helpers";
import { OFFER_INPUT_CLASS } from "./OfferPlanPricing";
import OfferPlanAcquisitionControl from "./OfferPlanAcquisitionControl";

const REASON_KEYS: Readonly<Record<string, MessageKey>> = {
  MANUAL_PRICE: "collect.offerPlan.reason.manual",
  MATCH_BID: "collect.offerPlan.reason.matchBid",
  IMPROVE_BID: "collect.offerPlan.reason.improveBid",
  DISCOUNT_ASK: "collect.offerPlan.reason.discountAsk",
  GOAL_PATIENT_OPENING: "collect.offerPlan.reason.goal",
  NO_APPLICABLE_BID: "collect.offerPlan.reason.noBid",
  NO_APPLICABLE_ASK: "collect.offerPlan.reason.noAsk",
  STALE_MARKET_DATA: "collect.offerPlan.reason.stale",
  UNSUPPORTED_ASSET: "collect.offerPlan.reason.unsupported",
  INSUFFICIENT_GOAL_EVIDENCE: "collect.offerPlan.reason.insufficientEvidence",
  AMOUNT_OVERFLOW: "collect.offerPlan.reason.amount",
  BUDGET_EXCEEDED: "collect.offerPlan.reason.budget",
  INSUFFICIENT_WETH: "collect.offerPlan.reason.funding",
  PIN_CONFLICT: "collect.offerPlan.reason.pinConflict",
  OBSERVED_REFERENCE_ONLY: "collect.offerPlan.reason.observed",
  ETH_ASK_WETH_COMPARISON: "collect.offerPlan.reason.ethComparison",
};

export default function OfferPlanItem({
  row,
  price,
  busy,
  published,
  pending = false,
  reviewDisabled,
  onChange,
  onReview,
  blended = false,
  buying = false,
  buyAvailable = false,
  buyCostWei,
  buyReserved = false,
  onRouteChange,
}: {
  readonly row: OfferPlanRow;
  readonly price?: OfferPlanPrice | undefined;
  readonly busy: boolean;
  readonly published: boolean;
  readonly pending?: boolean | undefined;
  readonly reviewDisabled: boolean;
  readonly onChange: (row: OfferPlanRow) => void;
  readonly onReview: () => void;
  readonly blended?: boolean | undefined;
  readonly buying?: boolean | undefined;
  readonly buyAvailable?: boolean | undefined;
  readonly buyCostWei?: string | undefined;
  readonly buyReserved?: boolean | undefined;
  readonly onRouteChange?: ((buying: boolean) => void) | undefined;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const title =
    row.asset?.name ??
    t(locale, "collect.offerPlan.tokenFallback", {
      token: row.assetKey.split(":")[2] ?? "—",
    });
  const issue = offerRowIssue(row);
  const total = offerRowTotal(row);
  const disabled = busy || published || pending || buyReserved;
  const hasPrice = row.unitPriceEth !== "";
  return (
    <li className="tw-min-w-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-4 last:tw-border-b-0">
      <div className="tw-grid tw-items-center tw-gap-3 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-gap-6">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
          <label className="tw-flex tw-min-h-11 tw-min-w-11 tw-cursor-pointer tw-items-center tw-justify-center">
            <input
              type="checkbox"
              checked={row.selected}
              disabled={disabled}
              aria-label={t(
                locale,
                blended || buying
                  ? "collect.blend.selectNFT"
                  : "collect.offerPlan.selectNFT",
                {
                  title: title,
                }
              )}
              onChange={(event) =>
                onChange({ ...row, selected: event.target.checked })
              }
              className="tw-size-4 tw-accent-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            />
          </label>
          {row.asset?.image_url && (
            <div className="tw-relative tw-size-12 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-950">
              <CollectAssetMedia src={row.asset.image_url} name={title} />
            </div>
          )}
          <div className="tw-min-w-0 tw-flex-1">
            <h3
              id={`${id}-title`}
              className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100"
            >
              {title}
            </h3>
            {published && (
              <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-300">
                {t(locale, "collect.offerPlan.published")}
              </p>
            )}
            {pending && (
              <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-300">
                {t(locale, "collect.offerPlan.pending")}
              </p>
            )}
            {buyReserved && (
              <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-300">
                {t(locale, "collect.blend.reserved")}
              </p>
            )}
            {!buying && total !== null && (
              <p className="tw-m-0 tw-mt-1 tw-break-all tw-text-xs tw-tabular-nums tw-text-iron-300">
                {t(locale, "collect.offerPlan.weth", {
                  amount: formatDecimalString(locale, formatEther(total)),
                })}
              </p>
            )}
            {blended && (
              <OfferPlanAcquisitionControl
                title={title}
                buying={buying}
                available={buyAvailable}
                disabled={disabled}
                onChange={(next) => onRouteChange?.(next)}
              />
            )}
          </div>
        </div>
        {buying ? (
          <div className="tw-space-y-1 tw-text-sm tw-text-iron-300">
            <p className="tw-m-0 tw-tabular-nums">
              {t(locale, "collect.blend.buyCost", {
                amount:
                  buyCostWei === undefined
                    ? "—"
                    : formatDecimalString(
                        locale,
                        formatEther(BigInt(buyCostWei))
                      ),
              })}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              {t(locale, "collect.blend.buyQuantity", {
                quantity: formatDecimalString(locale, row.quantity),
              })}
            </p>
          </div>
        ) : (
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-end tw-gap-3 lg:tw-flex-nowrap">
            <label className="tw-min-w-0 tw-max-w-48 tw-flex-[1_1_10rem] tw-space-y-1 tw-text-xs tw-text-iron-300">
              <span>{t(locale, "collect.offerPlan.unitPrice")}</span>
              <input
                inputMode="decimal"
                autoComplete="off"
                maxLength={41}
                value={row.unitPriceEth}
                disabled={disabled}
                aria-label={t(locale, "collect.offerPlan.priceFor", {
                  title: title,
                })}
                aria-invalid={hasPrice && issue === "price"}
                aria-describedby={
                  hasPrice && issue === "price" ? `${id}-error` : undefined
                }
                onChange={(event) =>
                  onChange({
                    ...row,
                    unitPriceEth: event.target.value,
                    pinned: true,
                  })
                }
                className={OFFER_INPUT_CLASS}
              />
            </label>
            <label className="tw-w-20 tw-shrink-0 tw-space-y-1 tw-text-xs tw-text-iron-300">
              <span>{t(locale, "collect.trade.quantity")}</span>
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={3}
                value={row.quantity}
                disabled={disabled}
                aria-label={t(locale, "collect.offerPlan.quantityFor", {
                  title: title,
                })}
                aria-invalid={issue === "quantity"}
                aria-describedby={
                  issue === "quantity" ? `${id}-error` : undefined
                }
                onChange={(event) =>
                  onChange({ ...row, quantity: event.target.value })
                }
                className={OFFER_INPUT_CLASS}
              />
            </label>
            <button
              type="button"
              disabled={
                disabled ||
                reviewDisabled ||
                !row.asset ||
                !row.selected ||
                issue !== null
              }
              aria-label={t(locale, "collect.offerPlan.reviewFor", {
                title: title,
              })}
              onClick={onReview}
              className="tw-ml-auto tw-min-h-11 tw-shrink-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-4 tw-text-sm tw-font-medium tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-bg-white/5 disabled:tw-opacity-40"
            >
              {t(locale, "collect.offerPlan.review")}
            </button>
          </div>
        )}
      </div>
      {!buying && issue && (hasPrice || issue !== "price") && (
        <p
          id={`${id}-error`}
          role="status"
          className="tw-m-0 tw-mt-2 tw-text-xs tw-text-error"
        >
          {t(locale, `collect.offerPlan.invalid.${issue}`)}
        </p>
      )}
      {!buying && row.pinned && (
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
          <span>{t(locale, "collect.offerPlan.pinned")}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({ ...row, pinned: false, unitPriceEth: "" })
            }
            aria-label={t(locale, "collect.offerPlan.resetFor", {
              title: title,
            })}
            className="tw-min-h-6 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-iron-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
          >
            {t(locale, "collect.offerPlan.reset")}
          </button>
        </div>
      )}
      {!buying && (
        <details className="tw-mt-2 tw-text-xs tw-leading-relaxed tw-text-iron-400">
          <summary
            aria-label={t(locale, "collect.offerPlan.detailsFor", { title })}
            className="tw-min-h-6 tw-cursor-pointer tw-rounded-md tw-py-1 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "collect.offerPlan.details")}
          </summary>
          <div className="tw-space-y-3 tw-py-2">
            <label className="tw-block tw-w-28 tw-space-y-1 tw-text-xs tw-text-iron-300">
              <span>{t(locale, "collect.offerPlan.expiry")}</span>
              <select
                value={row.expiryHours}
                disabled={disabled}
                aria-label={t(locale, "collect.offerPlan.expiryFor", { title })}
                onChange={(event) =>
                  onChange({ ...row, expiryHours: event.target.value })
                }
                className={OFFER_INPUT_CLASS}
              >
                {OFFER_EXPIRY_HOURS.map((hours) => (
                  <option key={hours} value={hours}>
                    {t(
                      locale,
                      hours === "24"
                        ? "collect.trade.durationDay"
                        : "collect.trade.durationDays",
                      { days: formatInteger(locale, Number(hours) / 24) }
                    )}
                  </option>
                ))}
              </select>
            </label>
            {price && (
              <ul className="tw-m-0 tw-space-y-1 tw-pl-4">
                {price.reasons.map((reason) => (
                  <li key={reason}>
                    {t(
                      locale,
                      REASON_KEYS[reason] ?? "collect.offerPlan.reason.unknown"
                    )}
                  </li>
                ))}
                {price.references.map((reference) => (
                  <li
                    key={`${reference.kind}:${reference.observedAt}:${reference.amountWei}`}
                  >
                    {t(
                      locale,
                      reference.kind === "bid"
                        ? "collect.offerPlan.observedBid"
                        : "collect.offerPlan.observedAsk",
                      {
                        amount: formatDecimalString(
                          locale,
                          formatEther(BigInt(reference.amountWei))
                        ),
                        currency: reference.currency,
                        time: formatTime(locale, reference.observedAt),
                      }
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}
    </li>
  );
}
