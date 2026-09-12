"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { useId, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import CollectRecipientPicker from "./CollectRecipientPicker";
import CollectOrderExpiryPicker from "./CollectOrderExpiryPicker";
import { validateCollectTrade } from "./collect-form.validation";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";
import { isCollectProfileWallet } from "./collect-recipient.helpers";

const INPUT_CLASS =
  "tw-block tw-min-h-11 tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-tabular-nums tw-text-iron-100 placeholder:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

const REVIEW_LABELS: Partial<Record<CollectTradeAction, MessageKey>> = {
  offer: "collect.trade.reviewOffer",
  list: "collect.trade.reviewListing",
};

interface CollectTradeFormProps {
  readonly action: CollectTradeAction;
  readonly draft: CollectTradeDraft;
  readonly maxQuantity: string;
  readonly makerLabel: string;
  readonly currencyLabel: "ETH" | "WETH";
  readonly recipientProfile: ApiIdentity | null;
  readonly fixedOfferQuantity?: string | undefined;
  readonly disabledReason?: string | undefined;
  readonly loading: boolean;
  readonly error?: string | undefined;
  readonly onChange: (draft: CollectTradeDraft) => void;
  readonly onPrepare: (draft: CollectTradeDraft) => void;
}

export default function CollectTradeForm(props: CollectTradeFormProps) {
  const locale = useBrowserLocale();
  const id = useId();
  const [invalid, setInvalid] =
    useState<ReturnType<typeof validateCollectTrade>>(null);
  const hasPrice = props.action === "list" || props.action === "offer";
  const fixedOfferQuantity =
    props.action === "offer" && props.fixedOfferQuantity !== undefined;
  const fixedQuantityHintId = `${id}-fixed-quantity`;
  const hasRecipient = props.action === "buy";
  const external =
    hasRecipient &&
    Boolean(props.draft.recipient) &&
    !isCollectProfileWallet(props.recipientProfile, props.draft.recipient);
  const change = (patch: Partial<CollectTradeDraft>) => {
    setInvalid(null);
    props.onChange({
      ...props.draft,
      ...(patch.recipient === undefined
        ? {}
        : { acknowledgeExternalRecipient: false }),
      ...patch,
    });
  };
  const message = invalid
    ? t(locale, `collect.trade.invalid.${invalid}`, { max: props.maxQuantity })
    : props.error;
  const quantityField = (
    <div className="tw-min-w-0 tw-space-y-2">
      <label className="tw-block tw-space-y-2 tw-text-xs tw-text-iron-300">
        <span>{t(locale, "collect.trade.quantity")}</span>
        <input
          disabled={props.loading}
          readOnly={fixedOfferQuantity}
          inputMode="numeric"
          autoComplete="off"
          value={props.draft.quantity}
          maxLength={21}
          onChange={
            fixedOfferQuantity
              ? undefined
              : (event) => change({ quantity: event.target.value })
          }
          aria-invalid={invalid === "quantity"}
          aria-describedby={[
            invalid === "quantity" ? `${id}-error` : undefined,
            fixedOfferQuantity ? fixedQuantityHintId : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
          className={INPUT_CLASS}
        />
      </label>
      {fixedOfferQuantity && (
        <span
          id={fixedQuantityHintId}
          className="tw-block tw-text-xs tw-leading-5 tw-text-iron-400"
        >
          {t(locale, "collect.trade.editQuantityInPlan")}
        </span>
      )}
    </div>
  );
  return (
    <form
      noValidate
      className="tw-space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const nextError = validateCollectTrade(
          props.draft,
          props.action,
          props.maxQuantity
        );
        setInvalid(nextError);
        if (
          !nextError &&
          !props.loading &&
          !props.disabledReason &&
          (!external || props.draft.acknowledgeExternalRecipient)
        )
          props.onPrepare(props.draft);
      }}
    >
      <p className="tw-m-0 tw-break-all tw-text-xs tw-leading-5 tw-text-iron-300">
        {props.action === "buy"
          ? t(locale, "collect.trade.payingWalletLine", {
              wallet: props.makerLabel,
            })
          : t(locale, "collect.orders.maker", { wallet: props.makerLabel })}
      </p>
      {!hasPrice && props.action !== "cancel" && quantityField}
      {hasPrice && (
        <>
          <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_5.5rem] tw-items-start tw-gap-3">
            <label className="tw-block tw-min-w-0 tw-space-y-2 tw-text-xs tw-text-iron-300">
              <span>
                {t(locale, "collect.trade.unitPrice", {
                  currency: props.currencyLabel,
                })}
              </span>
              <span className="tw-relative tw-block">
                <input
                  disabled={props.loading}
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={40}
                  value={props.draft.unitPriceEth}
                  onChange={(event) =>
                    change({ unitPriceEth: event.target.value })
                  }
                  aria-invalid={invalid === "price"}
                  aria-describedby={
                    invalid === "price" ? `${id}-error` : undefined
                  }
                  className={`${INPUT_CLASS} tw-pr-16`}
                />
                <span
                  aria-hidden="true"
                  className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-3 tw-flex tw-items-center tw-text-xs tw-text-iron-400"
                >
                  {props.currencyLabel}
                </span>
              </span>
            </label>
            {quantityField}
          </div>
          <CollectOrderExpiryPicker
            value={props.draft}
            disabled={props.loading}
            invalid={invalid === "expiry"}
            errorId={`${id}-error`}
            onChange={change}
          />
        </>
      )}
      {hasRecipient && (
        <fieldset
          disabled={props.loading}
          className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0"
        >
          <CollectRecipientPicker
            key={props.recipientProfile?.id ?? "no-profile"}
            profile={props.recipientProfile}
            payingWallet={props.makerLabel}
            value={props.draft.recipient}
            invalid={invalid === "recipient"}
            errorId={`${id}-error`}
            onChange={(recipient) => change({ recipient })}
          />
        </fieldset>
      )}
      {hasPrice && (
        <div className="tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
          {props.action === "offer" && (
            <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
              {t(locale, "collect.trade.offerRecipient")}
            </p>
          )}
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "collect.trade.orderWarning")}
          </p>
        </div>
      )}
      {props.action === "cancel" && (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "collect.trade.cancelWarning")}
        </p>
      )}
      {external && (
        <div className="tw-space-y-2">
          <p
            id={`${id}-external`}
            className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            {t(locale, "collect.trade.external")}
          </p>
          <label className="tw-flex tw-min-h-11 tw-items-start tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            <input
              type="checkbox"
              aria-describedby={`${id}-external`}
              disabled={props.loading}
              checked={props.draft.acknowledgeExternalRecipient === true}
              onChange={(event) =>
                change({ acknowledgeExternalRecipient: event.target.checked })
              }
              className="tw-mt-1 tw-size-4 tw-shrink-0 tw-accent-primary-500"
            />
            {t(locale, "collect.trade.acknowledgeExternal")}
          </label>
        </div>
      )}
      {message && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-m-0 tw-text-sm tw-leading-5 tw-text-red"
        >
          {message}
        </p>
      )}
      {props.disabledReason && (
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-300">
          {props.disabledReason}
        </p>
      )}
      <Button
        type="submit"
        variant="action"
        size="md"
        className="tw-min-h-12 tw-text-sm tw-font-medium"
        fullWidth
        loading={props.loading}
        disabled={
          Boolean(props.disabledReason) ||
          (external && !props.draft.acknowledgeExternalRecipient)
        }
      >
        {t(locale, REVIEW_LABELS[props.action] ?? "collect.trade.prepare")}
      </Button>
    </form>
  );
}
