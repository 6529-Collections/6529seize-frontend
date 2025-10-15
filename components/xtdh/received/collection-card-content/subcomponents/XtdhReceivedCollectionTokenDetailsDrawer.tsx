'use client';

import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { useXtdhReceivedBodyScrollLock } from "../hooks/useXtdhReceivedBodyScrollLock";
import { useXtdhReceivedClientReady } from "../hooks/useXtdhReceivedClientReady";
import { XtdhReceivedCollectionTokenDetails } from "./XtdhReceivedCollectionTokenDetails";

export interface XtdhReceivedCollectionTokenDetailsDrawerProps {
  readonly token: XtdhReceivedNft;
  readonly detailsRegionId: string;
  readonly onClose: () => void;
  readonly className?: string;
}

export function XtdhReceivedCollectionTokenDetailsDrawer({
  token,
  detailsRegionId,
  onClose,
  className,
}: XtdhReceivedCollectionTokenDetailsDrawerProps) {
  const isClientReady = useXtdhReceivedClientReady();
  useXtdhReceivedBodyScrollLock(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.stopPropagation();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!isClientReady || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${detailsRegionId}-title`}
      className={clsx(
        "tw-fixed tw-inset-0 tw-z-[1040] tw-flex tw-items-center tw-justify-center tw-bg-iron-1000/70 tw-backdrop-blur-sm tw-px-4 tw-py-6",
        className,
      )}
    >
      <div
        role="presentation"
        className="tw-absolute tw-inset-0"
        onClick={onClose}
      />
      <div className="tw-relative tw-w-full tw-max-w-xl">
        <XtdhReceivedCollectionTokenDetails
          token={token}
          detailsRegionId={detailsRegionId}
          onClose={onClose}
          className="tw-h-auto tw-max-h-[calc(100vh-4rem)] tw-overflow-hidden"
        />
      </div>
    </div>,
    document.body,
  );
}
