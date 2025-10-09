"use client";

import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useTransfer } from "./TransferState";

export default function TransferPanel() {
  const t = useTransfer();
  if (!t.enabled) return null;

  const items = Array.from(t.selected.values());

  const keyToLabel = (key: string) => {
    const [collection, tokenId] = key.split(":");
    return `${collection} #${tokenId}`;
  };

  return (
    <aside className="tw-sticky tw-top-1 tw-h-fit tw-w-60 tw-shrink-0 tw-rounded-2xl tw-border tw-border-white/10 tw-bg-black/70 tw-backdrop-blur tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <span className="tw-text-sm tw-font-medium">
          Selected {t.count} {t.count === 1 ? "item" : "items"} · {t.totalQty}{" "}
          {t.totalQty === 1 ? "unit" : "units"}
        </span>
        {t.count > 0 && (
          <button
            type="button"
            onClick={t.clear}
            className="tw-text-sm tw-rounded-lg tw-bg-white tw-text-black tw-py-1">
            Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="tw-text-xs tw-opacity-70">Choose cards to transfer.</p>
      ) : (
        <ul className="tw-max-h-[80vh] tw-overflow-auto tw-space-y-2 tw-px-0">
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

                {/* qty stepper */}
                {max > 1 && (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <button
                      type="button"
                      className="tw-h-6 tw-w-6 tw-rounded tw-bg-white/10 hover:tw-bg-white/20 tw-text-sm"
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
                      className="tw-h-6 tw-w-6 tw-rounded tw-bg-white/10 hover:tw-bg-white/20 tw-text-sm"
                      onClick={() => t.incQty(it.key)}
                      disabled={qty >= max}
                      aria-label="Increase">
                      +
                    </button>
                  </div>
                )}

                {/* remove */}
                <FontAwesomeIcon
                  icon={faXmarkCircle}
                  className="tw-cursor-pointer tw-h-5 tw-w-5 tw-text-iron-200 hover:tw-text-red-500 tw-transition-colors tw-duration-200"
                  onClick={() => t.unselect(it.key)}
                />
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
          className="tw-flex-1 tw-rounded-lg tw-bg-white/15 hover:tw-bg-white/20 tw-text-white tw-py-1">
          Cancel
        </button>
        <button
          type="button"
          disabled={t.totalQty === 0}
          className="tw-flex-1 tw-rounded-lg tw-bg-white tw-text-black tw-py-1 disabled:tw-opacity-75 disabled:tw-cursor-not-allowed">
          Continue
        </button>
      </div>
    </aside>
  );
}
