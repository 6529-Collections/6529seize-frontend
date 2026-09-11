"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import CollectRecipientPicker from "./CollectRecipientPicker";
import { COLLECT_INPUT_CLASS } from "./CollectGoalForm";
import { validateCollectTrade } from "./collect-form.validation";
import type { CollectTradeAction, CollectTradeDraft } from "./collect.types";

interface CollectTradeFormProps {
  readonly action: CollectTradeAction;
  readonly draft: CollectTradeDraft;
  readonly maxQuantity: string;
  readonly makerLabel: string;
  readonly currencyLabel: "ETH" | "WETH";
  readonly recipientProfile: ApiIdentity | null;
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
  const hasRecipient = props.action === "buy";
  const external =
    hasRecipient &&
    Boolean(props.draft.recipient) &&
    !props.recipientProfile?.wallets?.some(
      (wallet) =>
        wallet.wallet.toLowerCase() === props.draft.recipient.toLowerCase()
    );
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
  return (
    <form
      className="tw-space-y-4"
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
        {t(locale, "collect.orders.maker", { wallet: props.makerLabel })}
      </p>
      {props.action === "offer" && (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "collect.trade.offerRecipient")}
        </p>
      )}
      {props.action !== "cancel" && (
        <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-200">
          <span>{t(locale, "collect.trade.quantity")}</span>
          <input
            disabled={props.loading}
            inputMode="numeric"
            autoComplete="off"
            value={props.draft.quantity}
            maxLength={21}
            onChange={(event) => change({ quantity: event.target.value })}
            aria-invalid={invalid === "quantity"}
            aria-describedby={
              invalid === "quantity" ? `${id}-error` : undefined
            }
            className={COLLECT_INPUT_CLASS}
          />
        </label>
      )}
      {hasPrice && (
        <>
          <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-200">
            <span>
              {t(locale, "collect.trade.unitPrice", {
                currency: props.currencyLabel,
              })}
            </span>
            <input
              disabled={props.loading}
              inputMode="decimal"
              autoComplete="off"
              maxLength={40}
              value={props.draft.unitPriceEth}
              onChange={(event) => change({ unitPriceEth: event.target.value })}
              aria-invalid={invalid === "price"}
              aria-describedby={invalid === "price" ? `${id}-error` : undefined}
              className={COLLECT_INPUT_CLASS}
            />
          </label>
          <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-200">
            <span>{t(locale, "collect.trade.duration")}</span>
            <select
              disabled={props.loading}
              value={props.draft.expiryHours}
              onChange={(event) => change({ expiryHours: event.target.value })}
              className={COLLECT_INPUT_CLASS}
            >
              {[24, 168, 720].map((hours) => (
                <option key={hours} value={hours}>
                  {t(
                    locale,
                    hours === 24
                      ? "collect.trade.durationDay"
                      : "collect.trade.durationDays",
                    {
                      days: hours / 24,
                    }
                  )}
                </option>
              ))}
            </select>
          </label>
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
            value={props.draft.recipient}
            invalid={invalid === "recipient"}
            errorId={`${id}-error`}
            onChange={(recipient) => change({ recipient })}
          />
        </fieldset>
      )}
      {hasPrice && (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.trade.orderWarning")}
        </p>
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
        size="lg"
        fullWidth
        loading={props.loading}
        disabled={
          Boolean(props.disabledReason) ||
          (external && !props.draft.acknowledgeExternalRecipient)
        }
      >
        {t(locale, "collect.trade.prepare")}
      </Button>
    </form>
  );
}
