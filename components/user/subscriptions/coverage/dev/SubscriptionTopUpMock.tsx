"use client";

import { useMemo, useRef, useState } from "react";
import { formatEther, parseEther } from "viem";
import { BoltIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import {
  displayedEonNumberFromIndex,
  displayedEpochNumberFromIndex,
  displayedEraNumberFromIndex,
  displayedPeriodNumberFromIndex,
  displayedSeasonNumberFromIndex,
  displayedYearNumberFromIndex,
  getCardsRemainingUntilEndOf,
  getSeasonIndexForDate,
  nextMintDateOnOrAfter,
} from "@/components/meme-calendar/meme-calendar.helpers";
import {
  MEMES_MINT_PRICE,
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_ADDRESS_ENS,
} from "@/constants/constants";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { formatAddress } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import CardCountOption from "../../SubscriptionTopUpOption";
import {
  getTopUpOptionClass,
  TOP_UP_RADIO_CLASS,
} from "../../subscriptionTopUpStyles";
import { formatSubscriptionEth } from "../subscriptionCoverage.helpers";

const PRICE_WEI = parseEther(MEMES_MINT_PRICE.toString());
const PREVIEW_NOTICE = "Preview only. No account changes or payments are made.";

/** Local design preview: shared controls, with no wallet or payment hooks. */
export default function SubscriptionTopUpMock({
  coverage,
  isOpen,
  onClose,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  isOpen: boolean;
  onClose: () => void;
}>) {
  const locale = useBrowserLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [customCount, setCustomCount] = useState("");
  const [showDeep, setShowDeep] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const periods = useMemo(() => {
    const index = getSeasonIndexForDate(nextMintDateOnOrAfter());
    return [
      {
        id: "szn",
        label: "SZN",
        number: displayedSeasonNumberFromIndex(index),
      },
      {
        id: "year",
        label: "Year",
        number: displayedYearNumberFromIndex(index),
      },
      {
        id: "epoch",
        label: "Epoch",
        number: displayedEpochNumberFromIndex(index),
      },
      {
        id: "period",
        label: "Period",
        number: displayedPeriodNumberFromIndex(index),
      },
      { id: "era", label: "Era", number: displayedEraNumberFromIndex(index) },
      { id: "eon", label: "Eon", number: displayedEonNumberFromIndex(index) },
    ].map((period) => ({
      ...period,
      count: getCardsRemainingUntilEndOf(
        period.id as "szn" | "year" | "epoch" | "period" | "era" | "eon"
      ),
    }));
  }, []);
  const recommended = coverage?.recommended_top_up;
  const minimum = coverage?.minimum_top_up;
  const fundingOptions = [
    ...(recommended
      ? [
          {
            id: "recommended",
            label: t(locale, "subscriptions.topUp.recommended"),
            count: recommended.additional_mints,
            amount: recommended.amount_eth,
            drops: recommended.target_fully_funded_drops,
            token: recommended.projected_through.token_id,
          },
        ]
      : []),
    ...(minimum && minimum.amount_eth !== recommended?.amount_eth
      ? [
          {
            id: "minimum",
            label: t(locale, "subscriptions.topUp.minimum"),
            count: minimum.additional_mints,
            amount: minimum.amount_eth,
            drops: minimum.resulting_fully_funded_drops,
            token: minimum.projected_through.token_id,
          },
        ]
      : []),
  ];
  const selectedFunding = fundingOptions.find(
    (option) => option.id === selected
  );
  const count =
    selected === "other"
      ? Number.parseInt(customCount, 10)
      : selected === "1"
        ? 1
        : periods.find((period) => period.id === selected)?.count;
  const amount =
    selectedFunding?.amount ??
    (count !== undefined && Number.isSafeInteger(count) && count > 0
      ? formatEther(BigInt(count) * PRICE_WEI)
      : null);
  const submitLabel =
    amount === null
      ? t(locale, "subscriptions.topUp.chooseAmount")
      : t(locale, "subscriptions.topUp.submit", {
          amount: formatSubscriptionEth(locale, amount),
        });
  const select = (id: string) => {
    setSelected(id);
    setSubmitted(false);
  };
  const periodOption = (period: (typeof periods)[number]) =>
    period.count > 0 && (
      <CardCountOption
        key={period.id}
        id={`subscription-top-up-${period.id}`}
        count={period.count}
        amountEth={formatEther(BigInt(period.count) * PRICE_WEI)}
        display={t(locale, "subscriptions.topUp.remaining", {
          period: period.label,
          number: formatInteger(locale, period.number),
        })}
        selected={selected === period.id}
        onSelect={() => select(period.id)}
      />
    );

  return (
    <MobileWrapperDialog
      id="profile-subscriptions-top-up"
      title={t(locale, "subscriptions.page.topUpTitle")}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      tall
      fitVisualViewport
      focusTitleOnOpen
      maxWidthClass="md:tw-max-w-lg"
      headerClassName="!tw-px-5 md:!tw-px-6"
      titleClassName="!tw-text-lg !tw-font-semibold"
    >
      <div className="tw-px-5 md:tw-px-6">
        <p className="tw-mb-4 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "subscriptions.topUp.chooseAmount")}
        </p>
        <div className="tw-grid tw-grid-cols-1 tw-gap-2">
          {fundingOptions.map((option) => (
            <CardCountOption
              key={option.id}
              id={`subscription-top-up-${option.id}`}
              count={option.count}
              amountEth={option.amount}
              badge={option.label}
              description={t(
                locale,
                option.drops === 1
                  ? "subscriptions.topUp.coversDrops.one"
                  : "subscriptions.topUp.coversDrops.many",
                {
                  count: formatInteger(locale, option.drops),
                  token: formatInteger(locale, option.token),
                }
              )}
              selected={selected === option.id}
              onSelect={() => select(option.id)}
            />
          ))}
          <CardCountOption
            id="subscription-top-up-1"
            count={1}
            amountEth={formatEther(PRICE_WEI)}
            selected={selected === "1"}
            onSelect={() => select("1")}
          />
          {periods.slice(0, 3).map(periodOption)}
          <div className={getTopUpOptionClass(selected === "other")}>
            <label
              htmlFor="subscription-top-up-other"
              className="tw-absolute tw-inset-0 tw-cursor-pointer tw-rounded-xl"
            >
              <span className="tw-sr-only">
                {t(locale, "subscriptions.topUp.customLabel")}
              </span>
            </label>
            <span className="tw-col-start-1 tw-row-span-2 tw-row-start-1 tw-flex">
              <input
                id="subscription-top-up-other"
                type="radio"
                name="subscription-top-up-card-count"
                checked={selected === "other"}
                onChange={() => {
                  select("other");
                  input.current?.focus();
                }}
                aria-label={t(locale, "subscriptions.topUp.other")}
                className={TOP_UP_RADIO_CLASS}
              />
            </span>
            <span className="tw-pointer-events-none tw-col-start-2 tw-row-start-1 tw-self-end tw-text-[15px] tw-font-medium tw-text-iron-100">
              {t(locale, "subscriptions.topUp.other")}
            </span>
            <input
              ref={input}
              type="number"
              min={1}
              inputMode="numeric"
              aria-label={t(locale, "subscriptions.topUp.customLabel")}
              placeholder={t(locale, "subscriptions.topUp.countPlaceholder")}
              value={customCount}
              onFocus={() => select("other")}
              onChange={(event) => {
                setCustomCount(event.target.value);
                select("other");
              }}
              className="tw-relative tw-col-start-3 tw-row-span-2 tw-row-start-1 tw-min-h-11 tw-w-24 tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-[15px] tw-font-medium tw-tabular-nums tw-text-iron-100 [color-scheme:dark] placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/25 sm:tw-w-28"
            />
            <span
              role="status"
              className="tw-pointer-events-none tw-col-start-2 tw-row-start-2 tw-self-start tw-text-sm tw-tabular-nums tw-text-primary-300"
            >
              {selected === "other" &&
                amount !== null &&
                t(locale, "subscriptions.coverage.balanceEth", {
                  amount: formatSubscriptionEth(locale, amount),
                })}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={showDeep}
          aria-controls="subscription-top-up-deep-time"
          onClick={() => setShowDeep(!showDeep)}
          className="tw-mt-3 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-text-meta tw-font-normal tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(
            locale,
            showDeep
              ? "subscriptions.topUp.hideDeepTime"
              : "subscriptions.topUp.showDeepTime"
          )}
          <ChevronDownIcon
            aria-hidden
            className={`tw-size-4 ${showDeep ? "tw-rotate-180" : ""}`}
          />
        </button>
        <div id="subscription-top-up-deep-time" hidden={!showDeep}>
          <div className="tw-mt-2 tw-grid tw-grid-cols-1 tw-gap-2">
            {periods.slice(3).map(periodOption)}
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={amount === null}
          onClick={() => setSubmitted(true)}
          fullWidth
          className="tw-mt-5 !tw-text-[15px] md:!tw-text-sm"
        >
          <BoltIcon className="tw-size-4" aria-hidden />
          {submitLabel}
        </Button>
        <div className="tw-mb-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-1 tw-text-meta tw-text-iron-500">
          {t(locale, "subscriptions.topUp.sendingTo")}{" "}
          <span className="tw-font-semibold tw-text-iron-300">
            {SUBSCRIPTIONS_ADDRESS_ENS}
          </span>
          <button
            type="button"
            data-tooltip-id="top-up-preview-address"
            aria-label={SUBSCRIPTIONS_ADDRESS}
            className="tw-min-h-8 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-meta tw-text-iron-400"
          >
            {formatAddress(SUBSCRIPTIONS_ADDRESS)}
          </button>
          <BodyPortalTooltip
            id="top-up-preview-address"
            openEvents={{ mouseover: true, focus: true, click: true }}
            style={TOOLTIP_STYLES}
          >
            {SUBSCRIPTIONS_ADDRESS}
          </BodyPortalTooltip>
        </div>
        <p
          role={submitted ? "status" : undefined}
          className="tw-mb-0 tw-mt-3 tw-text-center tw-text-xs tw-text-primary-300"
        >
          {PREVIEW_NOTICE}
        </p>
      </div>
    </MobileWrapperDialog>
  );
}
