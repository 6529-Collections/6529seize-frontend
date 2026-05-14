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
    <div className="tw-flex tw-items-center tw-gap-2 tw-text-iron-300">
      <span className="tw-text-sm tw-font-semibold">Transfer</span>
      <FontAwesomeIcon icon={faRightLeft} className="tw-size-3.5" />
    </div>
  );

  const quantityToggle = max > 1 && (
    <div className="tw-flex tw-items-center tw-justify-center tw-gap-0.5 tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-0.5 tw-font-medium tw-shadow-sm">
      <button
        type="button"
        onClick={() => t.decQty(key)}
        disabled={selectedQty <= 1}
        aria-label="Decrease quantity"
        className={`tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-colors focus:tw-outline-none ${
          selectedQty <= 1
            ? "tw-cursor-not-allowed tw-bg-transparent tw-text-iron-600"
            : "tw-cursor-pointer tw-bg-iron-800 tw-text-iron-100 hover:tw-bg-iron-700"
        }`}
        data-testid="transfer-single-minus"
      >
        <FontAwesomeIcon icon={faMinus} className="tw-size-3" />
      </button>
      <div className="tw-min-w-8 tw-select-none tw-text-center tw-text-xs tw-font-semibold tw-tabular-nums tw-leading-none tw-text-iron-300">
        {selectedQty}/{max}
      </div>
      <button
        type="button"
        onClick={() => t.incQty(key)}
        disabled={selectedQty >= max}
        aria-label="Increase quantity"
        className={`tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-p-0 tw-transition-colors focus:tw-outline-none ${
          selectedQty >= max
            ? "tw-cursor-not-allowed tw-border-primary-500/10 tw-bg-primary-500/20 tw-text-iron-500"
            : "tw-cursor-pointer tw-border-primary-500 tw-bg-primary-500 tw-text-iron-100 hover:tw-border-primary-400 hover:tw-bg-primary-400"
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
      className="tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      data-testid="transfer-single-submit"
    >
      <span>Transfer</span>
      <FontAwesomeIcon
        aria-hidden="true"
        icon={faRightLeft}
        className="tw-size-3.5"
      />
    </button>
  );

  return (
    <div
      className="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-3 tw-text-iron-200 tw-shadow-sm"
      data-testid="transfer-single"
    >
      {children ? (
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-min-w-0 tw-flex-1">{children}</div>
          <div className="tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-gap-3">
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

          <div>{transferButton}</div>
        </>
      )}
      <TransferModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
