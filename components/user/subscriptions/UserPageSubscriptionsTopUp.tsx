"use client";

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
import ButtonLink from "@/components/utils/button/ButtonLink";
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
  SUBSCRIPTIONS_CHAIN,
} from "@/constants/constants";
import type { ApiSubscriptionCoverage } from "@/generated/models/ApiSubscriptionCoverage";
import { formatAddress } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";
import { formatSubscriptionEth } from "./coverage/subscriptionCoverage.helpers";

const MEMES_MINT_PRICE_WEI = parseEther(MEMES_MINT_PRICE.toString());
// Hash target of the notification and header top-up links.
const TOP_UP_SECTION_ID = "profile-subscriptions-top-up";

function getEthForCards(count: number): string {
  return formatEther(BigInt(Math.trunc(count)) * MEMES_MINT_PRICE_WEI);
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

const TOP_UP_CHIP_CLASS =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-bg-transparent tw-px-4 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 max-md:tw-w-full";

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
  onCancel,
  expanded = true,
}: Readonly<{
  coverage?: ApiSubscriptionCoverage | undefined;
  onTransactionConfirmed?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  expanded?: boolean;
}>) {
  const { isIos } = useCapacitor();
  const locale = useBrowserLocale();
  const { country } = useCookieConsent();
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: isIos,
    country,
  });
  useScrollToHashOnMount(TOP_UP_SECTION_ID, {
    enabled: !hideSubscriptions && expanded,
    focusId: `${TOP_UP_SECTION_ID}-title`,
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
  const [showMore, setShowMore] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string | null>(null);
  const [topUpCardCount, setTopUpCardCount] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const confirmedHashRef = useRef<string | undefined>(undefined);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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
    <ButtonLink
      href={window.location.href}
      variant="primary"
      size="lg"
      fullWidth
      target="_blank"
      rel="noopener noreferrer"
    >
      {t(locale, "subscriptions.topUp.ios")}
    </ButtonLink>
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
            display={t(locale, "subscriptions.topUp.remaining", {
              period: label,
              number: formatInteger(locale, value),
            })}
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
  const recommendation = coverage?.recommended_top_up;
  const minimum = coverage?.minimum_top_up;
  let selectedDescription: string | undefined;
  if (selectedOption === "recommended" && recommendation) {
    selectedDescription = getCoverageTopUpDescription(
      locale,
      recommendation.target_fully_funded_drops,
      recommendation.projected_through.token_id
    );
  } else if (selectedOption === "minimum" && minimum) {
    selectedDescription = getCoverageTopUpDescription(
      locale,
      minimum.resulting_fully_funded_drops,
      minimum.projected_through.token_id
    );
  }
  const topUpContent = (
    <>
      <div className="tw-flex tw-flex-wrap tw-gap-2 max-md:tw-flex-col">
        {recommendation && (
          <CardCountOption
            id="subscription-top-up-recommended"
            count={recommendation.additional_mints}
            amountEth={recommendation.amount_eth}
            display={t(locale, "subscriptions.topUp.recommended")}
            selected={selectedOption === "recommended"}
            onSelect={() => selectCoverageTopUp("recommended")}
          />
        )}
        {minimum && minimum.amount_eth !== recommendation?.amount_eth && (
          <CardCountOption
            id="subscription-top-up-minimum"
            count={minimum.additional_mints}
            amountEth={minimum.amount_eth}
            display={t(locale, "subscriptions.topUp.minimum")}
            selected={selectedOption === "minimum"}
            onSelect={() => selectCoverageTopUp("minimum")}
          />
        )}
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
        {printRemainingMints(remainingMintsForSeason, "SZN", szn, "szn")}
        <label
          className={`${TOP_UP_CHIP_CLASS} ${selectedOption === "other" ? "tw-border-iron-100" : "tw-border-white/20"}`}
        >
          <span>{t(locale, "subscriptions.topUp.other")}</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder={t(locale, "subscriptions.topUp.countPlaceholder")}
            aria-label={t(locale, "subscriptions.topUp.customLabel")}
            value={memeCount}
            className="tw-min-h-7 tw-w-20 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-base tw-tabular-nums tw-text-iron-100 [color-scheme:dark] placeholder:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            onFocus={() => setSelectedOption("other")}
            onChange={(event) => {
              setError("");
              setMemeCount(event.target.value);
              setSelectedOption("other");
            }}
          />
        </label>
        <button
          type="button"
          aria-expanded={showMore}
          aria-controls="subscription-top-up-more"
          onClick={() => setShowMore(!showMore)}
          className={`${TOP_UP_CHIP_CLASS} tw-border-dashed tw-border-white/20 tw-text-iron-300`}
        >
          {t(
            locale,
            showMore ? "subscriptions.topUp.less" : "subscriptions.topUp.more"
          )}
        </button>
      </div>
      <div id="subscription-top-up-more" hidden={!showMore}>
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2 max-md:tw-flex-col">
          {printRemainingMints(remainingMintsForYear, "Year", year, "year")}
          {printRemainingMints(remainingMintsForEpoch, "Epoch", epoch, "epoch")}
        </div>
        <p className="tw-mb-2 tw-mt-4 tw-text-sm tw-text-iron-400">
          {t(locale, "subscriptions.topUp.deepTime")}
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-2 max-md:tw-flex-col">
          {printRemainingMints(
            remainingMintsForPeriod,
            "Period",
            period,
            "period"
          )}
          {printRemainingMints(remainingMintsForEra, "Era", era, "era")}
          {printRemainingMints(remainingMintsForEon, "Eon", eon, "eon")}
        </div>
      </div>
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <p
          aria-live="polite"
          className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-300"
        >
          {selectedDescription}
        </p>
        <div className="tw-flex tw-gap-2 max-md:tw-w-full">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSending}
              className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/20 tw-bg-transparent tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 max-md:tw-flex-1"
            >
              {t(locale, "subscriptions.topUp.cancel")}
            </button>
          )}
          <button
            type="button"
            disabled={isSendDisabled || isSending}
            aria-busy={isSending}
            onClick={handleSend}
            className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white tw-bg-white tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-950 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 max-md:tw-flex-1"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <UserPageSubscriptionsSection
        id={TOP_UP_SECTION_ID}
        title={t(locale, "subscriptions.page.topUpTitle")}
        className="tw-mt-5 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-5"
      >
        {isIos ? (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {iOsContent}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`${TOP_UP_CHIP_CLASS} tw-border-white/20`}
              >
                {t(locale, "subscriptions.topUp.cancel")}
              </button>
            )}
          </div>
        ) : (
          topUpContent
        )}
        <p className="tw-mb-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-1 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "subscriptions.topUp.sendingTo")}{" "}
          <span className="tw-font-medium tw-text-iron-300">
            {SUBSCRIPTIONS_ADDRESS_ENS}
          </span>
          <button
            type="button"
            data-tooltip-id="subscription-address"
            aria-describedby="subscription-address"
            className="tw-min-h-8 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {formatAddress(SUBSCRIPTIONS_ADDRESS)}
          </button>
          <Tooltip
            id="subscription-address"
            openEvents={{ mouseover: true, focus: true, click: true }}
          >
            {SUBSCRIPTIONS_ADDRESS}
          </Tooltip>
        </p>
      </UserPageSubscriptionsSection>
      {mounted && transactionModal.status ? (
        <OnchainTransactionModal
          status={transactionModal.status}
          title={t(locale, "subscriptions.page.topUpTitle")}
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
    display?: string | undefined;
    selected: boolean;
    onSelect: () => void;
  }>
) {
  const locale = useBrowserLocale();
  const countLabel = getCardCountLabel(locale, props.count);
  return (
    <button
      id={props.id}
      type="button"
      aria-pressed={props.selected}
      onClick={props.onSelect}
      className={`${TOP_UP_CHIP_CLASS} ${props.selected ? "tw-border-iron-100" : "tw-border-white/20"}`}
    >
      <span className="tw-font-medium">{props.display ?? countLabel}</span>
      <span className="tw-text-right tw-tabular-nums tw-text-iron-400">
        {props.display && <>{countLabel}, </>}
        {formatSubscriptionEth(
          locale,
          props.amountEth ?? getEthForCards(props.count)
        )}{" "}
        {t(locale, "subscriptions.balance.ethUnit")}
      </span>
    </button>
  );
}
