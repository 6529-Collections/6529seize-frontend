"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useEffect, useRef } from "react";
import { useTransfer } from "./TransferState";

export default function TransferToggle() {
  const t = useTransfer();
  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();

  // Track if THIS button initiated a connect, so we enable transfer on success.
  const wantTransferAfterConnect = useRef(false);

  useEffect(() => {
    // If the user connected after we asked them to, enable transfer mode.
    if (isConnected && wantTransferAfterConnect.current) {
      t.setEnabled(true);
      wantTransferAfterConnect.current = false;
    }

    // If the modal closed without connecting, clear the intent.
    if (!isConnected && !seizeConnectOpen && wantTransferAfterConnect.current) {
      wantTransferAfterConnect.current = false;
    }
  }, [isConnected, seizeConnectOpen, t]);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isConnected) {
          // Remember intent and open connect modal
          wantTransferAfterConnect.current = true;
          seizeConnect();
          return;
        }

        // Already connected: normal toggle behavior
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
