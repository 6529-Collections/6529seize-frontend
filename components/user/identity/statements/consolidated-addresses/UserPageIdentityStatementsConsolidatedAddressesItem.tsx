"use client";

import { DELEGATION_ABI } from "@/abis";
import { useAuth } from "@/components/auth/Auth";
import { PRIMARY_ADDRESS_USE_CASE } from "@/components/delegation/delegation-constants";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import OpenseaIcon from "@/components/user/utils/icons/OpenseaIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import {
    DELEGATION_ALL_ADDRESS,
    DELEGATION_CONTRACT,
    NEVER_DATE,
} from "@/constants";
import { ApiWallet } from "@/generated/models/ApiWallet";
import { getTransactionLink } from "@/helpers/Helpers";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import UserPageIdentityStatementsConsolidatedAddressesItemPrimary from "./UserPageIdentityStatementsConsolidatedAddressesItemPrimary";

export default function UserPageIdentityStatementsConsolidatedAddressesItem({
  address,
  primaryAddress,
  canEdit,
}: {
  readonly address: ApiWallet;
  readonly primaryAddress: string | null;
  readonly canEdit: boolean;
}) {
  const { setToast } = useAuth();

  const goToOpensea = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    window.open(`https://opensea.io/${address.wallet}`, "_blank");
  };

  const goToEtherscan = () => {
    window.open(`https://etherscan.io/address/${address.wallet}`, "_blank");
  };

  const isPrimary =
    address.wallet.toLowerCase() === primaryAddress?.toLowerCase();

  const [title, setTitle] = useState(address.wallet.slice(0, 6));
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard(address.wallet);
    setTitle("Copied!");
    setTimeout(() => {
      setTitle(address.wallet.slice(0, 6));
    }, 1000);
  };
  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const [assigningPrimary, setAssigningPrimary] = useState(false);
  const [statusMessage, setStatusMessage] = useState<any>();

  const writeDelegation = useWriteContract();

  const waitWriteDelegation = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: writeDelegation.data,
  });

  function getError(e: any) {
    return e.message.split("Request Arguments")[0];
  }

  useEffect(() => {
    if (writeDelegation.isPending) {
      setStatusMessage("Confirm in your wallet...");
    } else if (writeDelegation.data) {
      let trxLink = (
        <>
          {writeDelegation.data && (
            <a
              href={getTransactionLink(
                DELEGATION_CONTRACT.chain_id,
                writeDelegation.data
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-primary-400 tw-underline">
              View Transaction
            </a>
          )}
        </>
      );
      if (waitWriteDelegation.isLoading) {
        setStatusMessage(<>Waiting for confirmation... {trxLink}</>);
      } else if (waitWriteDelegation.data) {
        setStatusMessage(
          <>
            Confirmed! Check back in a few minutes to see the change. {trxLink}
          </>
        );
        setToast({
          type: "success",
          message: "Primary address set successfully",
        });
      } else if (waitWriteDelegation.error) {
        setStatusMessage(
          <>
            Error: {getError(waitWriteDelegation.error)} {trxLink}
          </>
        );
        setToast({
          type: "error",
          message: `Error setting primary address: ${getError(
            waitWriteDelegation.error
          )}`,
        });
      }
    } else {
      setStatusMessage(undefined);
    }
  }, [writeDelegation.status, waitWriteDelegation.status]);

  const assignPrimary = async () => {
    setAssigningPrimary(true);
    writeDelegation.writeContract({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: "registerDelegationAddress",
      args: [
        DELEGATION_ALL_ADDRESS,
        address.wallet,
        NEVER_DATE,
        PRIMARY_ADDRESS_USE_CASE.use_case,
        true,
        0,
      ],
    });
  };

  return (
    <li>
      <div className="tw-h-5 tw-group tw-flex tw-items-center tw-group tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-200 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
        <button
          onClick={goToOpensea}
          aria-label="Go to Opensea"
          className="tw-bg-transparent tw-border-none tw-p-0"
          data-tooltip-id={`opensea-tooltip-${address.wallet}`}
          data-tooltip-content={isTouchScreen ? undefined : "Opensea"}>
          <div className="tw-flex-shrink-0 tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
            <OpenseaIcon />
          </div>
        </button>
        {!isTouchScreen && (
          <Tooltip
            id={`opensea-tooltip-${address.wallet}`}
            place="top"
            positionStrategy="fixed"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          />
        )}
        <button
          onClick={goToEtherscan}
          aria-label="Go to Etherscan"
          className="tw-bg-transparent tw-border-none tw-p-0"
          data-tooltip-id={`etherscan-tooltip-${address.wallet}`}
          data-tooltip-content={isTouchScreen ? undefined : "Etherscan"}>
          <div className="tw-flex-shrink-0 tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
            <EtherscanIcon />
          </div>
        </button>
        {!isTouchScreen && (
          <Tooltip
            id={`etherscan-tooltip-${address.wallet}`}
            place="top"
            positionStrategy="fixed"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          />
        )}
        <div className="tw-space-x-3 tw-inline-flex tw-items-center">
          <div className="tw-truncate md:tw-max-w-[8rem] lg:tw-max-w-[11rem] tw-text-iron-200">
            <span>
              {title === "Copied!" ? (
                <span className="tw-text-primary-400">{title}</span>
              ) : (
                title
              )}
            </span>
            {address.display && (
              <span className="tw-ml-3">{address.display}</span>
            )}
          </div>
          <div className="tw-inline-flex tw-items-center">
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 6L9 17L4 12"
                stroke="#3CCB7F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <UserPageIdentityStatementsConsolidatedAddressesItemPrimary
              isPrimary={isPrimary}
              canEdit={canEdit}
              address={address}
              assignPrimary={assignPrimary}
              isAssigningPrimary={assigningPrimary}
            />
            <button
              aria-label="Copy address"
              className={`${
                isTouchScreen
                  ? "tw-opacity-100"
                  : "tw-opacity-0 group-hover:tw-opacity-100"
              } tw-ml-2 tw-p-1.5 tw-bg-transparent tw-cursor-pointer tw-text-xs tw-font-semibold tw-text-iron-400 hover:tw-text-iron-200 tw-border-0 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out`}
              onClick={handleCopy}
              data-tooltip-id={`copy-tooltip-${address.wallet}`}
              data-tooltip-content={isTouchScreen ? undefined : "Copy"}>
              <CopyIcon />
            </button>
            {!isTouchScreen && (
              <Tooltip
                id={`copy-tooltip-${address.wallet}`}
                place="top"
                positionStrategy="fixed"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              />
            )}
          </div>
        </div>
      </div>
      {statusMessage && (
        <div className="pt-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-200 d-flex flex-column gap-1">
          {statusMessage}
        </div>
      )}
    </li>
  );
}
