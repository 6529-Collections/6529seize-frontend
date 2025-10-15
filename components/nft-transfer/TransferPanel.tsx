"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  faAnglesDown,
  faAnglesUp,
  faMinusCircle,
  faPlusCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import TransferModal from "./TransferModal";
import { useTransfer } from "./TransferState";

export default function TransferPanel() {
  const t = useTransfer();
  const { isConnected } = useSeizeConnectContext();

  const [showModal, setShowModal] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [listHasOverflow, setListHasOverflow] = useState(false);
  const [listAtEnd, setListAtEnd] = useState(false);

  useEffect(() => {
    if (!isConnected && t.enabled) {
      t.setEnabled(false);
      t.clear();
    }
  }, [isConnected, t]);

  const items = Array.from(t.selected.values());

  // Scroll to top when items increase (new selection added)
  const prevItemsLenRef = useRef(items.length);
  useEffect(() => {
    if (items.length > prevItemsLenRef.current && listRef.current) {
      // Scroll the selection list to the top when a new item is added
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevItemsLenRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      setListHasOverflow(false);
      setListAtEnd(false);
      return;
    }

    const hasOverflow = (node: HTMLElement | null) =>
      !!node && node.scrollHeight > node.clientHeight;

    const nearBottom = (node: HTMLElement | null) => {
      if (!node) return false;
      const threshold = 4; // px tolerance
      return (
        node.scrollTop + node.clientHeight >= node.scrollHeight - threshold
      );
    };

    const check = () => {
      setListHasOverflow(hasOverflow(el));
      setListAtEnd(nearBottom(el));
    };

    // Initial check
    check();

    // Re-check on resize
    window.addEventListener("resize", check);

    // Listen for scroll on the list to flip the arrow
    const onScroll = () => setListAtEnd(nearBottom(el));
    el.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("resize", check);
      el.removeEventListener("scroll", onScroll);
    };
  }, [items.length]);

  if (!t.enabled) return null;

  return (
    <>
      <aside className="tw-sticky tw-top-2 tw-ring-[3px] tw-ring-white/30 tw-w-80 tw-shrink-0 tw-rounded-2xl tw-border tw-border-white/10 tw-bg-black/70 tw-backdrop-blur tw-p-4 tw-flex tw-flex-col tw-max-h-[calc(100vh-1rem)] tw-overflow-hidden tw-self-start">
        <div className="tw-text-xs tw-leading-tight tw-opacity-70">
          * You can only transfer NFTs from the address you are currently
          connected to.
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-my-2">
          <span className="tw-text-sm tw-font-medium">
            Selected <b>{t.count}</b> {t.count === 1 ? "NFT" : "NFTs"} ·{" "}
            <b>{t.totalQty}</b> {t.totalQty === 1 ? "item" : "items"}
          </span>
          {t.count > 0 && (
            <button
              type="button"
              onClick={t.clear}
              className="tw-text-sm tw-rounded-lg tw-bg-white tw-text-black tw-py-1 tw-border-2 tw-border-solid tw-border-[#444]">
              Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="tw-text-xs tw-opacity-70">Choose cards to transfer.</p>
        ) : (
          <ul
            ref={listRef}
            className={`tw-overflow-auto tw-space-y-2 tw-px-0 tw-mb-1 tw-pr-3 tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-white/30 tw-scrollbar-track-transparent hover:tw-scrollbar-thumb-white/50 ${
              listHasOverflow ? "tw-flex-1 tw-min-h-0" : ""
            }`}>
            {items.map((it) => {
              const max = Math.max(1, it.max ?? 1);
              const qty = Math.min(Math.max(1, it.qty ?? 1), max);

              const [collection, tokenId] = it.key.split(":");
              const label = `${collection} #${tokenId}`;

              return (
                <li
                  key={it.key}
                  className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 tw-p-2">
                  {it.thumbUrl ? (
                    <div className="tw-relative tw-h-10 tw-w-10 tw-rounded-md tw-overflow-hidden tw-bg-white/10">
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
                    <div className="tw-h-10 tw-w-10 tw-rounded-lg tw-bg-white/10" />
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
                    <div className="tw-flex tw-items-center tw-gap-1">
                      <button
                        type="button"
                        onClick={() => t.decQty(it.key)}
                        disabled={qty <= 1}
                        aria-label="Decrease quantity"
                        className="tw-bg-transparent tw-border-none tw-p-0 focus:tw-outline-none tw-flex tw-items-center tw-justify-center"
                        data-testid="transfer-panel-minus">
                        <FontAwesomeIcon
                          icon={faMinusCircle}
                          className="tw-size-6 tw-cursor-pointer"
                          color={qty <= 1 ? "#60606C" : "#fff"}
                        />
                      </button>
                      <div className="tw-min-w-[2ch] tw-text-center tw-text-xs tw-tabular-nums tw-select-none">
                        {qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => t.incQty(it.key)}
                        disabled={qty >= max}
                        aria-label="Increase quantity"
                        className="tw-bg-transparent tw-border-none tw-p-0 focus:tw-outline-none tw-flex tw-items-center tw-justify-center"
                        data-testid="transfer-panel-plus">
                        <FontAwesomeIcon
                          icon={faPlusCircle}
                          className="tw-size-6 tw-cursor-pointer"
                          color={qty >= max ? "#60606C" : "#fff"}
                        />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="tw-inline-flex tw-items-center tw-justify-center tw-h-6 tw-w-6 tw-rounded-full tw-bg-[#ef4444] tw-font-medium tw-text-white hover:tw-bg-[#d92b2b] tw-text-lg tw-p-0 tw-border-0"
                    onClick={() => t.unselect(it.key)}
                    aria-label="Remove">
                    &times;
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {listHasOverflow && (
          <div className="tw-text-xs tw-opacity-75 tw-text-center">
            <FontAwesomeIcon icon={listAtEnd ? faAnglesUp : faAnglesDown} />{" "}
            Scroll for more
          </div>
        )}
        <div className="tw-mt-3 tw-flex tw-gap-3">
          <button
            type="button"
            onClick={() => {
              t.setEnabled(false);
              t.clear();
            }}
            className="tw-flex-1 tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/20 tw-text-white tw-py-1 tw-border-2 tw-border-solid tw-border-[#444]">
            Cancel
          </button>
          <button
            type="button"
            disabled={t.totalQty === 0}
            onClick={() => setShowModal(true)}
            className="tw-flex-1 tw-rounded-lg tw-bg-white tw-text-black tw-py-1 disabled:tw-opacity-75 disabled:tw-cursor-not-allowed tw-border-2 tw-border-solid tw-border-[#444]">
            Continue
          </button>
        </div>
      </aside>

      {/* Modal */}
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
