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
          void seizeConnect();
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
        "tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border-0 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white hover:tw-ring-iron-300",
        "tw-whitespace-nowrap tw-bg-iron-200 tw-text-iron-800 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300",
      ].join(" ")}
    >
      {t.enabled ? "Exit Transfer" : "Transfer"}
      <FontAwesomeIcon icon={faRightLeft} />
    </button>
  );
}
