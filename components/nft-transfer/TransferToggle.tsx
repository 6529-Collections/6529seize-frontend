"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
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
    <Button
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
      variant="primary"
      size="md"
    >
      {t.enabled ? "Exit Transfer" : "Transfer"}
      <FontAwesomeIcon icon={faRightLeft} />
    </Button>
  );
}
