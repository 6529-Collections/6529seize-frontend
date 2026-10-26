"use client";

import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import Button from "@/components/utils/button/Button";
import { collectOrderAvailableQuantity } from "@/components/collect/collect-buy.helpers";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  type Ref,
} from "react";
import {
  marketDepthListingQuantityIsValid,
  type MarketDepthListingSelection,
} from "./market-depth-trade.helpers";

const ACTION_CLASS =
  "tw-font-inherit tw-min-h-11 tw-max-w-full !tw-whitespace-normal tw-px-3 tw-py-2 tw-text-meta tw-leading-5";
const COMPACT_ACTION_CLASS =
  "tw-font-inherit tw-min-h-11 tw-min-w-16 tw-max-w-full !tw-whitespace-normal tw-px-4 tw-py-1.5 tw-text-meta tw-leading-5 focus-visible:tw-outline-offset-[-2px] sm:tw-min-h-[34px] sm:touch-only:tw-min-h-11";

// The transparent 5px edges keep a 44px target around the 34px mobile surface.
// Clipping the background also gives the visible surface an 8px corner radius.
const MOBILE_TRADE_ACTION_CLASS =
  "max-sm:tw-w-20 max-sm:tw-flex-wrap max-sm:tw-gap-x-1 max-sm:tw-rounded-[8px/13px] max-sm:tw-border-x-0 max-sm:tw-border-y-[5px] max-sm:!tw-border-transparent max-sm:tw-bg-clip-padding max-sm:tw-px-1 max-sm:tw-py-0 max-sm:tw-text-meta max-sm:tw-leading-4 max-sm:tw-shadow-none max-sm:tw-ring-0";

// Expanded order actions keep the same compact surface at every viewport size.
const ORDER_ACTION_CLASS =
  "tw-font-inherit tw-min-h-11 tw-min-w-20 tw-max-w-full tw-flex-wrap tw-gap-x-1 !tw-rounded-[8px/13px] !tw-border-x-0 !tw-border-y-[5px] !tw-border-transparent tw-bg-clip-padding tw-px-3 tw-py-0 tw-text-meta tw-leading-4 !tw-shadow-none !tw-ring-0";

const OUTLINED_LEVEL_ACTION_CLASS =
  "!tw-border-white/[0.12] !tw-bg-transparent !tw-text-iron-200 !tw-shadow-none !tw-ring-0 enabled:group-hover:!tw-border-primary-500 enabled:group-hover:!tw-bg-primary-500 enabled:group-hover:!tw-text-white focus-visible:!tw-border-primary-500 focus-visible:!tw-bg-primary-500 focus-visible:!tw-text-white max-sm:!tw-border-transparent max-sm:!tw-shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)] max-sm:enabled:group-hover:!tw-border-transparent max-sm:focus-visible:!tw-border-transparent";

export interface RowState {
  readonly busy: boolean;
  readonly message?: string;
  readonly error?: boolean;
  readonly connectAction?: boolean;
}

export interface TradeContextValue {
  readonly selected: readonly MarketDepthListingSelection[];
  readonly rowStates: Readonly<Record<string, RowState>>;
  readonly selectionBusy: boolean;
  readonly toggleListing: (order: ApiMarketOrder) => void;
  readonly updateQuantity: (order: ApiMarketOrder, quantity: string) => void;
  readonly acceptOffer: (
    order: ApiMarketOrder,
    trigger: HTMLButtonElement
  ) => void;
  readonly connectOwnerWallet: () => void;
}

export const TradeContext = createContext<TradeContextValue | null>(null);

const same = (left: string, right: string) =>
  left.toLowerCase() === right.toLowerCase();

export function rowMatches(
  item: MarketDepthListingSelection,
  order: ApiMarketOrder
): boolean {
  return (
    same(item.order.identity.protocol_address, order.protocol) &&
    same(item.order.identity.order_hash, order.order_id)
  );
}

export function useMarketDepthTradeActionsAvailable(): boolean {
  const context = useContext(TradeContext);
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  return context !== null && !hideNftPurchasing;
}

export function MarketDepthLevelAction({
  order,
  outlined = false,
  side,
  locale,
  open,
  panelId,
  onClick,
}: {
  readonly order?: ApiMarketOrder | undefined;
  readonly outlined?: boolean;
  readonly side: "ask" | "bid";
  readonly locale: SupportedLocale;
  readonly open: boolean;
  readonly panelId: string;
  readonly onClick: () => void;
}) {
  const context = useContext(TradeContext);
  const transferFocus = useRef(false);
  const actionRef = useCallback((button: HTMLButtonElement | null) => {
    if (!button) return;
    const shouldTransferFocus = transferFocus.current;
    transferFocus.current = false;
    const active = button.ownerDocument.activeElement;
    if (
      shouldTransferFocus &&
      (active === null || active === button.ownerDocument.body)
    ) {
      button.focus({ preventScroll: true });
    }
    return () => {
      transferFocus.current = button.ownerDocument.activeElement === button;
    };
  }, []);
  if (!context) return null;
  if (order)
    return (
      <MarketDepthOrderAction
        order={order}
        locale={locale}
        compact
        outlined={outlined}
        actionRef={actionRef}
      />
    );
  return (
    <NftPurchasingGate>
      <Button
        ref={actionRef}
        type="button"
        variant="action"
        size={null}
        className={`${COMPACT_ACTION_CLASS} ${MOBILE_TRADE_ACTION_CLASS} ${outlined ? OUTLINED_LEVEL_ACTION_CLASS : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onClick}
      >
        {t(
          locale,
          side === "ask"
            ? "marketDepth.trade.collect"
            : "marketDepth.trade.sell"
        )}
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-h-3 tw-w-3 tw-shrink-0"
        />
      </Button>
    </NftPurchasingGate>
  );
}

export function MarketDepthOrderAction({
  order,
  locale,
  compact = false,
  outlined = false,
  actionRef,
}: {
  readonly order: ApiMarketOrder;
  readonly locale: SupportedLocale;
  readonly compact?: boolean;
  readonly outlined?: boolean;
  readonly actionRef?: Ref<HTMLButtonElement> | undefined;
}) {
  const context = useContext(TradeContext);
  if (!context) return null;
  const state = context.rowStates[order.order_key];
  const selected = context.selected.some((item) => rowMatches(item, order));
  const unverifiedOffer =
    order.side === ApiMarketOrderSideEnum.Bid &&
    (order.scope === ApiMarketOrderScopeEnum.Unknown ||
      order.applicability ===
        ApiMarketOrderApplicabilityEnum.CriteriaUnverified);
  const listingActionKey = selected
    ? "marketDepth.trade.remove"
    : "marketDepth.trade.collect";
  const offerActionKey = compact
    ? "marketDepth.trade.sell"
    : "marketDepth.trade.accept";
  return (
    <NftPurchasingGate>
      <div className={compact ? "" : "tw-mt-3"}>
        {unverifiedOffer ? (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "marketDepth.trade.criteriaUnavailable")}
          </p>
        ) : (
          <Button
            ref={actionRef}
            type="button"
            variant={selected ? "secondary" : "action"}
            size={null}
            className={`${compact ? COMPACT_ACTION_CLASS : ORDER_ACTION_CLASS} ${compact ? MOBILE_TRADE_ACTION_CLASS : ""} ${outlined && !selected ? OUTLINED_LEVEL_ACTION_CLASS : ""}`}
            aria-label={t(
              locale,
              order.side === ApiMarketOrderSideEnum.Ask
                ? listingActionKey
                : offerActionKey
            )}
            aria-pressed={
              order.side === ApiMarketOrderSideEnum.Ask ? selected : undefined
            }
            loading={state?.busy}
            hideChildrenWhenLoading={compact}
            disabled={context.selectionBusy}
            onClick={(event) =>
              order.side === ApiMarketOrderSideEnum.Ask
                ? context.toggleListing(order)
                : context.acceptOffer(order, event.currentTarget)
            }
          >
            {order.side === ApiMarketOrderSideEnum.Ask
              ? t(locale, listingActionKey)
              : t(locale, offerActionKey)}
          </Button>
        )}
        {!compact && <MarketDepthOrderFeedback order={order} locale={locale} />}
      </div>
    </NftPurchasingGate>
  );
}

export function MarketDepthOrderFeedback({
  order,
  locale,
  tableRow = false,
}: {
  readonly order: ApiMarketOrder;
  readonly locale: SupportedLocale;
  readonly tableRow?: boolean;
}) {
  const quantityErrorId = useId();
  const context = useContext(TradeContext);
  if (!context) return null;
  const state = context.rowStates[order.order_key];
  const selected = context.selected.find((item) => rowMatches(item, order));
  if (!selected && !state?.message && !state?.connectAction) return null;
  const available = selected
    ? collectOrderAvailableQuantity(selected.order)
    : null;
  const invalidQuantity = Boolean(
    selected &&
    !marketDepthListingQuantityIsValid(
      selected.asset,
      selected.order,
      selected.quantity
    )
  );
  const feedback = (
    <div
      className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-pb-4 tw-pt-2 tw-text-left ${tableRow ? "tw-px-3 sm:tw-px-5" : ""}`}
    >
      {selected && (
        <label className="tw-inline-flex tw-items-center tw-gap-3 tw-text-meta tw-text-iron-400">
          <span>{t(locale, "marketDepth.trade.quantity")}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={selected.quantity}
            aria-invalid={invalidQuantity}
            aria-describedby={invalidQuantity ? quantityErrorId : undefined}
            disabled={context.selectionBusy}
            maxLength={78}
            onChange={(event) =>
              context.updateQuantity(order, event.currentTarget.value)
            }
            className="tw-font-inherit tw-h-11 tw-w-16 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-center tw-text-sm tw-tabular-nums tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          />
        </label>
      )}
      {selected && available && (
        <p className="tw-m-0 tw-text-xs tw-text-iron-500">
          {t(locale, "marketDepth.trade.available", { quantity: available })}
        </p>
      )}
      {invalidQuantity && (
        <p
          id={quantityErrorId}
          role="alert"
          className="tw-m-0 tw-w-full tw-text-xs tw-text-rose-200"
        >
          {t(locale, "marketDepth.trade.quantityInvalid")}
        </p>
      )}
      {state?.message && (
        <p
          role={state.error ? "alert" : "status"}
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {state.message}
        </p>
      )}
      {state?.connectAction && (
        <Button
          type="button"
          variant="secondary"
          size={null}
          className={ACTION_CLASS}
          onClick={context.connectOwnerWallet}
        >
          {t(locale, "marketDepth.trade.connectOwner")}
        </Button>
      )}
    </div>
  );
  return (
    <NftPurchasingGate>
      {tableRow ? (
        <tr>
          {/* Bridge MarketDepthPriceLevels' border-spacing-y-1 (4px). */}
          <td
            colSpan={4}
            className={
              selected
                ? "tw-relative tw-rounded-b-xl tw-bg-iron-900 tw-p-0 tw-shadow-[inset_1px_0_0_theme(colors.iron.800),inset_-1px_0_0_theme(colors.iron.800),inset_0_-1px_0_theme(colors.iron.800)] before:tw-absolute before:tw-inset-x-0 before:tw-top-[-4px] before:tw-h-1 before:tw-bg-iron-900 before:tw-shadow-[inset_1px_0_0_theme(colors.iron.800),inset_-1px_0_0_theme(colors.iron.800)] before:!tw-content-['']"
                : "tw-p-0"
            }
          >
            {feedback}
          </td>
        </tr>
      ) : (
        feedback
      )}
    </NftPurchasingGate>
  );
}
