"use client";

import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import CollectRecipientPicker from "./CollectRecipientPicker";
import { collectProfileWallets } from "./collect-recipient.helpers";

export default function CollectDeliveryControl({
  profile,
  payingWallet,
  value,
  onChange,
  disabled = false,
  invalid = false,
  errorId,
}: {
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string;
  readonly value: string;
  readonly onChange: (address: string) => void;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly errorId: string;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const own = collectProfileWallets(profile).find(
    (wallet) => wallet.wallet.toLowerCase() === value.toLowerCase()
  );
  const address = isAddress(value) ? getAddress(value) : null;
  const addressLabel = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : t(locale, "collect.buy.chooseDelivery");
  const display =
    own?.display && !isAddress(own.display) ? own.display : addressLabel;
  return (
    <div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-text-iron-400">
        <span>{t(locale, "collect.buy.deliverTo")}</span>
        <span
          title={address ?? undefined}
          className="tw-break-all tw-text-iron-100"
        >
          {display}
        </span>
        <span aria-hidden="true">·</span>
        <button
          ref={trigger}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-controls={`${id}-delivery`}
          onClick={() => setOpen((current) => !current)}
          className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-text-iron-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "collect.buy.changeDelivery")}
        </button>
      </div>
      {open && (
        <fieldset
          id={`${id}-delivery`}
          disabled={disabled}
          className="tw-m-0 tw-min-w-0 tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-p-4"
        >
          <CollectRecipientPicker
            profile={profile}
            {...(payingWallet ? { payingWallet } : {})}
            value={value}
            invalid={invalid}
            errorId={errorId}
            onChange={onChange}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            {t(locale, "collect.buy.doneDelivery")}
          </Button>
        </fieldset>
      )}
    </div>
  );
}
