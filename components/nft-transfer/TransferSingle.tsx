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

  const transferButtonText = useMemo(() => {
    if (contractType === ContractType.ERC721) {
      return "Transfer";
    }
    if (selectedQty > 1) {
      return `Transfer ${selectedQty} copies`;
    }
    return "Transfer 1 copy";
  }, [selectedQty, contractType]);

  if (isMobileDevice) {
    return null;
  }

  const transferTitle = (
    <div className="tw-flex tw-items-center tw-gap-2">
      <span className="tw-text-lg tw-font-medium">Transfer</span>
      <FontAwesomeIcon icon={faRightLeft} />
    </div>
  );

  const quantityToggle = max > 1 && (
    <div className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-p-1 tw-font-medium">
      <button
        type="button"
        onClick={() => t.decQty(key)}
        disabled={selectedQty <= 1}
        aria-label="Decrease quantity"
        className={`tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-colors focus:tw-outline-none ${
          selectedQty <= 1
            ? "tw-cursor-not-allowed tw-bg-transparent tw-text-iron-600"
            : "tw-cursor-pointer tw-bg-transparent tw-text-iron-200 hover:tw-bg-iron-800 hover:tw-text-iron-100"
        }`}
        data-testid="transfer-single-minus"
      >
        <FontAwesomeIcon
          icon={faMinus}
          className="tw-size-3"
        />
      </button>
      <div className="tw-min-w-9 tw-select-none tw-text-center tw-text-sm tw-font-semibold tw-leading-none tw-text-iron-100 tw-tabular-nums">
        {selectedQty}/{max}
      </div>
      <button
        type="button"
        onClick={() => t.incQty(key)}
        disabled={selectedQty >= max}
        aria-label="Increase quantity"
        className={`tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-p-0 tw-transition-colors focus:tw-outline-none ${
          selectedQty >= max
            ? "tw-cursor-not-allowed tw-border-primary-500/15 tw-bg-primary-500/30 tw-text-iron-100/40"
            : "tw-cursor-pointer tw-border-primary-500 tw-bg-primary-500 tw-text-iron-100 hover:tw-border-primary-400 hover:tw-bg-primary-400"
        }`}
        data-testid="transfer-single-plus"
      >
        <FontAwesomeIcon
          icon={faPlus}
          className="tw-size-3"
        />
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
      className="tw-min-w-40 tw-rounded-lg tw-border-2 tw-border-solid tw-border-white tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-black disabled:tw-cursor-not-allowed disabled:tw-opacity-75"
      data-testid="transfer-single-submit"
    >
      {transferButtonText}
    </button>
  );

  return (
    <div
      className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-4 tw-text-white"
      data-testid="transfer-single"
    >
      {children ? (
        <div className="tw-flex tw-items-center tw-gap-5">
          <div className="tw-min-w-0 tw-flex-1">{children}</div>
          <div className="tw-ml-auto tw-flex tw-shrink-0 tw-items-center tw-gap-4">
            {quantityToggle}
            {transferButton}
          </div>
        </div>
      ) : (
        <>
          <div className="tw-flex tw-items-center tw-gap-5">
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
