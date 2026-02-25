"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { DELEGATION_ABI } from "@/abis/abis";
import { useAuth } from "@/components/auth/Auth";
import { PRIMARY_ADDRESS_USE_CASE } from "@/components/delegation/delegation-constants";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import OpenseaIcon from "@/components/user/utils/icons/OpenseaIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";
import type { ApiWallet } from "@/generated/models/ApiWallet";
import { getTransactionLink } from "@/helpers/Helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

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
              className="tw-text-primary-400 tw-underline"
            >
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
      <div className="tw-group tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-py-1">
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-0.5">
            <span className="tw-text-xs tw-font-normal tw-text-iron-400 tw-font-mono">
              {title === "Copied!" ? (
                <span className="tw-text-primary-400">{title}</span>
              ) : (
                title
              )}
            </span>
            <UserPageIdentityStatementsConsolidatedAddressesItemPrimary
              isPrimary={isPrimary}
              canEdit={canEdit}
              assignPrimary={assignPrimary}
              isAssigningPrimary={assigningPrimary}
            />
          </div>
          {address.display && (
            <div className="tw-text-xs tw-font-semibold tw-font-mono tw-text-iron-200 tw-truncate tw-max-w-[130px]">
              {address.display}
            </div>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-3 lg:tw-gap-2 tw-ml-auto tw-flex-shrink-0">
          <button
            onClick={goToEtherscan}
            aria-label="Go to Etherscan"
            className="tw-border-none tw-bg-transparent tw-p-1.5 lg:tw-p-0 tw-cursor-pointer tw-text-iron-500 hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out"
            data-tooltip-id={`etherscan-tooltip-${address.wallet}`}
            {...(!isTouchScreen ? { "data-tooltip-content": "Etherscan" } : null)}
          >
            <div className="tw-h-5 tw-w-5 lg:tw-h-4 lg:tw-w-4 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center">
              <EtherscanIcon />
            </div>
          </button>
          {!isTouchScreen && (
            <Tooltip
              id={`etherscan-tooltip-${address.wallet}`}
              place="top"
              positionStrategy="fixed"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}
            />
          )}
          <button
            onClick={goToOpensea}
            aria-label="Go to Opensea"
            className="tw-border-none tw-bg-transparent tw-p-1.5 lg:tw-p-0 tw-cursor-pointer tw-text-iron-500 hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out"
            data-tooltip-id={`opensea-tooltip-${address.wallet}`}
            {...(isTouchScreen ? null : { "data-tooltip-content": "Opensea" })}
          >
            <div className="tw-h-5 tw-w-5 lg:tw-h-4 lg:tw-w-4 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center">
              <OpenseaIcon />
            </div>
          </button>
          {!isTouchScreen && (
            <Tooltip
              id={`opensea-tooltip-${address.wallet}`}
              place="top"
              positionStrategy="fixed"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}
            />
          )}
          <button
            aria-label="Copy address"
            className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-1.5 lg:tw-p-0 tw-text-iron-600 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-200 focus:tw-outline-none"
            onClick={handleCopy}
            data-tooltip-id={`copy-tooltip-${address.wallet}`}
            {...(!isTouchScreen ? { "data-tooltip-content": "Copy" } : null)}
          >
            <div className="tw-h-5 tw-w-5 lg:tw-h-4 lg:tw-w-4 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center [&>svg]:tw-w-full [&>svg]:tw-h-full">
              <CopyIcon />
            </div>
          </button>
          {!isTouchScreen && (
            <Tooltip
              id={`copy-tooltip-${address.wallet}`}
              place="top"
              positionStrategy="fixed"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}
            />
          )}
        </div>
      </div>
      {statusMessage && (
        <div className="tw-pt-2 tw-text-xs tw-font-medium tw-text-iron-200">
          {statusMessage}
        </div>
      )}
    </li>
  );
}
