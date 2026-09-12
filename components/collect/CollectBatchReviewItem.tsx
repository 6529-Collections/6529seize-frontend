"use client";

import Button from "@/components/utils/button/Button";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useId } from "react";
import CollectAssetMedia from "./CollectAssetMedia";
import CollectBatchDestination from "./CollectBatchDestination";
import {
  collectAllocationIssue,
  collectAllocationQuantity,
  collectBatchEthAmount,
} from "./collect-batch-review.helpers";
import type { CollectBatchAllocation } from "./collect-batch.types";
import { collectBuyAmount } from "./collect-buy.helpers";
import type { CollectSelectedListing } from "./collect-selection.helpers";

export default function CollectBatchReviewItem({
  item,
  selected,
  allocations,
  customized,
  profile,
  payingWallet,
  disabled,
  canAddAllocation,
  onToggle,
  onChange,
  onReset,
}: {
  readonly item: CollectSelectedListing;
  readonly selected: boolean;
  readonly allocations: readonly CollectBatchAllocation[];
  readonly customized: boolean;
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string | undefined;
  readonly disabled: boolean;
  readonly canAddAllocation: boolean;
  readonly onToggle: () => void;
  readonly onChange: (allocations: readonly CollectBatchAllocation[]) => void;
  readonly onReset: () => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const amount = collectBuyAmount(item.order, item.quantity);
  const copies = collectAllocationQuantity(item.quantity);
  const canSplit =
    item.asset.family === ApiCollectFamily.Memes &&
    copies !== null &&
    copies > 1n;
  const donor = allocations.findIndex((allocation) => {
    const quantity = collectAllocationQuantity(allocation.quantity);
    return quantity !== null && quantity > 1n;
  });
  const issue = collectAllocationIssue(allocations, item.quantity, profile);
  const update = (index: number, value: CollectBatchAllocation) =>
    onChange(
      allocations.map((allocation, position) =>
        position === index ? value : allocation
      )
    );
  return (
    <li className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-4">
      <div className="tw-flex tw-items-start tw-gap-3">
        <label className="tw-flex tw-min-h-11 tw-min-w-11 tw-cursor-pointer tw-items-center tw-justify-center">
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            onChange={onToggle}
            aria-label={t(locale, "collect.batchReview.selectItem", {
              title: item.asset.name,
            })}
            className="tw-size-4 tw-accent-primary-500"
          />
        </label>
        <div className="tw-relative tw-flex tw-size-14 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
          <CollectAssetMedia
            src={item.asset.image_url}
            name={item.asset.name}
          />
        </div>
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1">
          <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
            {item.asset.name}
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.batchReview.itemDetail", {
              token: item.asset.token_id,
              quantity: formatDecimalString(locale, item.quantity),
            })}
          </p>
          <p className="tw-m-0 tw-break-words tw-text-sm tw-tabular-nums tw-text-iron-200">
            {amount === null
              ? t(locale, "collect.buy.listingChanged")
              : collectBatchEthAmount(locale, amount)}
          </p>
        </div>
      </div>
      {selected && (
        <div className="tw-mt-2 tw-space-y-3 sm:tw-pl-14">
          {!customized && (
            <button
              type="button"
              disabled={disabled}
              aria-label={t(
                locale,
                "collect.batchReview.customizeDeliveryFor",
                {
                  title: item.asset.name,
                }
              )}
              onClick={() => onChange(allocations)}
              className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-text-iron-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "collect.batchReview.customizeDelivery")}
            </button>
          )}
          {customized && (
            <fieldset
              disabled={disabled}
              className="tw-m-0 tw-min-w-0 tw-space-y-3 tw-border-0 tw-p-0"
            >
              <legend className="tw-sr-only">
                {t(locale, "collect.batchReview.deliveryFor", {
                  title: item.asset.name,
                })}
              </legend>
              {allocations.map((allocation, index) => (
                <div key={`${id}-${index}`} className="tw-space-y-2">
                  {allocations.length > 1 && (
                    <label className="tw-flex tw-items-center tw-gap-3 tw-text-xs tw-text-iron-300">
                      <span>
                        {t(locale, "collect.batchReview.destinationQuantity", {
                          number: index + 1,
                        })}
                      </span>
                      <input
                        value={allocation.quantity}
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={78}
                        aria-invalid={issue === "quantity"}
                        aria-describedby={
                          issue === "quantity" ? `${id}-issue` : undefined
                        }
                        onChange={(event) =>
                          update(index, {
                            ...allocation,
                            quantity: event.target.value,
                          })
                        }
                        className="tw-min-h-11 tw-w-20 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-center tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                      />
                    </label>
                  )}
                  <CollectBatchDestination
                    allocation={allocation}
                    profile={profile}
                    payingWallet={payingWallet}
                    disabled={disabled}
                    onChange={(value) => update(index, value)}
                  />
                </div>
              ))}
              {issue !== null && issue !== "consent" && (
                <p
                  id={`${id}-issue`}
                  role="alert"
                  className="tw-m-0 tw-text-xs tw-text-red"
                >
                  {t(locale, `collect.batchReview.invalid.${issue}`, {
                    quantity: formatDecimalString(locale, item.quantity),
                  })}
                </p>
              )}
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {allocations.length > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const first = allocations[0];
                      const last = allocations.at(-1);
                      if (!first || !last) return;
                      const firstCount = collectAllocationQuantity(
                        first.quantity
                      );
                      const lastCount = collectAllocationQuantity(
                        last.quantity
                      );
                      onChange(
                        allocations.slice(0, -1).map((allocation, index) =>
                          index === 0 &&
                          firstCount !== null &&
                          lastCount !== null
                            ? {
                                ...allocation,
                                quantity: (firstCount + lastCount).toString(),
                              }
                            : allocation
                        )
                      );
                    }}
                  >
                    {t(locale, "collect.batchReview.removeDestination")}
                  </Button>
                )}
                {canSplit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canAddAllocation || donor < 0}
                    onClick={() => {
                      const source = allocations[donor];
                      if (!source || donor < 0 || !canAddAllocation) return;
                      const quantity = collectAllocationQuantity(
                        source.quantity
                      );
                      if (quantity === null || quantity <= 1n) return;
                      onChange([
                        ...allocations.map((allocation, index) =>
                          index === donor
                            ? {
                                ...allocation,
                                quantity: (quantity - 1n).toString(),
                              }
                            : allocation
                        ),
                        {
                          recipient: "",
                          quantity: "1",
                          acknowledgeExternalRecipient: false,
                        },
                      ]);
                    }}
                  >
                    {t(locale, "collect.batchReview.addDestination")}
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={onReset}>
                  {t(locale, "collect.batchReview.useDefaultDelivery")}
                </Button>
              </div>
            </fieldset>
          )}
        </div>
      )}
    </li>
  );
}
