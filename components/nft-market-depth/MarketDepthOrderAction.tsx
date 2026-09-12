"use client";

import NftPurchasingGate from "@/components/common/NftPurchasingGate";
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

export const ACTION_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-white";
const COMPACT_ACTION_CLASS =
  "tw-my-0.5 tw-inline-flex tw-min-h-11 tw-min-w-11 tw-max-w-full tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:enabled:hover:tw-border-iron-500 desktop-hover:enabled:hover:tw-bg-iron-900 desktop-hover:enabled:hover:tw-text-white";

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
  side,
  locale,
  open,
  panelId,
  onClick,
}: {
  readonly order?: ApiMarketOrder | undefined;
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
        actionRef={actionRef}
      />
    );
  return (
    <NftPurchasingGate>
      <button
        ref={actionRef}
        type="button"
        className={COMPACT_ACTION_CLASS}
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
      </button>
    </NftPurchasingGate>
  );
}

export function MarketDepthOrderAction({
  order,
  locale,
  compact = false,
  actionRef,
}: {
  readonly order: ApiMarketOrder;
  readonly locale: SupportedLocale;
  readonly compact?: boolean;
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
          <button
            ref={actionRef}
            type="button"
            className={compact ? COMPACT_ACTION_CLASS : ACTION_CLASS}
            disabled={Boolean(state?.busy) || context.selectionBusy}
            onClick={(event) =>
              order.side === ApiMarketOrderSideEnum.Ask
                ? context.toggleListing(order)
                : context.acceptOffer(order, event.currentTarget)
            }
          >
            {order.side === ApiMarketOrderSideEnum.Ask
              ? t(locale, listingActionKey)
              : t(locale, offerActionKey)}
          </button>
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
    <div className="tw-space-y-2 tw-py-3 tw-text-left">
      {selected && (
        <label className="tw-inline-grid tw-gap-1 tw-text-xs tw-text-iron-400">
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
            className="tw-h-11 tw-w-24 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-sm tw-tabular-nums tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
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
          className="tw-m-0 tw-text-xs tw-text-rose-200"
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
        <button
          type="button"
          className={ACTION_CLASS}
          onClick={context.connectOwnerWallet}
        >
          {t(locale, "marketDepth.trade.connectOwner")}
        </button>
      )}
    </div>
  );
  return (
    <NftPurchasingGate>
      {tableRow ? (
        <tr>
          <td colSpan={4} className="tw-p-0">
            {feedback}
          </td>
        </tr>
      ) : (
        feedback
      )}
    </NftPurchasingGate>
  );
}
