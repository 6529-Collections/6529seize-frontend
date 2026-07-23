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
        "tw-inline-flex tw-h-10 tw-items-center tw-gap-x-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-white tw-px-4 tw-text-sm tw-font-medium tw-text-iron-950 tw-transition-colors hover:tw-bg-iron-100",
        "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
      ].join(" ")}
    >
      {t.enabled ? "Exit Transfer" : "Transfer"}
      <FontAwesomeIcon icon={faRightLeft} />
    </button>
  );
}
