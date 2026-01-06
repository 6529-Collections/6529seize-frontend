"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { CollectedCollectionType } from "@/entities/IProfile";
import { ContractType } from "@/enums";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import styles from "@/styles/Home.module.scss";
import {
  faMinusCircle,
  faPlusCircle,
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

function TransferSingleImpl(props: TransferSingleProps) {
  const {
    collectionType,
    contractType,
    contract,
    tokenId,
    title,
    max,
    thumbUrl,
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

  return (
    <div className={styles["shadowBox"]} data-testid="transfer-single">
      <div className="tw-flex tw-items-center tw-gap-5">
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-text-lg tw-font-medium">Transfer</span>
          <FontAwesomeIcon icon={faRightLeft} />
        </div>
        {max > 1 && (
          <div className="tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-full tw-bg-primary-500 tw-p-1 tw-font-medium">
            <button
              type="button"
              onClick={() => t.decQty(key)}
              disabled={selectedQty <= 1}
              aria-label="Decrease quantity"
              className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none"
              data-testid="transfer-single-minus"
            >
              <FontAwesomeIcon
                icon={faMinusCircle}
                className="tw-size-6 tw-cursor-pointer"
                color={selectedQty <= 1 ? "#aaa" : "#fff"}
              />
            </button>
            <div className="tw-min-w-[2ch] tw-select-none tw-text-center tw-text-sm tw-tabular-nums">
              {selectedQty}/{max}
            </div>
            <button
              type="button"
              onClick={() => t.incQty(key)}
              disabled={selectedQty >= max}
              aria-label="Increase quantity"
              className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 focus:tw-outline-none"
              data-testid="transfer-single-plus"
            >
              <FontAwesomeIcon
                icon={faPlusCircle}
                className="tw-size-6 tw-cursor-pointer"
                color={selectedQty >= max ? "#aaa" : "#fff"}
              />
            </button>
          </div>
        )}
      </div>

      <div className="tw-mt-4">
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
          className="tw-w-full tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#444] tw-bg-white tw-py-2 tw-text-lg tw-font-semibold tw-text-black disabled:tw-cursor-not-allowed disabled:tw-opacity-75"
          data-testid="transfer-single-submit"
        >
          {transferButtonText}
        </button>
      </div>
      <TransferModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
