"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BoltIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
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
import {
  formatAddress,
  getTransactionLink,
  numberWithCommasFromString,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import styles from "./UserPageSubscriptions.module.css";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";

function getEthForCards(count: number): number {
  return Math.round(count * MEMES_MINT_PRICE * 1e10) / 1e10;
}

function getTopUpModalEmoji(
  status: "confirm_wallet" | "submitted" | "success" | "error"
): string {
  const emojiByStatus: Record<
    "confirm_wallet" | "submitted" | "success" | "error",
    string
  > = {
    confirm_wallet: "/emojis/sgt_flushed.webp",
    submitted: "/emojis/sgt_flushed.webp",
    success: "/emojis/sgt_saluting_face.webp",
    error: "/emojis/sgt_sob.webp",
  };
  return emojiByStatus[status];
}

const TOP_UP_OPTION_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4";
const TOP_UP_DEEP_GRID_CLASS =
  "tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3";
const TOP_UP_ACTION_GRID_CLASS =
  "tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[minmax(0,1fr)_auto] sm:tw-items-end";
const TOP_UP_OPTION_CLASS =
  "tw-group tw-relative tw-min-h-36 tw-w-full tw-overflow-hidden tw-rounded-xl tw-p-5 tw-text-left tw-text-iron-100 tw-shadow-lg tw-ring-1 tw-ring-inset tw-transition-all tw-duration-500 tw-ease-out motion-reduce:tw-transform-none motion-reduce:tw-transition-none focus-within:tw-ring-2 focus-within:tw-ring-primary-400 desktop-hover:hover:-tw-translate-y-1 desktop-hover:hover:tw-shadow-2xl desktop-hover:hover:tw-shadow-black/50";

function getTopUpOptionClass(selected: boolean): string {
  return `${TOP_UP_OPTION_CLASS} ${
    selected
      ? "tw-bg-iron-900 tw-shadow-2xl tw-ring-white/10"
      : "tw-bg-iron-950 tw-ring-white/[0.05]"
  }`;
}

export default function UserPageSubscriptionsTopUp() {
  const { isIos } = useCapacitor();
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
  const [mounted, setMounted] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectOther = useCallback(() => {
    setSelectedOption("other");
    setError("");
    otherInputRef.current?.focus();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleSend() {
    setError("");
    let count: number;
    if (selectedOption && selectedOption !== "other") {
      const optionCountMap: Record<string, number> = {
        "1": 1,
        szn: remainingMintsForSeason,
        year: remainingMintsForYear,
        epoch: remainingMintsForEpoch,
        period: remainingMintsForPeriod,
        era: remainingMintsForEra,
        eon: remainingMintsForEon,
      };
      count = optionCountMap[selectedOption]!;
      if (!count || count < 1) {
        setError("Invalid option selected");
        return;
      }
    } else if (
      memeCount &&
      !Number.isNaN(Number.parseInt(memeCount, 10)) &&
      Number.parseInt(memeCount, 10) > 0
    ) {
      count = Number.parseInt(memeCount, 10);
    } else {
      setError("Select a top-up option");
      return;
    }
    if (!isConnected) {
      setError("You must have an active wallet connection to top up");
      return;
    }
    const value = getEthForCards(count);
    setTopUpAmount(value);
    sendTransaction.reset();
    sendTransaction.sendTransaction({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(value.toString()),
    });
  }

  useEffect(() => {
    if (sendTransaction.error) {
      const errorMsg =
        sendTransaction.error.message.split("Request Arguments")[0];
      setError(`Error - ${errorMsg}`);
    }
  }, [sendTransaction.error]);

  const showModal =
    sendTransaction.isPending ||
    waitSendTransaction.isLoading ||
    waitSendTransaction.isSuccess ||
    !!error;

  const isClosable = waitSendTransaction.isSuccess || !!error;

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const closeModal = useCallback(() => {
    if (isClosable) {
      sendTransaction.reset();
      setError("");
      setTopUpAmount(null);
      setSelectedOption(null);
      setMemeCount("");
    }
  }, [isClosable, sendTransaction]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isClosable && showModal) {
        closeModal();
      }
    }

    if (!showModal) return;
    globalThis.addEventListener("keydown", handleEscape);
    return () => {
      globalThis.removeEventListener("keydown", handleEscape);
    };
  }, [showModal, isClosable, closeModal]);

  function getModalContent() {
    if (error) {
      return (
        <div className="tw-text-center">
          <p className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-red">
            <span>Error</span>
            <img
              src={getTopUpModalEmoji("error")}
              alt=""
              role="presentation"
              className="tw-h-6 tw-w-6"
            />
          </p>
          <p className="tw-mb-0 tw-text-iron-100">{error}</p>
        </div>
      );
    }

    if (sendTransaction.isPending) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
          <img
            src={getTopUpModalEmoji("confirm_wallet")}
            alt=""
            role="presentation"
            className="tw-h-6 tw-w-6"
          />
          <p className="tw-mb-0 tw-text-lg tw-font-medium tw-text-iron-100">
            Confirm in your wallet
          </p>
          <CircleLoader size={CircleLoaderSize.LARGE} />
        </div>
      );
    }

    if (waitSendTransaction.isLoading) {
      return (
        <div className="tw-text-center">
          <p className="tw-mb-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-iron-100">
            <img
              src={getTopUpModalEmoji("submitted")}
              alt=""
              role="presentation"
              className="tw-h-6 tw-w-6"
            />
            Transaction Submitted
            {sendTransaction.data && (
              <a
                className="tw-rounded-md tw-bg-white tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-black"
                href={getTransactionLink(
                  SUBSCRIPTIONS_CHAIN.id,
                  sendTransaction.data
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Tx
              </a>
            )}
          </p>
          <p className="tw-mb-2 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-md tw-font-medium tw-text-iron-100">
            Waiting for confirmation{" "}
            <CircleLoader size={CircleLoaderSize.MEDIUM} />
          </p>
        </div>
      );
    }

    if (waitSendTransaction.isSuccess) {
      return (
        <div className="tw-text-center">
          <p className="tw-mb-0 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg tw-font-medium tw-text-green">
            <img
              src={getTopUpModalEmoji("success")}
              alt=""
              role="presentation"
              className="tw-h-6 tw-w-6"
            />
            Top Up Successful!
            {sendTransaction.data && (
              <a
                className="tw-rounded-md tw-bg-white tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-black"
                href={getTransactionLink(
                  SUBSCRIPTIONS_CHAIN.id,
                  sendTransaction.data
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Tx
              </a>
            )}
          </p>
        </div>
      );
    }

    return null;
  }

  if (hideSubscriptions) {
    return <></>;
  }

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
            display={`Remaining ${label} ${value.toLocaleString()}`}
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
      {!showDeep && (
        <div className="tw-pt-3 tw-text-center tw-text-iron-400 sm:tw-text-left">
          <ShowMoreButton
            expanded={showDeep}
            setExpanded={setShowDeep}
            showMoreLabel="Show Deep Time Subscriptions"
            showLessLabel="Hide Deep Time Subscriptions"
          />
        </div>
      )}
      {showDeep && (
        <>
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
          <div className="tw-pt-3 tw-text-center tw-text-iron-400 sm:tw-text-left">
            <ShowMoreButton
              expanded={showDeep}
              setExpanded={setShowDeep}
              showMoreLabel="Show Deep Time Subscriptions"
              showLessLabel="Hide Deep Time Subscriptions"
            />
          </div>
        </>
      )}
      <div className={TOP_UP_ACTION_GRID_CLASS}>
        <div className="tw-flex tw-items-center">
          <div className={getTopUpOptionClass(selectedOption === "other")}>
            <label
              htmlFor="subscription-top-up-other"
              className="tw-absolute tw-inset-0 tw-z-0 tw-cursor-pointer tw-rounded-xl"
            >
              <span className="tw-sr-only">Select Other card count</span>
            </label>
            <div className="tw-pointer-events-none tw-relative tw-z-10 tw-flex tw-min-h-24 tw-flex-col tw-justify-between tw-pr-8">
              <span className="tw-pointer-events-auto tw-absolute tw-right-0 tw-top-0 tw-flex">
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
              <span className="tw-text-xl tw-font-medium tw-leading-7 tw-text-iron-100">
                Other
              </span>
              <div className="tw-mt-3 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                <input
                  ref={otherInputRef}
                  type="number"
                  min={1}
                  placeholder="count"
                  aria-label="Custom card count"
                  value={memeCount}
                  className="tw-pointer-events-auto tw-min-h-11 tw-w-[100px] tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-1 tw-text-sm tw-text-iron-50 tw-transition [color-scheme:dark] placeholder:tw-text-iron-500 placeholder:tw-opacity-100 focus:tw-border-primary-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500/25"
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
                <span aria-live="polite" className="tw-whitespace-nowrap">
                  {!Number.isNaN(Number.parseInt(memeCount, 10)) &&
                    Number.parseInt(memeCount, 10) > 0 && (
                      <>
                        ({getEthForCards(Number.parseInt(memeCount, 10))} ETH)
                      </>
                    )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-justify-end tw-pt-2 sm:tw-pt-0">
          <button
            type="button"
            className="tw-inline-flex tw-min-h-11 tw-w-full tw-min-w-32 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-iron-100 tw-px-6 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-950 tw-shadow-lg tw-shadow-white/10 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-bg-white sm:tw-w-auto"
            onClick={handleSend}
            disabled={
              sendTransaction.isPending ||
              waitSendTransaction.isLoading ||
              selectedOption === null ||
              (selectedOption === "other" &&
                (!memeCount || Number.parseInt(memeCount, 10) < 1))
            }
            aria-label="Send top up"
          >
            <BoltIcon className="tw-size-4" aria-hidden="true" />
            Send
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <UserPageSubscriptionsSection
        id="profile-subscriptions-top-up"
        title="Top Up"
        className="tw-pb-4 tw-pt-6"
        action={
          <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1 tw-gap-y-0.5 tw-rounded-full tw-bg-white/5 tw-px-3 tw-py-1 tw-ring-1 tw-ring-white/10">
            <span>Sending to</span>
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
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-px-4 tw-backdrop-blur-[1px]"
                onClick={isClosable ? closeModal : undefined}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="tw-relative tw-w-full tw-max-w-md tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-800 tw-pb-3">
                    <div>
                      <h2 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-white">
                        Top up
                      </h2>
                      {topUpAmount !== null && (
                        <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
                          {(topUpAmount / MEMES_MINT_PRICE).toLocaleString()}{" "}
                          Cards -{" "}
                          {numberWithCommasFromString(topUpAmount.toString())}{" "}
                          ETH
                        </p>
                      )}
                    </div>
                    {isClosable && (
                      <button
                        onClick={closeModal}
                        className="-tw-mt-0.5 tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400"
                        aria-label="Close modal"
                      >
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="tw-size-5 tw-flex-shrink-0"
                        />
                      </button>
                    )}
                  </div>
                  <div className="tw-flex tw-min-h-[120px] tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-800 tw-p-2">
                    {getModalContent()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function CardCountOption(
  props: Readonly<{
    id: string;
    count: number;
    display?: string | undefined;
    selected: boolean;
    onSelect: () => void;
  }>
) {
  const cardLabel = props.count > 1 ? "Cards" : "Card";
  const labelText = props.display
    ? `${props.display} - ${props.count.toLocaleString()} Cards`
    : `${props.count.toLocaleString()} ${cardLabel}`;

  return (
    <label
      htmlFor={props.id}
      className={`${getTopUpOptionClass(props.selected)} tw-block tw-cursor-pointer`}
    >
      <span className="tw-absolute tw-right-5 tw-top-5 tw-flex">
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
      <div className="tw-flex tw-min-h-24 tw-min-w-0 tw-flex-col tw-justify-between tw-pr-8">
        {props.display && (
          <span
            className={`tw-text-xs tw-font-medium tw-leading-5 ${
              props.selected ? "tw-text-primary-300" : "tw-text-iron-400"
            }`}
          >
            {props.display}
          </span>
        )}
        <div className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
          <span className="tw-text-xl tw-font-medium tw-leading-7 tw-text-iron-100">
            {props.count.toLocaleString()} Card{props.count > 1 && "s"}
          </span>
          <span className="tw-flex tw-items-center tw-gap-1.5">
            <span className="tw-text-sm tw-leading-5 tw-text-iron-400">
              {numberWithCommasFromString(getEthForCards(props.count))}
            </span>
            <span className="tw-text-xs tw-text-iron-500">ETH</span>
          </span>
        </div>
      </div>
    </label>
  );
}
