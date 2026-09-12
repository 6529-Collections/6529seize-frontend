"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { getAddress, isAddress } from "viem";
import type CollectTradeForm from "./CollectTradeForm";
import CollectDeliveryControl from "./CollectDeliveryControl";
import { validateCollectTrade } from "./collect-form.validation";
import { isCollectProfileWallet } from "./collect-recipient.helpers";
import type { CollectTradeDraft } from "./collect.types";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";

type Props = ComponentProps<typeof CollectTradeForm> & {
  readonly amountWei: string | null;
  readonly orderOptions?: ReactNode;
  readonly secondaryActions?: ReactNode;
  readonly quantityStep?: string;
  readonly onSplitDelivery?: (() => void) | undefined;
};

export default function CollectInlineBuyForm(props: Props) {
  const locale = useBrowserLocale();
  const id = useId();
  const [invalid, setInvalid] =
    useState<ReturnType<typeof validateCollectTrade>>(null);
  const recipient = props.draft.recipient;
  const address = isAddress(recipient) ? getAddress(recipient) : null;
  const external =
    Boolean(recipient) &&
    !isCollectProfileWallet(props.recipientProfile, recipient);
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
      className="tw-space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const next = validateCollectTrade(
          props.draft,
          "buy",
          props.maxQuantity
        );
        setInvalid(next);
        if (
          !next &&
          props.amountWei !== null &&
          !props.loading &&
          !props.disabledReason &&
          (!external || props.draft.acknowledgeExternalRecipient)
        )
          props.onPrepare(props.draft);
      }}
    >
      {props.maxQuantity !== (props.quantityStep ?? "1") && (
        <label className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-iron-300">
          <span>{t(locale, "collect.trade.quantity")}</span>
          <input
            value={props.draft.quantity}
            disabled={props.loading}
            inputMode="numeric"
            autoComplete="off"
            maxLength={21}
            aria-invalid={invalid === "quantity"}
            aria-describedby={
              invalid === "quantity" ? `${id}-error` : undefined
            }
            onChange={(event) => change({ quantity: event.target.value })}
            className="tw-min-h-11 tw-w-20 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-center tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          />
        </label>
      )}
      {props.maxQuantity === (props.quantityStep ?? "1") &&
        props.draft.quantity !== "1" && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-300">
            {t(locale, "collect.trade.quantity")}: {props.draft.quantity}
          </p>
        )}
      {props.orderOptions}
      {external && (
        <label className="tw-flex tw-min-h-11 tw-items-start tw-gap-3 tw-text-xs tw-leading-5 tw-text-iron-300">
          <input
            type="checkbox"
            checked={props.draft.acknowledgeExternalRecipient === true}
            disabled={props.loading}
            onChange={(event) =>
              change({ acknowledgeExternalRecipient: event.target.checked })
            }
            className="tw-mt-1 tw-size-4 tw-shrink-0 tw-accent-primary-500"
          />
          <span>
            {t(locale, "collect.trade.acknowledgeExternal")}
            <span className="tw-block tw-break-all tw-font-mono">
              {address ?? recipient}
            </span>
          </span>
        </label>
      )}
      {message && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-red"
        >
          {message}
        </p>
      )}
      {props.disabledReason && (
        <p
          role="status"
          className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
        >
          {props.disabledReason}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <Button
          type="submit"
          variant="action"
          size="lg"
          loading={props.loading}
          disabled={
            props.amountWei === null ||
            Boolean(props.disabledReason) ||
            (external && !props.draft.acknowledgeExternalRecipient)
          }
        >
          {props.amountWei === null
            ? t(locale, "collect.action.buy")
            : t(locale, "collect.buy.atPrice", {
                price: marketAmount(props.amountWei, MARKET_ZERO),
              })}
        </Button>
        {props.secondaryActions}
      </div>
      <CollectDeliveryControl
        profile={props.recipientProfile}
        payingWallet={props.makerLabel}
        value={recipient}
        disabled={props.loading}
        invalid={invalid === "recipient"}
        errorId={`${id}-error`}
        onChange={(value) => change({ recipient: value })}
      />
      {props.onSplitDelivery && (
        <button
          type="button"
          disabled={props.loading || Boolean(props.disabledReason)}
          onClick={props.onSplitDelivery}
          className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-text-iron-400 tw-underline tw-decoration-iron-600 tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "collect.buy.splitDelivery")}
        </button>
      )}
    </form>
  );
}
