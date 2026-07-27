"use client";

import { BoltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Tooltip } from "react-tooltip";
import { formatEther, parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import OnchainTransactionModal, {
  type OnchainTransactionModalStatus,
} from "@/components/common/OnchainTransactionModal";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
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
import ShowMoreButton from "@/components/show-more-button/ShowMoreButton";
import {
  MEMES_MINT_PRICE,
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_ADDRESS_ENS,
  SUBSCRIPTIONS_CHAIN,
} from "@/constants/constants";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { formatAddress } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import styles from "./UserPageSubscriptions.module.css";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";
import { formatSubscriptionEth } from "./coverage/subscriptionCoverage.helpers";

const MEMES_MINT_PRICE_WEI = parseEther(MEMES_MINT_PRICE.toString());

function getEthForCards(count: number): string {
  return formatEther(BigInt(count) * MEMES_MINT_PRICE_WEI);
}

function getCardCountLabel(
  locale: ReturnType<typeof useBrowserLocale>,
  count: number
): string {
  const messageKey =
    count === 1
      ? "subscriptions.topUp.cardCount.one"
      : "subscriptions.topUp.cardCount.many";
  return t(locale, messageKey, {
    count: formatInteger(locale, count),
  });
}

function getTopUpTransactionErrorMessage(
  transactionError: Error | null | undefined
): string {
  const message = transactionError?.message
    .split("Request Arguments")[0]
    ?.trim();
  return message ? `Error - ${message}` : "Transaction failed";
}

interface TopUpTransactionModalInput {
  readonly localError: string;
  readonly sendIsPending: boolean;
  readonly sendErrorMessage: string | undefined;
  readonly receiptIsLoading: boolean;
  readonly receiptIsSuccess: boolean;
  readonly receiptHasError: boolean;
  readonly receiptErrorMessage: string | undefined;
}

interface TopUpTransactionModalState {
  readonly closable: boolean;
  readonly message: string | undefined;
  readonly status: OnchainTransactionModalStatus | null;
}

function getTopUpTransactionModalStatus(
  input: TopUpTransactionModalInput
): OnchainTransactionModalStatus | null {
  if (input.localError || input.sendErrorMessage || input.receiptHasError) {
    return "error";
  }
  if (input.sendIsPending) {
    return "confirm_wallet";
  }
  if (input.receiptIsLoading) {
    return "submitted";
  }
  if (input.receiptIsSuccess) {
    return "success";
  }
  return null;
}

function getTopUpTransactionModalMessage(
  status: OnchainTransactionModalStatus | null,
  input: TopUpTransactionModalInput
): string | undefined {
  if (status === "success") {
    return "Top Up Successful!";
  }
  if (status !== "error") {
    return undefined;
  }
  if (input.localError) {
    return input.localError;
  }
  return input.sendErrorMessage ?? input.receiptErrorMessage;
}

function getTopUpTransactionModalState(
  input: TopUpTransactionModalInput
): TopUpTransactionModalState {
  const status = getTopUpTransactionModalStatus(input);
  return {
    closable:
      input.receiptIsSuccess ||
      Boolean(input.localError) ||
      input.sendErrorMessage !== undefined ||
      input.receiptHasError,
    message: getTopUpTransactionModalMessage(status, input),
    status,
  };
}

const TOP_UP_OPTION_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4";
const TOP_UP_DEEP_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3";
const TOP_UP_OPTION_SURFACE_CLASS =
  "tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-text-left tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-inset";
const TOP_UP_OPTION_CLASS = `${TOP_UP_OPTION_SURFACE_CLASS} tw-w-full tw-p-4 tw-transition-all tw-duration-500 tw-ease-out motion-reduce:tw-transform-none motion-reduce:tw-transition-none desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-shadow-2xl desktop-hover:hover:tw-shadow-black/50`;
const TOP_UP_CUSTOM_OPTION_CLASS = `${TOP_UP_OPTION_SURFACE_CLASS} tw-w-full tw-px-3 tw-py-2`;

interface TopUpSelection {
  readonly amountEth: string;
  readonly count: number;
}

interface TopUpSelectionInput {
  readonly coverage: ApiSubscriptionCoverage | undefined;
  readonly customCount: string;
  readonly option: string | null;
  readonly optionCounts: Readonly<Record<string, number>>;
}

function getTopUpSelection({
  coverage,
  customCount,
  option,
  optionCounts,
}: TopUpSelectionInput): TopUpSelection | null {
  if (option === "recommended" && coverage?.recommended_top_up) {
    return {
      amountEth: coverage.recommended_top_up.amount_eth,
      count: coverage.recommended_top_up.additional_mints,
    };
  }
  if (option === "minimum" && coverage?.minimum_top_up) {
    return {
      amountEth: coverage.minimum_top_up.amount_eth,
      count: coverage.minimum_top_up.additional_mints,
    };
  }
  if (option === "other") {
    const count = Number.parseInt(customCount, 10);
    return Number.isNaN(count) || count < 1
      ? null
      : { amountEth: getEthForCards(count), count };
  }
  if (option === null) {
    return null;
  }
  const count = optionCounts[option];
  return count === undefined || count < 1
    ? null
    : { amountEth: getEthForCards(count), count };
}

function getTopUpOptionStateClass(
  selected: boolean,
  featured: boolean
): string {
  if (selected) {
    return featured
      ? "tw-bg-primary-500/15 tw-ring-primary-300/45"
      : "tw-bg-iron-900 tw-ring-white/[0.05]";
  }
  return featured
    ? "tw-bg-primary-500/[0.08] tw-ring-primary-400/25"
    : "tw-bg-iron-950 tw-ring-white/[0.03]";
}

function CoverageTopUpOptions({
  coverage,
  onSelect,
  selectedOption,
}: Readonly<{
  coverage: ApiSubscriptionCoverage | undefined;
  onSelect: (option: "minimum" | "recommended") => void;
  selectedOption: string | null;
}>) {
  const locale = useBrowserLocale();
  const recommendedTopUp = coverage?.recommended_top_up ?? null;
  const minimumTopUp = coverage?.minimum_top_up ?? null;
  const showMinimumTopUp =
    minimumTopUp !== null &&
    minimumTopUp.amount_eth !== recommendedTopUp?.amount_eth;

  if (recommendedTopUp === null && !showMinimumTopUp) {
    return null;
  }

  return (
    <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
      {recommendedTopUp !== null ? (
        <CardCountOption
          id="subscription-top-up-recommended"
          count={recommendedTopUp.additional_mints}
          amountEth={recommendedTopUp.amount_eth}
          badge={t(locale, "subscriptions.topUp.recommended")}
          description={getCoverageTopUpDescription(
            locale,
            recommendedTopUp.target_fully_funded_drops,
            recommendedTopUp.projected_through.token_id
          )}
          featured
          selected={selectedOption === "recommended"}
          onSelect={() => {
            onSelect("recommended");
          }}
        />
      ) : null}
      {showMinimumTopUp ? (
        <CardCountOption
          id="subscription-top-up-minimum"
          count={minimumTopUp.additional_mints}
          amountEth={minimumTopUp.amount_eth}
          badge={t(locale, "subscriptions.topUp.minimum")}
          description={getCoverageTopUpDescription(
            locale,
            minimumTopUp.resulting_fully_funded_drops,
            minimumTopUp.projected_through.token_id
          )}
          selected={selectedOption === "minimum"}
          onSelect={() => {
            onSelect("minimum");
          }}
        />
      ) : null}
    </div>
  );
}

function getCoverageTopUpDescription(
  locale: ReturnType<typeof useBrowserLocale>,
  fundedDrops: number,
  tokenId: number
): string {
  const messageKey =
    fundedDrops === 1
      ? "subscriptions.topUp.coversDrops.one"
      : "subscriptions.topUp.coversDrops.many";
  return t(locale, messageKey, {
    count: formatInteger(locale, fundedDrops),
    token: formatInteger(locale, tokenId),
  });
}

export default function UserPageSubscriptionsTopUp({
  coverage,
  onTransactionConfirmed,
}: Readonly<{
  coverage?: ApiSubscriptionCoverage | undefined;
  onTransactionConfirmed?: (() => void) | undefined;
}>) {
  const { isIos } = useCapacitor();
  const locale = useBrowserLocale();
  const { country } = useCookieConsent();
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });
  const [memeCount, setMemeCount] = useState<string>("");
  const sendTransaction = useSendTransaction();

  const nextMintDate = nextMintDateOnOrAfter();
  const idx = getSeasonIndexForDate(nextMintDate);
  const szn = displayedSeasonNumberFromIndex(idx);
  const year = displayedYearNumberFromIndex(idx);
  const epoch = displayedEpochNumberFromIndex(idx);
  const period = displayedPeriodNumberFromIndex(idx);
  const era = displayedEraNumberFromIndex(idx);
  const eon = displayedEonNumberFromIndex(idx);

  const { isConnected } = useSeizeConnectContext();

  const remainingMintsForSeason = getCardsRemainingUntilEndOf("szn");
  const remainingMintsForYear = getCardsRemainingUntilEndOf("year");
  const remainingMintsForEpoch = getCardsRemainingUntilEndOf("epoch");
  const remainingMintsForPeriod = getCardsRemainingUntilEndOf("period");
  const remainingMintsForEra = getCardsRemainingUntilEndOf("era");
  const remainingMintsForEon = getCardsRemainingUntilEndOf("eon");

  const waitSendTransaction = useWaitForTransactionReceipt({
    chainId: SUBSCRIPTIONS_CHAIN.id,
    confirmations: 1,
    hash: sendTransaction.data,
  });

  const [error, setError] = useState<string>("");
  const [showDeep, setShowDeep] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string | null>(null);
  const [topUpCardCount, setTopUpCardCount] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);
  const confirmedHashRef = useRef<string | undefined>(undefined);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleSelectOther = useCallback(() => {
    setSelectedOption("other");
    setError("");
    otherInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (
      !waitSendTransaction.isSuccess ||
      !sendTransaction.data ||
      confirmedHashRef.current === sendTransaction.data
    ) {
      return;
    }
    confirmedHashRef.current = sendTransaction.data;
    onTransactionConfirmed?.();
  }, [
    onTransactionConfirmed,
    sendTransaction.data,
    waitSendTransaction.isSuccess,
  ]);

  const optionCounts: Readonly<Record<string, number>> = {
    "1": 1,
    szn: remainingMintsForSeason,
    year: remainingMintsForYear,
    epoch: remainingMintsForEpoch,
    period: remainingMintsForPeriod,
    era: remainingMintsForEra,
    eon: remainingMintsForEon,
  };
  const selectedTopUp = getTopUpSelection({
    coverage,
    customCount: memeCount,
    option: selectedOption,
    optionCounts,
  });

  function handleSend(): void {
    setError("");
    if (selectedTopUp === null) {
      setError(t(locale, "subscriptions.topUp.validation.selectOption"));
      return;
    }
    if (!isConnected) {
      setError(t(locale, "subscriptions.topUp.validation.wallet"));
      return;
    }
    setTopUpAmount(selectedTopUp.amountEth);
    setTopUpCardCount(selectedTopUp.count);
    sendTransaction.reset();
    sendTransaction.sendTransaction({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(selectedTopUp.amountEth),
    });
  }

  const sendTransactionErrorMessage = sendTransaction.error
    ? getTopUpTransactionErrorMessage(sendTransaction.error)
    : undefined;
  const receiptErrorMessage = waitSendTransaction.error
    ? getTopUpTransactionErrorMessage(waitSendTransaction.error)
    : undefined;
  const transactionModal = getTopUpTransactionModalState({
    localError: error,
    sendIsPending: sendTransaction.isPending,
    sendErrorMessage: sendTransactionErrorMessage,
    receiptIsLoading: waitSendTransaction.isLoading,
    receiptIsSuccess: waitSendTransaction.isSuccess,
    receiptHasError:
      waitSendTransaction.isError || receiptErrorMessage !== undefined,
    receiptErrorMessage,
  });

  const closeModal = useCallback(() => {
    if (transactionModal.closable) {
      sendTransaction.reset();
      setError("");
      setTopUpAmount(null);
      setTopUpCardCount(null);
      setSelectedOption(null);
      setMemeCount("");
    }
  }, [transactionModal.closable, sendTransaction]);

  let modalSubtitle: string | undefined;
  if (topUpAmount !== null && topUpCardCount !== null) {
    const modalSubtitleKey =
      topUpCardCount === 1
        ? "subscriptions.topUp.modalSubtitle.one"
        : "subscriptions.topUp.modalSubtitle.many";
    modalSubtitle = t(locale, modalSubtitleKey, {
      amount: formatSubscriptionEth(locale, topUpAmount),
      count: formatInteger(locale, topUpCardCount),
    });
  }

  if (hideSubscriptions) {
    return <></>;
  }

  const isSending = sendTransaction.isPending || waitSendTransaction.isLoading;
  const selectedAmount = selectedTopUp?.amountEth ?? null;
  const isSendDisabled = selectedTopUp === null;
  const submitLabel =
    selectedAmount === null
      ? t(locale, "subscriptions.topUp.chooseAmount")
      : t(locale, "subscriptions.topUp.submit", {
          amount: formatSubscriptionEth(locale, selectedAmount),
        });
  const selectCoverageTopUp = (option: "minimum" | "recommended"): void => {
    setSelectedOption(option);
    setMemeCount("");
    setError("");
  };

  const iOsContent = mounted ? (
    <Link
      href={window.location.href}
      className="tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-300 tw-bg-iron-100 tw-px-3 tw-py-2 tw-font-semibold tw-text-iron-950 tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      target="_blank"
      rel="noopener noreferrer"
    >
      Top-up on 6529.io
    </Link>
  ) : null;

  const printRemainingMints = (
    count: number,
    label: string,
    value: number,
    optionId: string
  ) => {
    if (count > 0) {
      return (
        <div>
          <CardCountOption
            id={`subscription-top-up-${optionId}`}
            count={count}
            display={`Remaining ${label} ${formatInteger(locale, value)}`}
            selected={selectedOption === optionId}
            onSelect={() => {
              setSelectedOption(optionId);
              setMemeCount("");
              setError("");
            }}
          />
        </div>
      );
    }
    return null;
  };
  const topUpContent = (
    <>
      <CoverageTopUpOptions
        coverage={coverage}
        selectedOption={selectedOption}
        onSelect={selectCoverageTopUp}
      />
      <div className={TOP_UP_OPTION_GRID_CLASS}>
        <div>
          <CardCountOption
            id="subscription-top-up-1"
            count={1}
            selected={selectedOption === "1"}
            onSelect={() => {
              setSelectedOption("1");
              setMemeCount("");
              setError("");
            }}
          />
        </div>
        {printRemainingMints(remainingMintsForSeason, "SZN", szn, "szn")}
        {printRemainingMints(remainingMintsForYear, "Year", year, "year")}
        {printRemainingMints(remainingMintsForEpoch, "Epoch", epoch, "epoch")}
      </div>
      {showDeep && (
        <div className={`${TOP_UP_DEEP_GRID_CLASS} tw-mt-3`}>
          {printRemainingMints(
            remainingMintsForPeriod,
            "Period",
            period,
            "period"
          )}
          {printRemainingMints(remainingMintsForEra, "Era", era, "era")}
          {printRemainingMints(remainingMintsForEon, "Eon", eon, "eon")}
        </div>
      )}
      <div className="tw-mt-2 tw-flex tw-justify-start">
        <ShowMoreButton
          expanded={showDeep}
          setExpanded={setShowDeep}
          showMoreLabel="Show Deep Time Subscriptions"
          showLessLabel="Hide Deep Time Subscriptions"
          variant="inline"
        />
      </div>
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center">
          <div
            className={`${TOP_UP_CUSTOM_OPTION_CLASS} ${
              selectedOption === "other"
                ? "tw-bg-iron-900 tw-ring-white/[0.05]"
                : "tw-bg-iron-950 tw-ring-white/[0.03]"
            }`}
          >
            <label
              htmlFor="subscription-top-up-other"
              className="tw-absolute tw-inset-0 tw-z-0 tw-cursor-pointer tw-rounded-xl"
            >
              <span className="tw-sr-only">Select Other card count</span>
            </label>
            <div className="tw-pointer-events-none tw-relative tw-z-10 tw-flex tw-min-h-10 tw-items-center tw-gap-2 tw-pr-7">
              <span className="tw-pointer-events-auto tw-absolute tw-right-0 tw-top-1/2 tw-flex -tw-translate-y-1/2">
                <input
                  id="subscription-top-up-other"
                  type="radio"
                  name="subscription-top-up-card-count"
                  value="other"
                  checked={selectedOption === "other"}
                  onChange={handleSelectOther}
                  aria-label="Other card count"
                  className={styles["radioInput"]}
                />
              </span>
              <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
                Other
              </span>
              <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                <input
                  ref={otherInputRef}
                  type="number"
                  min={1}
                  placeholder="count"
                  aria-label="Custom card count"
                  value={memeCount}
                  className="tw-pointer-events-auto tw-min-h-10 tw-w-36 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-black/30 tw-px-2.5 tw-py-1 tw-text-sm tw-text-iron-100 tw-transition [color-scheme:dark] placeholder:tw-text-iron-600 placeholder:tw-opacity-100 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/25"
                  onFocus={() => {
                    setSelectedOption("other");
                  }}
                  onChange={(e) => {
                    setError("");
                    const value = e.target.value;
                    setMemeCount(value);
                    setSelectedOption("other");
                  }}
                />
                <span
                  aria-live="polite"
                  className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400"
                >
                  {!Number.isNaN(Number.parseInt(memeCount, 10)) &&
                    Number.parseInt(memeCount, 10) > 0 && (
                      <>
                        (
                        {t(locale, "subscriptions.coverage.balanceEth", {
                          amount: formatSubscriptionEth(
                            locale,
                            getEthForCards(Number.parseInt(memeCount, 10))
                          ),
                        })}
                        )
                      </>
                    )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-justify-end sm:tw-flex-shrink-0">
          <PrimaryButton
            loading={isSending}
            disabled={isSendDisabled}
            onClicked={handleSend}
            ariaLabel={submitLabel}
            className="tw-min-h-11 tw-w-full sm:tw-w-auto"
          >
            <BoltIcon className="tw-size-4" aria-hidden="true" />
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </>
  );

  return (
    <>
      <UserPageSubscriptionsSection
        id="profile-subscriptions-top-up"
        title={t(locale, "subscriptions.page.topUpTitle")}
        className="tw-scroll-mt-24 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pb-4 tw-pt-8"
        action={
          <span className="tw-inline-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-0.5 tw-rounded-full tw-bg-iron-900/60 tw-px-2.5 tw-py-1 tw-text-xs tw-leading-4 tw-text-iron-500 tw-ring-1 tw-ring-white/10">
            <span>{t(locale, "subscriptions.topUp.sendingTo")}</span>
            <span
              className="tw-break-all tw-text-iron-300"
              data-tooltip-id="subscription-address"
            >
              {SUBSCRIPTIONS_ADDRESS_ENS} {formatAddress(SUBSCRIPTIONS_ADDRESS)}
            </span>
            <Tooltip
              id="subscription-address"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              {SUBSCRIPTIONS_ADDRESS}
            </Tooltip>
          </span>
        }
      >
        {isIos ? iOsContent : topUpContent}
      </UserPageSubscriptionsSection>
      {mounted && transactionModal.status ? (
        <OnchainTransactionModal
          status={transactionModal.status}
          title="Top up"
          subtitle={modalSubtitle}
          message={transactionModal.message}
          transactionHash={sendTransaction.data}
          chain={SUBSCRIPTIONS_CHAIN}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}

function CardCountOption(
  props: Readonly<{
    id: string;
    count: number;
    amountEth?: string | undefined;
    badge?: string | undefined;
    description?: string | undefined;
    display?: string | undefined;
    featured?: boolean | undefined;
    selected: boolean;
    onSelect: () => void;
  }>
) {
  const locale = useBrowserLocale();
  const cardCountLabel = getCardCountLabel(locale, props.count);
  const displayLabel = props.badge ?? props.display;
  const cardOptionMessageKey =
    props.count === 1
      ? "subscriptions.topUp.cardOption.one"
      : "subscriptions.topUp.cardOption.many";
  const labelText = displayLabel
    ? t(locale, cardOptionMessageKey, {
        count: formatInteger(locale, props.count),
        label: displayLabel,
      })
    : cardCountLabel;
  const amountEth = props.amountEth ?? getEthForCards(props.count);
  const optionStateClass = getTopUpOptionStateClass(
    props.selected,
    props.featured === true
  );

  return (
    <label
      htmlFor={props.id}
      className={`${TOP_UP_OPTION_CLASS} ${optionStateClass} tw-block tw-min-h-[122px] tw-cursor-pointer`}
    >
      <span className="tw-absolute tw-right-4 tw-top-4 tw-flex">
        <input
          id={props.id}
          type="radio"
          name="subscription-top-up-card-count"
          value={props.count}
          checked={props.selected}
          onClick={() => {
            if (props.selected) {
              props.onSelect();
            }
          }}
          onChange={props.onSelect}
          aria-label={labelText}
          className={styles["radioInput"]}
        />
      </span>
      <div className="tw-flex tw-min-h-[90px] tw-min-w-0 tw-flex-col tw-justify-between tw-pr-8">
        {displayLabel && (
          <span
            className={`tw-text-xs tw-font-medium tw-leading-4 ${
              props.selected ? "tw-text-primary-300" : "tw-text-iron-500"
            }`}
          >
            {displayLabel}
          </span>
        )}
        <div className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <span className="tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
            {cardCountLabel}
          </span>
          <span className="tw-flex tw-items-center tw-gap-1.5">
            <span className="tw-text-sm tw-leading-5 tw-text-iron-400">
              {formatSubscriptionEth(locale, amountEth)}
            </span>
            <span className="tw-text-xs tw-text-iron-600">
              {t(locale, "subscriptions.balance.ethUnit")}
            </span>
          </span>
          {props.description ? (
            <span className="tw-mt-1 tw-text-xs tw-leading-4 tw-text-iron-500">
              {props.description}
            </span>
          ) : null}
        </div>
      </div>
    </label>
  );
}
