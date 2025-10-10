"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import TransferModal from "./TransferModal";
import { useTransfer } from "./TransferState";

export default function TransferPanel() {
  const t = useTransfer();
  const { isConnected } = useSeizeConnectContext();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isConnected && t.enabled) {
      t.setEnabled(false);
      t.clear();
    }
  }, [isConnected, t]);

  if (!t.enabled) return null;

  const items = Array.from(t.selected.values());

  return (
    <>
      <aside className="tw-sticky tw-top-2 tw-h-fit tw-w-80 tw-shrink-0 tw-rounded-2xl tw-border tw-border-white/10 tw-bg-black/70 tw-backdrop-blur tw-p-4">
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
              className="tw-text-sm tw-rounded-lg tw-bg-white tw-text-black tw-py-1 tw-border-1 tw-border-solid tw-border-[#444]">
              Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="tw-text-xs tw-opacity-70">Choose cards to transfer.</p>
        ) : (
          <ul className="tw-max-h-[75vh] tw-overflow-auto tw-space-y-2 tw-px-0">
            {items.map((it) => {
              const max = Math.max(1, it.max ?? 1);
              const qty = Math.min(Math.max(1, it.qty ?? 1), max);

              const [collection, tokenId] = it.key.split(":");
              const label = `${collection} #${tokenId}`;

              return (
                <li
                  key={it.key}
                  className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 tw-p-2">
                  {it.thumbUrl ? (
                    <Image
                      alt={it.title ?? it.key}
                      src={it.thumbUrl}
                      width={30}
                      height={30}
                      className="tw-rounded-lg tw-object-cover"
                    />
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
                        className="tw-inline-flex tw-items-center tw-justify-center tw-h-6 tw-w-6 tw-rounded-full tw-bg-white tw-text-black tw-font-medium hover:tw-bg-[#ddd] tw-text-lg tw-p-0 tw-border-0 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                        onClick={() => t.decQty(it.key)}
                        disabled={qty <= 1}
                        aria-label="Decrease">
                        -
                      </button>
                      <div className="tw-min-w-[2ch] tw-text-center tw-text-xs tw-tabular-nums">
                        {qty}
                      </div>
                      <button
                        type="button"
                        className="tw-inline-flex tw-items-center tw-justify-center tw-h-6 tw-w-6 tw-rounded-full tw-bg-white tw-text-black tw-font-medium hover:tw-bg-[#ddd] tw-text-lg tw-p-0 tw-border-0 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                        onClick={() => t.incQty(it.key)}
                        disabled={qty >= max}
                        aria-label="Increase">
                        +
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

        <div className="tw-mt-3 tw-flex tw-gap-3">
          <button
            type="button"
            onClick={() => {
              t.setEnabled(false);
              t.clear();
            }}
            className="tw-flex-1 tw-rounded-lg tw-bg-white/10 hover:tw-bg-white/20 tw-text-white tw-py-1 tw-border-1 tw-border-solid tw-border-[#444]">
            Cancel
          </button>
          <button
            type="button"
            disabled={t.totalQty === 0}
            onClick={() => setShowModal(true)}
            className="tw-flex-1 tw-rounded-lg tw-bg-white tw-text-black tw-py-1 disabled:tw-opacity-75 disabled:tw-cursor-not-allowed tw-border-1 tw-border-solid tw-border-[#444]">
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
