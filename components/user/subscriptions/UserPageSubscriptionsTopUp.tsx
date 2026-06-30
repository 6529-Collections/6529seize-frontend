"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import styles from "./UserPageSubscriptions.module.scss";

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

  const iOsContent = (
    <div className="tw-pt-2">
      <div>
        <Link
          href={window.location.href}
          className="tw-block tw-py-2 tw-text-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button
            className="tw-w-full tw-rounded-lg tw-border tw-border-iron-300 tw-bg-iron-100 tw-px-3 tw-py-2 tw-font-semibold tw-text-iron-950"
            type="button"
          >
            Top-up on 6529.io
          </button>
        </Link>
      </div>
    </div>
  );

  const printRemainingMints = (
    count: number,
    label: string,
    value: number,
    optionId: string
  ) => {
    if (count > 0) {
      return (
        <div className="tw-pt-2">
          <CardCountOption
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
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 sm:tw-gap-x-6">
        <div className="tw-pt-2">
          <CardCountOption
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
      </div>
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 sm:tw-gap-x-6">
        {printRemainingMints(remainingMintsForYear, "Year", year, "year")}
        {printRemainingMints(remainingMintsForEpoch, "Epoch", epoch, "epoch")}
      </div>
      {!showDeep && (
        <div className="tw-grid tw-grid-cols-1 tw-pt-2 sm:tw-grid-cols-2 sm:tw-gap-x-6">
          <div className="tw-text-iron-400">
            <div className="tw-pl-[calc(0.75rem+8.33%)]">
              <ShowMoreButton
                expanded={showDeep}
                setExpanded={setShowDeep}
                showMoreLabel="Show Deep Time Subscriptions"
                showLessLabel="Hide Deep Time Subscriptions"
              />
            </div>
          </div>
        </div>
      )}
      {showDeep && (
        <>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 sm:tw-gap-x-6">
            {printRemainingMints(
              remainingMintsForPeriod,
              "Period",
              period,
              "period"
            )}
            {printRemainingMints(remainingMintsForEra, "Era", era, "era")}
          </div>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 sm:tw-gap-x-6">
            {printRemainingMints(remainingMintsForEon, "Eon", eon, "eon")}
          </div>
          <div className="tw-grid tw-grid-cols-1 tw-pt-2 sm:tw-grid-cols-2 sm:tw-gap-x-6">
            <div className="tw-text-iron-400">
              <div className="tw-pl-[calc(0.75rem+8.33%)]">
                <ShowMoreButton
                  expanded={showDeep}
                  setExpanded={setShowDeep}
                  showMoreLabel="Show Deep Time Subscriptions"
                  showLessLabel="Hide Deep Time Subscriptions"
                />
              </div>
            </div>
          </div>
        </>
      )}
      <div className="tw-grid tw-grid-cols-1 tw-pt-2 sm:tw-grid-cols-2 sm:tw-gap-x-6">
        <div className="tw-flex tw-items-center">
          <button
            type="button"
            className={`tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-p-3 tw-text-left tw-transition-colors ${
              styles["cardCountOption"]
            } ${
              selectedOption === "other"
                ? "tw-bg-iron-800"
                : "tw-bg-transparent hover:tw-bg-iron-900"
            }`}
            onClick={handleSelectOther}
          >
            <div className="tw-grid tw-grid-cols-[8.333333%_1fr] tw-items-center">
              <div className="tw-flex tw-items-center tw-justify-center">
                <input
                  type="radio"
                  checked={selectedOption === "other"}
                  onChange={handleSelectOther}
                  aria-label="Other card count"
                  className={styles["radioInput"]}
                />
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span>Other</span>
                <input
                  ref={otherInputRef}
                  type="number"
                  min={1}
                  placeholder="count"
                  value={memeCount}
                  className={styles["countInput"]}
                  style={{ width: "100px", padding: "2px 10px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOption("other");
                  }}
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
                <span className="tw-whitespace-nowrap">
                  {!Number.isNaN(Number.parseInt(memeCount, 10)) &&
                    Number.parseInt(memeCount, 10) > 0 && (
                      <>
                        ({getEthForCards(Number.parseInt(memeCount, 10))} ETH)
                      </>
                    )}
                </span>
              </div>
            </div>
          </button>
        </div>
        <div className="tw-flex tw-items-center tw-justify-center tw-pt-2 sm:tw-pt-0">
          <button
            type="button"
            className={`${styles["sendBtn"]} tw-w-full sm:tw-w-auto`}
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
            Send
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div>
        <div className="tw-pb-2">
          <div className="tw-flex tw-items-end tw-gap-2 tw-whitespace-nowrap">
            <h4 className="tw-mb-0 tw-font-semibold">Top Up</h4>
            <span className="font-color-h font-smaller tw-flex tw-items-center tw-gap-1">
              Sending to{" "}
              <>
                <span data-tooltip-id="subscription-address">
                  {SUBSCRIPTIONS_ADDRESS_ENS}{" "}
                  {formatAddress(SUBSCRIPTIONS_ADDRESS)}
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
              </>
            </span>
          </div>
        </div>
        <hr className="tw-mt-1 tw-border-2 tw-border-white tw-opacity-100" />
        {isIos ? iOsContent : topUpContent}
      </div>
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
                        className="tw--mt-0.5 tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-400"
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
    <button
      type="button"
      className={`tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-p-3 tw-text-left tw-transition-colors ${
        styles["cardCountOption"]
      } ${
        props.selected
          ? "tw-bg-iron-700"
          : "tw-bg-transparent hover:tw-bg-iron-900"
      }`}
      onClick={props.onSelect}
    >
      <div className="tw-grid tw-grid-cols-[8.333333%_1fr] tw-items-center">
        <div className="tw-flex tw-items-center tw-justify-center">
          <input
            type="radio"
            checked={props.selected}
            onChange={props.onSelect}
            aria-label={labelText}
            className={styles["radioInput"]}
          />
        </div>
        <div className="tw-flex tw-items-center">
          {props.display && <span>{props.display}&nbsp;-&nbsp;</span>}
          {props.count.toLocaleString()} Card{props.count > 1 && "s"} (
          {numberWithCommasFromString(getEthForCards(props.count))} ETH)
        </div>
      </div>
    </button>
  );
}
