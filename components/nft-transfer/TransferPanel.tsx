"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  faChevronDown,
  faChevronUp,
  faMinusCircle,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../distribution-plan-tool/common/CircleLoader";
import TransferModal from "./TransferModal";
import { useTransfer } from "./TransferState";

export default function TransferPanel({
  isLoading = false,
}: {
  readonly isLoading?: boolean | undefined;
}) {
  const t = useTransfer();
  const { isConnected } = useSeizeConnectContext();
  const { enabled, setEnabled, clear } = t;

  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const previousOverflowRef = useRef<string>("");

  useEffect(() => {
    if (!isConnected && enabled) {
      setEnabled(false);
      clear();
    }
  }, [isConnected, enabled, setEnabled, clear]);

  useEffect(() => {
    if (!isExpanded) return;

    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflowRef.current;
    };
  }, [isExpanded]);

  const items = Array.from(t.selected.values());

  const centerMessage = (() => {
    if (isLoading) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
          <span>Loading transfer data</span>
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </div>
      );
    }
    if (items.length === 0) {
      return <>Select some NFTs to transfer</>;
    }
    return null;
  })();

  useEffect(() => {
    if (isExpanded && items.length === 0) {
      setIsExpanded(false);
    }
  }, [items.length, isExpanded]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      globalThis.addEventListener("keydown", handleEscape);
      return () => globalThis.removeEventListener("keydown", handleEscape);
    }
    return;
  }, [isExpanded]);

  if (!t.enabled) return null;

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="tw-fixed tw-inset-0 tw-z-40 tw-bg-black/50 tw-backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <div
        className={[
          "tw-sticky tw-bottom-0 tw-z-50 tw-mt-5",
          "-tw-mx-2 lg:-tw-mx-6 xl:-tw-mx-8",
          "tw-w-[calc(100%+theme(space.4))] lg:tw-w-[calc(100%+theme(space.12))] xl:tw-w-[calc(100%+theme(space.16))]",
          "tw-animate-slideUp",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          {...(!isExpanded && items.length > 0 && !isLoading
            ? {
                role: "button",
                tabIndex: 0,
                "aria-label": "Expand transfer panel",
                onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  const target = e.target as HTMLElement;
                  if (!target.closest("button")) {
                    setIsExpanded(true);
                  }
                },
                onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    const target = e.target as HTMLElement;
                    if (!target.closest("button")) {
                      setIsExpanded(true);
                    }
                  }
                },
              }
            : {
                onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                },
              })}
          className={[
            "tw-border-l-0 tw-border-solid tw-border-[#37373ee6]",
            "tw-bg-black tw-text-iron-50",
            "tw-flex tw-select-none tw-flex-col",
            !isExpanded &&
              items.length > 0 &&
              !isLoading &&
              "tw-cursor-pointer",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-4">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                disabled={isLoading}
                className="tw-inline-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-[#444] tw-bg-white tw-text-black tw-transition-colors hover:tw-bg-white/90 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
              >
                <FontAwesomeIcon
                  icon={isExpanded ? faChevronDown : faChevronUp}
                  className="tw-size-4"
                />
              </button>
            )}
            {items.length > 0 && (
              <div className="tw-flex tw-items-center tw-overflow-hidden">
                {items.map((it, index) => (
                  <div
                    key={it.key}
                    className="tw-relative tw-flex-shrink-0"
                    style={{
                      marginLeft: index > 0 ? "-12px" : "0",
                      zIndex: items.length - index,
                    }}
                  >
                    <div className="tw-relative tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#444] tw-bg-white/10">
                      {it.thumbUrl ? (
                        <Image
                          alt={it.title ?? it.key}
                          src={it.thumbUrl}
                          fill
                          sizes="40px"
                          className="tw-object-cover"
                          quality={90}
                        />
                      ) : (
                        <div className="tw-h-full tw-w-full tw-bg-white/10" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {centerMessage ? (
              <div className="tw-flex-1 tw-text-center tw-text-sm tw-font-medium">
                {centerMessage}
              </div>
            ) : null}
            <div
              className={
                centerMessage
                  ? "tw-flex tw-items-center tw-gap-3"
                  : "tw-ml-auto tw-flex tw-items-center tw-gap-3"
              }
            >
              {items.length > 0 && (
                <div className="tw-whitespace-nowrap tw-rounded-full tw-bg-primary-500 tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-text-white">
                  {t.totalQty} {t.totalQty === 1 ? "item" : "items"}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  t.setEnabled(false);
                  t.clear();
                }}
                disabled={isLoading}
                className="tw-flex tw-min-w-[100px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#444] tw-bg-white/10 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-transition-colors hover:tw-bg-white/20 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                aria-label="Cancel"
              >
                Cancel
              </button>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="tw-flex tw-min-w-[100px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-black tw-transition-colors hover:tw-bg-white/90"
                  aria-label="Continue"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
          <AnimatePresence>
            {isExpanded && items.length > 0 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="tw-overflow-hidden"
              >
                <div className="tw-max-h-[40vh] tw-overflow-auto tw-px-4 tw-pb-4">
                  <ul className="tw-grid tw-grid-cols-1 tw-gap-2 tw-p-0 md:tw-grid-cols-2">
                    {items.map((it) => {
                      const max = Math.max(1, it.max ?? 1);
                      const qty = Math.min(Math.max(1, it.qty ?? 1), max);
                      const [collection, tokenId] = it.key.split(":");
                      const label = `${collection} #${tokenId}`;

                      return (
                        <li
                          key={it.key}
                          className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 tw-p-2"
                        >
                          {it.thumbUrl ? (
                            <div className="tw-relative tw-h-10 tw-w-10 tw-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-white/10">
                              <Image
                                alt={it.title ?? it.key}
                                src={it.thumbUrl}
                                fill
                                sizes="40px"
                                className="tw-object-contain"
                                quality={90}
                              />
                            </div>
                          ) : (
                            <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-rounded-md tw-bg-white/10" />
                          )}
                          <div className="tw-min-w-0 tw-flex-1">
                            <div className="tw-truncate tw-text-xs">
                              {it.title ?? label}
                            </div>
                            <div className="tw-truncate tw-text-[10px] tw-opacity-75">
                              {label}
                            </div>
                          </div>
                          {max > 1 && (
                            <div className="tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-full tw-bg-primary-500 tw-p-1 tw-font-medium">
                              <button
                                type="button"
                                onClick={() => t.decQty(it.key)}
                                disabled={qty <= 1}
                                aria-label="Decrease quantity"
                                className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none"
                              >
                                <FontAwesomeIcon
                                  icon={faMinusCircle}
                                  className="tw-size-6 tw-cursor-pointer"
                                  color={qty <= 1 ? "#aaa" : "#fff"}
                                />
                              </button>
                              <div className="tw-min-w-[2ch] tw-select-none tw-text-center tw-text-sm tw-tabular-nums">
                                {qty}/{max}
                              </div>
                              <button
                                type="button"
                                onClick={() => t.incQty(it.key)}
                                disabled={qty >= max}
                                aria-label="Increase quantity"
                                className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none"
                              >
                                <FontAwesomeIcon
                                  icon={faPlusCircle}
                                  className="tw-size-6 tw-cursor-pointer"
                                  color={qty >= max ? "#aaa" : "#fff"}
                                />
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="tw-inline-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-[#ef4444] tw-p-0 tw-text-lg tw-font-medium tw-text-white hover:tw-bg-[#d92b2b]"
                            onClick={() => t.unselect(it.key)}
                            aria-label="Remove"
                          >
                            &times;
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <TransferModal
        open={showModal}
        onClose={(opts) => {
          setShowModal(false);
          if (opts?.completed) {
            t.clear();
            t.setEnabled(false);
          }
        }}
      />
    </>
  );
}
