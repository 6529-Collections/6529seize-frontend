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
import { useEffect, useMemo, useRef, useState } from "react";
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
}

export default function TransferSingle(props: TransferSingleProps) {
  return (
    <TransferProvider>
      <TransferSingleImpl {...props} />
    </TransferProvider>
  );
}

export function TransferSingleActions(props: TransferSingleProps) {
  return (
    <TransferProvider>
      <TransferSingleActionsImpl {...props} layout="inline" />
    </TransferProvider>
  );
}

function TransferSingleImpl(props: TransferSingleProps) {
  const { isMobileDevice } = useDeviceInfo();

  if (isMobileDevice) {
    return null;
  }

  return (
    <div
      className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-shadow-2xl tw-ring-1 tw-ring-white/5"
      data-testid="transfer-single"
    >
      <TransferSingleActionsImpl {...props} layout="stacked" />
    </div>
  );
}

function TransferSingleActionsImpl(
  props: TransferSingleProps & {
    readonly layout: "inline" | "stacked";
  }
) {
  const {
    collectionType,
    contractType,
    contract,
    tokenId,
    title,
    max,
    thumbUrl,
  } = props;
  const { selected, select, unselect, incQty, decQty } = useTransfer();

  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const wantModalAfterConnect = useRef(false);
  const [showModal, setShowModal] = useState(false);

  const key = useMemo(
    () =>
      buildTransferKey({
        collection: collectionType,
        tokenId,
      }),
    [collectionType, tokenId]
  );

  useEffect(() => {
    select({
      key,
      contract,
      contractType,
      tokenId,
      max,
      thumbUrl,
      title,
    });

    return () => {
      unselect(key);
    };
  }, [
    key,
    tokenId,
    max,
    thumbUrl,
    title,
    contract,
    contractType,
    select,
    unselect,
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

  const selectedQty = selected.get(key)?.qty ?? 0;

  const transferButtonText = useMemo(() => {
    if (contractType === ContractType.ERC721) {
      return "Transfer";
    }
    if (selectedQty > 1) {
      return `Transfer ${selectedQty} copies`;
    }
    return "Transfer 1 copy";
  }, [selectedQty, contractType]);

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
        onClick={() => decQty(key)}
        disabled={selectedQty <= 1}
        aria-label="Decrease quantity"
        className={`tw-flex tw-size-[1.875rem] tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-all focus:tw-outline-none ${
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
        onClick={() => incQty(key)}
        disabled={selectedQty >= max}
        aria-label="Increase quantity"
        className={`tw-flex tw-size-[1.875rem] tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-p-0 tw-transition-all focus:tw-outline-none ${
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
          void seizeConnect();
          return;
        }
        setShowModal(true);
      }}
      aria-label={transferButtonText}
      className="tw-flex tw-h-10 tw-flex-1 tw-items-center tw-justify-center tw-gap-x-2 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-white tw-px-5 tw-text-sm tw-font-bold tw-text-black tw-transition-all tw-duration-200 hover:tw-bg-iron-100 active:tw-scale-[0.98] disabled:tw-cursor-not-allowed disabled:tw-opacity-50 @lg:tw-flex-none"
      data-testid="transfer-single-submit"
    >
      <span>{transferButtonText}</span>
      <FontAwesomeIcon
        aria-hidden="true"
        icon={faRightLeft}
        className="tw-size-3"
      />
    </button>
  );

  if (props.layout === "inline") {
    return (
      <>
        <div className="tw-flex tw-w-full tw-max-w-full tw-flex-nowrap tw-items-center tw-justify-end tw-gap-4">
          {quantityToggle}
          {transferButton}
        </div>
        <TransferModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <div className="tw-flex tw-items-center tw-gap-3">
        {transferTitle}
        {quantityToggle}
      </div>

      <div className="tw-mt-4">{transferButton}</div>
      <TransferModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
