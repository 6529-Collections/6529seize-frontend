"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { CollectedCollectionType } from "@/entities/IProfile";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ContractType } from "@/types/enums";
import {
  faMinus,
  faPlus,
  faRightLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import TransferModal from "./TransferModal";
import {
  buildTransferKey,
  TransferProvider,
  useTransfer,
} from "./TransferState";

interface TransferSingleProps {
  readonly collectionType: CollectedCollectionType;
  readonly contractType: ContractType;
  readonly contract: string;
  readonly tokenId: number;
  readonly title: string;
  readonly max: number;
  readonly thumbUrl?: string | undefined;
  readonly children?: ReactNode;
}

export default function TransferSingle(props: TransferSingleProps) {
  return (
    <TransferProvider>
      <TransferSingleImpl {...props} />
    </TransferProvider>
  );
}

function TransferSingleImpl(props: TransferSingleProps) {
  const {
    collectionType,
    contractType,
    contract,
    tokenId,
    title,
    max,
    thumbUrl,
    children,
  } = props;
  const { isMobileDevice } = useDeviceInfo();

  const t = useTransfer();

  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const wantModalAfterConnect = useRef(false);

  const key = useMemo(
    () =>
      buildTransferKey({
        collection: collectionType,
        tokenId,
      }),
    [collectionType, tokenId]
  );

  useEffect(() => {
    t.select({
      key,
      contract,
      contractType,
      tokenId,
      max,
      thumbUrl,
      title,
    });

    return () => {
      t.unselect(key);
    };
  }, [
    key,
    collectionType,
    tokenId,
    max,
    thumbUrl,
    title,
    contract,
    contractType,
  ]);

  useEffect(() => {
    if (isConnected && wantModalAfterConnect.current) {
      setShowModal(true);
      wantModalAfterConnect.current = false;
    }

    if (!isConnected && !seizeConnectOpen && wantModalAfterConnect.current) {
      wantModalAfterConnect.current = false;
    }
  }, [isConnected, seizeConnectOpen]);

  const selectedQty = t.selected.get(key)?.qty ?? 0;

  const [showModal, setShowModal] = useState(false);

  const transferButtonAriaLabel = useMemo(() => {
    if (contractType === ContractType.ERC721) {
      return "Transfer";
    }
    const quantity = Math.max(1, selectedQty);
    if (quantity > 1) {
      return `Transfer ${quantity} copies`;
    }
    return "Transfer 1 copy";
  }, [selectedQty, contractType]);

  if (isMobileDevice) {
    return null;
  }

  const transferTitle = (
    <div className="tw-flex tw-items-center tw-gap-2 tw-text-iron-400">
      <span className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider">
        Transfer
      </span>
      <FontAwesomeIcon icon={faRightLeft} className="tw-size-3" />
    </div>
  );

  const quantityToggle = max > 1 && (
    <div className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-1 tw-font-medium">
      <button
        type="button"
        onClick={() => t.decQty(key)}
        disabled={selectedQty <= 1}
        aria-label="Decrease quantity"
        className={`tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-all focus:tw-outline-none ${
          selectedQty <= 1
            ? "tw-cursor-not-allowed tw-bg-transparent tw-text-iron-600"
            : "tw-cursor-pointer tw-bg-iron-800 tw-text-iron-100 hover:tw-bg-iron-700 active:tw-scale-95"
        }`}
        data-testid="transfer-single-minus"
      >
        <FontAwesomeIcon icon={faMinus} className="tw-size-3" />
      </button>
      <div className="tw-min-w-10 tw-select-none tw-text-center tw-text-xs tw-font-bold tw-tabular-nums tw-leading-none tw-text-iron-300">
        {selectedQty}/{max}
      </div>
      <button
        type="button"
        onClick={() => t.incQty(key)}
        disabled={selectedQty >= max}
        aria-label="Increase quantity"
        className={`tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-all focus:tw-outline-none ${
          selectedQty >= max
            ? "tw-cursor-not-allowed tw-bg-iron-800/50 tw-text-iron-600"
            : "tw-cursor-pointer tw-bg-primary-500 tw-text-white hover:tw-bg-primary-400 active:tw-scale-95"
        }`}
        data-testid="transfer-single-plus"
      >
        <FontAwesomeIcon icon={faPlus} className="tw-size-3" />
      </button>
    </div>
  );

  const transferButton = (
    <button
      type="button"
      onClick={() => {
        if (!isConnected) {
          wantModalAfterConnect.current = true;
          seizeConnect();
          return;
        }
        setShowModal(true);
      }}
      aria-label={transferButtonAriaLabel}
      className="tw-flex tw-h-10 tw-items-center tw-justify-center tw-gap-x-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-white tw-px-5 tw-text-sm tw-font-bold tw-text-black tw-transition-all tw-duration-200 hover:tw-bg-iron-100 active:tw-scale-[0.98] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      data-testid="transfer-single-submit"
    >
      <span>Transfer</span>
      <FontAwesomeIcon
        aria-hidden="true"
        icon={faRightLeft}
        className="tw-size-3"
      />
    </button>
  );

  return (
    <div
      className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-shadow-2xl tw-ring-1 tw-ring-white/5"
      data-testid="transfer-single"
    >
      {children ? (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-4">
          <div className="tw-min-w-0">{children}</div>
          <div className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-justify-end tw-gap-3">
            {quantityToggle}
            {transferButton}
          </div>
        </div>
      ) : (
        <>
          <div className="tw-flex tw-items-center tw-gap-3">
            {transferTitle}
            {quantityToggle}
          </div>

          <div className="tw-mt-4">{transferButton}</div>
        </>
      )}
      <TransferModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
