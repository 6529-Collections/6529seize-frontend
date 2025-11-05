"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { faRightLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef } from "react";
import { useTransfer } from "./TransferState";

export default function TransferToggle() {
  const t = useTransfer();
  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const {
    enabled: transferEnabled,
    setEnabled: setTransferEnabled,
    clear: clearTransfer,
  } = t;

  const wantTransferAfterConnect = useRef(false);

  useEffect(() => {
    if (isConnected && wantTransferAfterConnect.current) {
      setTransferEnabled(true);
      wantTransferAfterConnect.current = false;
    }

    if (!isConnected && !seizeConnectOpen && wantTransferAfterConnect.current) {
      wantTransferAfterConnect.current = false;
    }
  }, [isConnected, seizeConnectOpen, setTransferEnabled]);

  const scrollToButton = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const absoluteY = window.scrollY + rect.top - 10;

    window.scrollTo({ top: absoluteY, behavior: "smooth" });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => {
        if (!isConnected) {
          wantTransferAfterConnect.current = true;
          seizeConnect();
          return;
        }

        if (transferEnabled) {
          clearTransfer();
          setTransferEnabled(false);
        } else {
          scrollToButton();
          setTransferEnabled(true);
        }
      }}
      className={[
        "tw-inline-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 hover:tw-ring-iron-600 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-px-5 tw-py-3 tw-font-semibold tw-text-sm",
        "tw-bg-primary-500 hover:tw-bg-primary-600 tw-whitespace-nowrap",
      ].join(" ")}>
      {t.enabled ? "Exit Transfer" : "Transfer"}
      <FontAwesomeIcon icon={faRightLeft} />
    </button>
  );
}
