"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId } from "react";
import { getAddress, isAddress, zeroAddress } from "viem";
import CollectDeliveryControl from "./CollectDeliveryControl";
import type { CollectBatchAllocation } from "./collect-batch.types";
import { isCollectProfileWallet } from "./collect-recipient.helpers";

export default function CollectBatchDestination({
  allocation,
  profile,
  payingWallet,
  disabled,
  onChange,
}: {
  readonly allocation: CollectBatchAllocation;
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string | undefined;
  readonly disabled: boolean;
  readonly onChange: (allocation: CollectBatchAllocation) => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const recipient = allocation.recipient;
  const external =
    recipient.length > 0 && !isCollectProfileWallet(profile, recipient);
  const address =
    isAddress(recipient) && recipient.toLowerCase() !== zeroAddress
      ? getAddress(recipient)
      : null;
  return (
    <div className="tw-space-y-2">
      <CollectDeliveryControl
        profile={profile}
        {...(payingWallet ? { payingWallet } : {})}
        value={recipient}
        disabled={disabled}
        invalid={recipient.length > 0 && address === null}
        errorId={`${id}-recipient`}
        onChange={(value) =>
          onChange({
            ...allocation,
            recipient: value,
            acknowledgeExternalRecipient: false,
          })
        }
      />
      {recipient.length > 0 && address === null && (
        <p
          id={`${id}-recipient`}
          role="alert"
          className="tw-m-0 tw-text-xs tw-text-red"
        >
          {t(locale, "collect.batchReview.invalid.recipient")}
        </p>
      )}
      {external && address !== null && (
        <label className="tw-flex tw-min-h-11 tw-items-start tw-gap-3 tw-text-xs tw-leading-5 tw-text-iron-300">
          <input
            type="checkbox"
            checked={allocation.acknowledgeExternalRecipient}
            disabled={disabled}
            className="tw-mt-1 tw-size-4 tw-shrink-0 tw-accent-primary-500"
            onChange={(event) =>
              onChange({
                ...allocation,
                acknowledgeExternalRecipient: event.target.checked,
              })
            }
          />
          <span>
            {t(locale, "collect.trade.acknowledgeExternal")}
            <span className="tw-block tw-break-all tw-font-mono">
              {address}
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
