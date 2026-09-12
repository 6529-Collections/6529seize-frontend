import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useId } from "react";
import {
  Description,
  Field,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type {
  OfferPriceMethod,
  OfferPricingControls,
} from "./collect-offer-plan.types";
import { OFFER_EXPIRY_HOURS } from "./collect-offer-plan.helpers";

export const OFFER_INPUT_CLASS =
  "tw-min-h-11 tw-min-w-0 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

const OFFER_METHODS = {
  manual: "collect.offerPlan.method.manual",
  match_bid: "collect.offerPlan.method.matchBid",
  improve_bid: "collect.offerPlan.method.improveBid",
  discount_ask: "collect.offerPlan.method.discountAsk",
  goal: "collect.offerPlan.method.goal",
} as const;

export default function OfferPlanPricing({
  value,
  disabled,
  error,
  onChange,
}: {
  readonly value: OfferPricingControls;
  readonly disabled: boolean;
  readonly error?: string | undefined;
  readonly onChange: (value: OfferPricingControls) => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const percentage =
    value.method === "improve_bid" || value.method === "discount_ask";
  return (
    <fieldset
      disabled={disabled}
      className="tw-m-0 tw-min-w-0 tw-space-y-3 tw-border-0 tw-p-0"
    >
      <legend className="tw-sr-only">
        {t(locale, "collect.offerPlan.pricing")}
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        <Field className="tw-min-w-0 tw-space-y-2">
          <Listbox
            value={value.method}
            onChange={(method: OfferPriceMethod) =>
              onChange({ ...value, method })
            }
            disabled={disabled}
          >
            <label
              htmlFor={`${id}-method`}
              className="tw-block tw-text-xs tw-text-iron-300"
            >
              {t(locale, "collect.offerPlan.pricing")}
            </label>
            <ListboxButton
              id={`${id}-method`}
              aria-label={t(locale, "collect.offerPlan.pricing")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
              className="tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            >
              <Description as="span" className="tw-min-w-0">
                {t(locale, OFFER_METHODS[value.method])}
              </Description>
              <ChevronDownIcon
                aria-hidden="true"
                className="tw-size-4 tw-shrink-0 tw-text-iron-400"
              />
            </ListboxButton>
            <ListboxOptions
              aria-label={t(locale, "collect.offerPlan.pricing")}
              anchor="bottom start"
              className="tailwind-scope tw-z-50 tw-w-[var(--button-width)] tw-overflow-auto tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-text-sm tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-white/10 [--anchor-gap:0.5rem] focus:tw-outline-none"
            >
              {Object.entries(OFFER_METHODS).map(([method, key]) => (
                <ListboxOption
                  key={method}
                  value={method}
                  className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-px-3 tw-py-2 data-[focus]:tw-bg-iron-800"
                >
                  {({ selected }) => (
                    <>
                      <span className="tw-min-w-0 tw-whitespace-normal">
                        {t(locale, key)}
                      </span>
                      {selected && (
                        <CheckIcon
                          aria-hidden="true"
                          className="tw-size-4 tw-shrink-0 tw-text-iron-300"
                        />
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </Field>
        {percentage && (
          <label className="tw-space-y-2 tw-text-xs tw-text-iron-300">
            <span>
              {t(
                locale,
                value.method === "improve_bid"
                  ? "collect.offerPlan.improvement"
                  : "collect.offerPlan.discount"
              )}
            </span>
            <input
              value={value.percent}
              inputMode="decimal"
              autoComplete="off"
              maxLength={7}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className={OFFER_INPUT_CLASS}
              onChange={(event) =>
                onChange({ ...value, percent: event.target.value })
              }
            />
          </label>
        )}
        {value.method === "goal" && (
          <label className="tw-space-y-2 tw-text-xs tw-text-iron-300">
            <span>{t(locale, "collect.offerPlan.budget")}</span>
            <input
              value={value.budgetEth}
              inputMode="decimal"
              autoComplete="off"
              maxLength={41}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className={OFFER_INPUT_CLASS}
              onChange={(event) =>
                onChange({ ...value, budgetEth: event.target.value })
              }
            />
          </label>
        )}
        <label className="tw-space-y-2 tw-text-xs tw-text-iron-300">
          <span>{t(locale, "collect.offerPlan.defaultExpiry")}</span>
          <select
            className={OFFER_INPUT_CLASS}
            value={value.expiryHours}
            onChange={(event) =>
              onChange({ ...value, expiryHours: event.target.value })
            }
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
      </div>
      <p className="tw-m-0 tw-text-xs tw-leading-relaxed tw-text-iron-400">
        {t(locale, `collect.offerPlan.help.${value.method}`)}
      </p>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="tw-m-0 tw-text-sm tw-text-error"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
