"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT,
  COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE,
  CollectedCollectionType,
} from "@/entities/IProfile";
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
import { buildTransferKey, useTransfer } from "./TransferState";

export default function TransferSingle({
  collectionType,
  contractType,
  contract,
  tokenId,
  max,
  thumbUrl,
  title,
}: {
  readonly collectionType: CollectedCollectionType;
  readonly contractType: ContractType;
  readonly contract: string;
  readonly tokenId: number;
  readonly title: string;
  readonly max: number;
  readonly thumbUrl?: string;
}) {
  const { isMobileDevice } = useDeviceInfo();

  const t = useTransfer();

  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();
  const wantModalAfterConnect = useRef(false);

  const key = useMemo(
    () =>
      buildTransferKey({
        collection: contract,
        tokenId,
      }),
    [contract, tokenId]
  );

  useEffect(() => {
    t.select({
      key,
      contract: COLLECTED_COLLECTION_TYPE_TO_CONTRACT[collectionType],
      contractType: COLLECTED_COLLECTION_TYPE_TO_CONTRACT_TYPE[
        collectionType
      ] as ContractType,
      tokenId,
      max,
      thumbUrl,
      title,
    });

    return () => {
      t.unselect(key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, collectionType, tokenId, max, thumbUrl, title]);

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

  const displayQty = selectedQty > 0 ? selectedQty : 1;

  const [showModal, setShowModal] = useState(false);

  const transferButtonText = useMemo(() => {
    if (contractType === ContractType.ERC721) {
      return "Transfer";
    }
    if (displayQty > 1) {
      return `Transfer ${displayQty} copies`;
    }
    return "Transfer 1 copy";
  }, [displayQty, contractType]);

  if (isMobileDevice) {
    return null;
  }

  return (
    <div className={styles.shadowBox} data-testid="transfer-single">
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-lg tw-font-medium">Transfer</span>
        <FontAwesomeIcon icon={faRightLeft} />
      </div>
      {max > 1 && (
        <div className="tw-mt-4 tw-flex tw-items-center tw-gap-1">
          <FontAwesomeIcon
            icon={faMinusCircle}
            onClick={() => t.decQty(key)}
            className="tw-size-6 tw-cursor-pointer"
            color={selectedQty <= 1 ? "#60606C" : "#fff"}
            aria-disabled={selectedQty <= 1}
            data-testid="transfer-single-minus"
          />
          <div className="tw-min-w-[2ch] tw-text-center tw-text-xs tw-tabular-nums tw-select-none">
            {selectedQty}
          </div>
          <FontAwesomeIcon
            icon={faPlusCircle}
            onClick={() => t.incQty(key)}
            className="tw-size-6 tw-cursor-pointer"
            color={selectedQty >= max ? "#60606C" : "#fff"}
            aria-disabled={selectedQty >= max}
            data-testid="transfer-single-plus"
          />
        </div>
      )}

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
          className="tw-w-full tw-py-2 tw-rounded-lg tw-bg-white tw-text-black tw-py-1 disabled:tw-opacity-75 disabled:tw-cursor-not-allowed tw-border-1 tw-border-solid tw-border-[#444] tw-text-lg tw-font-semibold"
          data-testid="transfer-single-submit">
          {transferButtonText}
        </button>
      </div>
      <TransferModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
