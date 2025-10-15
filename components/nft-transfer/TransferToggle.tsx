"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { faRightLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef } from "react";
import { useTransfer } from "./TransferState";

export default function TransferToggle() {
  const { isMobileDevice } = useDeviceInfo();
  const t = useTransfer();
  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();

  const wantTransferAfterConnect = useRef(false);

  useEffect(() => {
    if (isConnected && wantTransferAfterConnect.current) {
      t.setEnabled(true);
      wantTransferAfterConnect.current = false;
    }

    if (!isConnected && !seizeConnectOpen && wantTransferAfterConnect.current) {
      wantTransferAfterConnect.current = false;
    }
  }, [isConnected, seizeConnectOpen, t]);

  if (isMobileDevice) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!isConnected) {
          wantTransferAfterConnect.current = true;
          seizeConnect();
          return;
        }

        if (t.enabled) {
          t.setEnabled(false);
          t.clear();
        } else {
          t.setEnabled(true);
        }
      }}
      className="tw-inline-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-iron-900 hover:tw-ring-iron-600 hover:tw-bg-iron-800 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-px-5 tw-py-3 tw-font-semibold tw-text-sm">
      {t.enabled ? "Exit transfer" : "Transfer"}
      <FontAwesomeIcon icon={faRightLeft} />
    </button>
  );
}
