"use client";

import { useTransfer } from "./TransferState";

export default function TransferToggle() {
  const t = useTransfer();
  return (
    <button
      type="button"
      onClick={() => {
        if (t.enabled) {
          t.setEnabled(false);
          t.clear();
        } else {
          t.setEnabled(true);
        }
      }}
      className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/5 hover:tw-bg-white/10 tw-px-3 tw-py-2 tw-text-sm">
      <span aria-hidden>⇄</span>
      {t.enabled ? "Exit transfer" : "Transfer"}
    </button>
  );
}
